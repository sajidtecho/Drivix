import os
import shutil
import json
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from feature_engineering import build_preprocessor_pipeline, FEATURE_COLUMNS_RAW
from predict import get_inference_engine

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(BASE_DIR, "models")
ARCHIVE_DIR = os.path.join(MODELS_DIR, "archive")
DATA_DIR = os.path.join(BASE_DIR, "data", "processed")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
HISTORY_FILE = os.path.join(REPORTS_DIR, "retraining_history.json")

MODEL_PATH = os.path.join(MODELS_DIR, "drivix_price_model.pkl")
TRAIN_DATA_PATH = os.path.join(DATA_DIR, "train_dataset.csv")
TEST_DATA_PATH = os.path.join(DATA_DIR, "test_dataset.csv")

class DrivixRetrainingPipeline:
    def __init__(self):
        os.makedirs(ARCHIVE_DIR, exist_ok=True)
        os.makedirs(REPORTS_DIR, exist_ok=True)

    def load_training_data(self) -> pd.DataFrame:
        """
        Loads baseline training data and merges newly logged production records if available.
        """
        if not os.path.exists(TRAIN_DATA_PATH):
            raise FileNotFoundError(f"Training dataset not found at {TRAIN_DATA_PATH}")

        df_base = pd.read_csv(TRAIN_DATA_PATH)

        # Ingest recent production inference logs if present
        log_file = os.path.join(BASE_DIR, "data", "inference_logs.jsonl")
        if os.path.exists(log_file):
            new_rows = []
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        try:
                            record = json.loads(line)
                            feats = record.get("features", {})
                            pred = record.get("prediction", {})
                            if feats and "predicted_occupancy_rate" in pred:
                                row = feats.copy()
                                # Ground-truth proxy for retraining feedback
                                row["y_reserved_occupancy_rate"] = pred["predicted_occupancy_rate"]
                                row["target_occupancy_rate"] = pred["predicted_occupancy_rate"]
                                new_rows.append(row)
                        except Exception:
                            continue
            if new_rows:
                df_logs = pd.DataFrame(new_rows)
                # Keep common features
                common_cols = [c for c in df_base.columns if c in df_logs.columns]
                if len(common_cols) >= 5:
                    df_base = pd.concat([df_base, df_logs[common_cols]], ignore_index=True)

        return df_base

    def run_retraining(self, force_promote: bool = False) -> dict:
        """
        Executes automated model retraining and champion-challenger evaluation gate.
        """
        start_time = datetime.now()
        df_train = self.load_training_data()
        df_test = pd.read_csv(TEST_DATA_PATH)

        target_col = 'y_reserved_occupancy_rate' if 'y_reserved_occupancy_rate' in df_train.columns else 'target_occupancy_rate'
        X_train = df_train[FEATURE_COLUMNS_RAW]
        y_train = df_train[target_col]

        X_test = df_test[FEATURE_COLUMNS_RAW]
        y_test = df_test[target_col]

        # 1. Build & Train Challenger Pipeline
        preprocessor = build_preprocessor_pipeline(scale_numeric=False)
        challenger_regressor = XGBRegressor(
            n_estimators=180,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=1
        )

        from sklearn.pipeline import Pipeline
        challenger_pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', challenger_regressor)
        ])

        challenger_pipeline.fit(X_train, y_train)

        # 2. Evaluate Challenger Model on out-of-time Test Set
        y_pred_challenger = challenger_pipeline.predict(X_test)
        y_pred_challenger = np.clip(y_pred_challenger, 0.0, 1.0)

        challenger_mae = float(mean_absolute_error(y_test, y_pred_challenger))
        challenger_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_challenger)))
        challenger_r2 = float(r2_score(y_test, y_pred_challenger))

        # 3. Evaluate Current Production Champion
        champion_mae = 999.0
        champion_rmse = 999.0
        champion_r2 = -999.0

        if os.path.exists(MODEL_PATH):
            try:
                champion_pipeline = joblib.load(MODEL_PATH)
                y_pred_champion = champion_pipeline.predict(X_test)
                y_pred_champion = np.clip(y_pred_champion, 0.0, 1.0)
                champion_mae = float(mean_absolute_error(y_test, y_pred_champion))
                champion_rmse = float(np.sqrt(mean_squared_error(y_test, y_pred_champion)))
                champion_r2 = float(r2_score(y_test, y_pred_champion))
            except Exception as e:
                print(f"[Retraining] Warning evaluating current champion: {e}")

        # 4. Champion vs Challenger Decision Gate
        # Challenger is promoted if MAE improves or stays within 1.0% tolerance, or force_promote is True
        is_promoted = bool(
            force_promote or (challenger_mae <= champion_mae * 1.01)
        )

        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        archived_model_path = None

        if is_promoted:
            # Archive current champion
            if os.path.exists(MODEL_PATH):
                archived_model_path = os.path.join(ARCHIVE_DIR, f"champion_{timestamp_str}.pkl")
                shutil.copy2(MODEL_PATH, archived_model_path)

            # Deploy new challenger as champion
            joblib.dump(challenger_pipeline, MODEL_PATH)

            # Reload global inference engine
            try:
                engine = get_inference_engine()
                engine.pipeline = challenger_pipeline
                print("[Retraining] Successfully swapped production model in memory.")
            except Exception as e:
                print(f"[Retraining] Error reloading in-memory engine: {e}")

        duration_sec = round((datetime.now() - start_time).total_seconds(), 2)

        result = {
            "retraining_id": f"retrain_{timestamp_str}",
            "timestamp": datetime.now().isoformat(),
            "duration_seconds": duration_sec,
            "status": "COMPLETED",
            "promotion_status": "PROMOTED_CHAMPION" if is_promoted else "REJECTED_CHALLENGER",
            "champion_metrics": {
                "mae": round(champion_mae, 4),
                "rmse": round(champion_rmse, 4),
                "r2": round(champion_r2, 4)
            },
            "challenger_metrics": {
                "mae": round(challenger_mae, 4),
                "rmse": round(challenger_rmse, 4),
                "r2": round(challenger_r2, 4)
            },
            "training_samples_count": len(df_train),
            "validation_samples_count": len(df_test),
            "archived_model": os.path.basename(archived_model_path) if archived_model_path else None
        }

        # Append to history log
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    history = json.load(f)
            except Exception:
                history = []

        history.append(result)
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)

        return result
