import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import SGDRegressor

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(BASE_DIR, "models")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
ONLINE_MODEL_PATH = os.path.join(MODELS_DIR, "online_learner.joblib")
CHECKPOINT_PATH = os.path.join(REPORTS_DIR, "online_learning_checkpoint.json")

from feature_engineering import FEATURE_COLUMNS_RAW, build_preprocessor_pipeline


class DrivixOnlineLearner:
    """
    Online Adaptive Learning System for Drivix Dynamic Pricing.
    
    Uses an incremental SGDRegressor with adaptive learning rate to learn
    real-time concept drift and demand residuals directly from live database
    events (bookings, check-ins, check-outs) without requiring full retraining.
    
    Formula:
        y_residual = y_actual - y_champion_baseline
        online_regressor.partial_fit(X_trans, y_residual)
        y_final = clip(y_champion_baseline + lambda * y_residual_hat, 0.0, 1.0)
    """

    def __init__(
        self,
        blend_weight: float = 0.35,
        max_residual_clamp: float = 0.30,
        eta0: float = 0.015,
        alpha: float = 1e-4
    ):
        os.makedirs(MODELS_DIR, exist_ok=True)
        os.makedirs(REPORTS_DIR, exist_ok=True)

        self.blend_weight = float(blend_weight)
        self.max_residual_clamp = float(max_residual_clamp)
        self.eta0 = float(eta0)
        self.alpha = float(alpha)

        self.is_initialized = False
        self.total_samples_trained = 0
        self.running_mae = 0.0
        self.last_sync_timestamp: Optional[str] = None
        self.last_updated_at: Optional[str] = None
        self.recent_losses: List[float] = []

        # Incremental Regressor
        self.model = SGDRegressor(
            loss="squared_error",
            penalty="l2",
            alpha=self.alpha,
            learning_rate="adaptive",
            eta0=self.eta0,
            warm_start=True,
            random_state=42
        )

        self.preprocessor = self._load_or_build_preprocessor()
        self._load_state()

    def _load_or_build_preprocessor(self):
        """Loads fitted preprocessor from disk or initializes one."""
        prep_path = os.path.join(MODELS_DIR, "preprocessor.joblib")
        if os.path.exists(prep_path):
            try:
                return joblib.load(prep_path)
            except Exception as e:
                print(f"[Online Learner] Warning loading preprocessor: {e}")

        # Check champion pipeline
        champ_path = os.path.join(MODELS_DIR, "drivix_price_model.pkl")
        if os.path.exists(champ_path):
            try:
                champ = joblib.load(champ_path)
                if hasattr(champ, "named_steps") and "preprocessor" in champ.named_steps:
                    return champ.named_steps["preprocessor"]
            except Exception:
                pass

        # Fallback to fresh pipeline fit on training dataset
        train_csv = os.path.join(BASE_DIR, "data", "processed", "train_dataset.csv")
        pipe = build_preprocessor_pipeline(scale_numeric=True)
        if os.path.exists(train_csv):
            try:
                df = pd.read_csv(train_csv)
                pipe.fit(df[FEATURE_COLUMNS_RAW])
                joblib.dump(pipe, prep_path)
            except Exception as e:
                print(f"[Online Learner] Error fitting fallback preprocessor: {e}")
        return pipe

    def _load_state(self):
        """Restores persisted online model weights and telemetry."""
        if os.path.exists(ONLINE_MODEL_PATH):
            try:
                saved = joblib.load(ONLINE_MODEL_PATH)
                self.model = saved.get("model", self.model)
                self.is_initialized = saved.get("is_initialized", True)
                self.blend_weight = saved.get("blend_weight", self.blend_weight)
            except Exception as e:
                print(f"[Online Learner] Warning loading online model: {e}")

        if os.path.exists(CHECKPOINT_PATH):
            try:
                with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                    self.total_samples_trained = meta.get("total_samples_trained", 0)
                    self.running_mae = meta.get("running_mae", 0.0)
                    self.last_sync_timestamp = meta.get("last_sync_timestamp")
                    self.last_updated_at = meta.get("last_updated_at")
                    self.recent_losses = meta.get("recent_losses", [])[-20:]
            except Exception:
                pass

    def save_state(self):
        """Persists online model weights and checkpoint metadata."""
        try:
            joblib.dump({
                "model": self.model,
                "is_initialized": self.is_initialized,
                "blend_weight": self.blend_weight,
                "updated_at": datetime.now().isoformat()
            }, ONLINE_MODEL_PATH)

            meta = {
                "total_samples_trained": self.total_samples_trained,
                "running_mae": round(float(self.running_mae), 5),
                "last_sync_timestamp": self.last_sync_timestamp,
                "last_updated_at": self.last_updated_at,
                "blend_weight": self.blend_weight,
                "is_initialized": self.is_initialized,
                "recent_losses": [round(x, 5) for x in self.recent_losses[-20:]]
            }
            with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)
        except Exception as e:
            print(f"[Online Learner] Warning saving state: {e}")

    def reset(self):
        """Resets online learner state and weights."""
        self.model = SGDRegressor(
            loss="squared_error",
            penalty="l2",
            alpha=self.alpha,
            learning_rate="adaptive",
            eta0=self.eta0,
            warm_start=True,
            random_state=42
        )
        self.is_initialized = False
        self.total_samples_trained = 0
        self.running_mae = 0.0
        self.last_sync_timestamp = None
        self.last_updated_at = None
        self.recent_losses = []
        if os.path.exists(ONLINE_MODEL_PATH):
            try:
                os.remove(ONLINE_MODEL_PATH)
            except Exception:
                pass
        self.save_state()

    def update_from_batch(
        self,
        X_df: pd.DataFrame,
        y_actual: pd.Series,
        champion_predict_fn=None,
        latest_timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Incrementally updates online model weights using a batch of new database records.
        """
        if X_df.empty or len(y_actual) == 0:
            return {
                "samples_trained": 0,
                "total_samples_trained": self.total_samples_trained,
                "message": "No new records to train on"
            }

        # 1. Transform features
        X_trans = self.preprocessor.transform(X_df[FEATURE_COLUMNS_RAW])

        # 2. Compute baseline predictions from champion model
        if champion_predict_fn is not None:
            try:
                y_base = champion_predict_fn(X_df[FEATURE_COLUMNS_RAW])
            except Exception:
                y_base = np.full(len(y_actual), 0.50)
        else:
            y_base = np.full(len(y_actual), 0.50)

        # 3. Target residual = y_actual - y_base
        residuals = np.array(y_actual) - np.array(y_base)
        residuals = np.clip(residuals, -0.60, 0.60)

        # 4. Incremental SGD step
        self.model.partial_fit(X_trans, residuals)
        self.is_initialized = True

        # 5. Measure batch fit metrics
        pred_residuals = self.model.predict(X_trans)
        batch_mae = float(np.mean(np.abs(residuals - pred_residuals)))

        # Update running MAE (exponential moving average)
        if self.running_mae == 0.0:
            self.running_mae = batch_mae
        else:
            self.running_mae = 0.85 * self.running_mae + 0.15 * batch_mae

        self.total_samples_trained += len(y_actual)
        self.recent_losses.append(batch_mae)
        self.last_updated_at = datetime.now().isoformat()
        if latest_timestamp:
            self.last_sync_timestamp = latest_timestamp.isoformat()

        # Save checkpoint
        self.save_state()

        return {
            "samples_trained": len(y_actual),
            "total_samples_trained": self.total_samples_trained,
            "batch_mae": round(batch_mae, 4),
            "running_mae": round(self.running_mae, 4),
            "last_sync_timestamp": self.last_sync_timestamp,
            "status": "ONLINE_MODEL_UPDATED"
        }

    def update_from_single_event(
        self,
        features_dict: Dict[str, Any],
        actual_occupancy: float,
        champion_predict_fn=None
    ) -> Dict[str, Any]:
        """
        Incrementally trains on a single live streaming booking/check-in event.
        """
        df = pd.DataFrame([features_dict])
        for col in FEATURE_COLUMNS_RAW:
            if col not in df.columns:
                df[col] = np.nan

        y_series = pd.Series([float(actual_occupancy)])
        return self.update_from_batch(df, y_series, champion_predict_fn=champion_predict_fn)

    def predict_residual(self, X_df: pd.DataFrame) -> np.ndarray:
        """
        Predicts online residual adjustment for given raw features.
        """
        if not self.is_initialized or len(X_df) == 0:
            return np.zeros(len(X_df))

        try:
            X_trans = self.preprocessor.transform(X_df[FEATURE_COLUMNS_RAW])
            residuals = self.model.predict(X_trans)
            # Bound residual to prevent extreme drift
            return np.clip(residuals, -self.max_residual_clamp, self.max_residual_clamp)
        except Exception as e:
            print(f"[Online Learner] Error predicting residual: {e}")
            return np.zeros(len(X_df))

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive telemetry for observability and monitoring."""
        weights_norm = 0.0
        if hasattr(self.model, "coef_") and self.model.coef_ is not None:
            weights_norm = float(np.linalg.norm(self.model.coef_))

        return {
            "is_initialized": self.is_initialized,
            "total_samples_trained": self.total_samples_trained,
            "running_mae": round(float(self.running_mae), 5),
            "blend_weight": self.blend_weight,
            "max_residual_clamp": self.max_residual_clamp,
            "weights_l2_norm": round(weights_norm, 5),
            "last_sync_timestamp": self.last_sync_timestamp,
            "last_updated_at": self.last_updated_at,
            "recent_loss_trajectory": [round(x, 4) for x in self.recent_losses[-10:]],
            "algorithm": "Stochastic Gradient Descent (Adaptive SGDRegressor)"
        }


# Global singleton
_online_learner: Optional[DrivixOnlineLearner] = None

def get_online_learner() -> DrivixOnlineLearner:
    global _online_learner
    if _online_learner is None:
        _online_learner = DrivixOnlineLearner()
    return _online_learner
