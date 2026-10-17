import os
import joblib
import numpy as np
import pandas as pd
from feature_engineering import FEATURE_COLUMNS_RAW
from online_learner import get_online_learner

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "drivix_price_model.pkl")

class DrivixPricingInferenceEngine:
    def __init__(self, model_path=None, enable_online_learning=True):
        if model_path is None:
            model_path = MODEL_PATH
        if not os.path.exists(model_path):
            alt = os.path.join("models", "drivix_price_model.pkl")
            if os.path.exists(alt):
                model_path = alt
        
        self.enable_online_learning = enable_online_learning
        if os.path.exists(model_path):
            self.pipeline = joblib.load(model_path)
        else:
            self.pipeline = None
            print(f"Warning: Model artifact not found at {model_path}. Run training first.")

    def calculate_price_policy(
        self,
        predicted_occupancy,
        base_hourly_rate=60,
        duration_hours=2,
        online_applied=False,
        online_residual=0.0,
        base_occupancy=None
    ):
        """
        Translates predicted occupancy score to Drivix bounded pricing policy.
        """
        occ = np.clip(predicted_occupancy, 0.0, 1.0)
        
        if occ >= 0.85:
            multiplier = 1.05  # Maximum 5% fair surge for peak demand
            alert_label = "Peak Demand (+5% Fair Adjustment)"
            surge_active = True
        elif occ >= 0.70:
            multiplier = 1.03  # 3% fair surge for high demand
            alert_label = "High Demand (+3% Fair Adjustment)"
            surge_active = True
        elif occ >= 0.50:
            multiplier = 1.015  # 1.5% adjustment for moderate demand
            alert_label = "Moderate Demand (+1.5%)"
            surge_active = False
        elif occ >= 0.30:
            multiplier = 1.00  # Normal base rate
            alert_label = "Normal Base Rate"
            surge_active = False
        else:
            multiplier = 0.97  # 3% discount during off-peak
            alert_label = "Off-Peak Discount (3% Off)"
            surge_active = False

        hourly_price = round(base_hourly_rate * multiplier, 2)
        if isinstance(hourly_price, float) and hourly_price.is_integer():
            hourly_price = int(hourly_price)

        total_estimated_cost = round(hourly_price * duration_hours, 2)
        if isinstance(total_estimated_cost, float) and total_estimated_cost.is_integer():
            total_estimated_cost = int(total_estimated_cost)

        return {
            'predicted_occupancy_rate': round(float(occ), 4),
            'demand_score_percent': round(float(occ * 100), 1),
            'pricing_multiplier': float(multiplier),
            'alert_label': alert_label,
            'is_surge_active': surge_active,
            'recommended_hourly_price': hourly_price,
            'total_quoted_cost': total_estimated_cost,
            'online_learning_applied': bool(online_applied),
            'online_residual': round(float(online_residual), 4),
            'base_occupancy_rate': round(float(base_occupancy if base_occupancy is not None else occ), 4)
        }

    def predict_single(self, feature_dict, base_hourly_rate=60, use_online: bool = True):
        """
        Predicts demand and dynamic pricing for a single quote request,
        incorporating continuous online learning corrections if enabled.
        """
        if self.pipeline is None:
            raise RuntimeError("Model pipeline is not loaded. Train and serialize model first.")

        df_input = pd.DataFrame([feature_dict])
        
        # Ensure all required features are present
        for col in FEATURE_COLUMNS_RAW:
            if col not in df_input.columns:
                df_input[col] = np.nan

        pred_occ_base = float(self.pipeline.predict(df_input[FEATURE_COLUMNS_RAW])[0])
        pred_occ = pred_occ_base
        online_applied = False
        online_residual = 0.0

        if self.enable_online_learning and use_online:
            try:
                learner = get_online_learner()
                if learner.is_initialized:
                    res_array = learner.predict_residual(df_input[FEATURE_COLUMNS_RAW])
                    online_residual = float(res_array[0])
                    blend = learner.blend_weight
                    pred_occ = np.clip(pred_occ_base + (blend * online_residual), 0.0, 1.0)
                    online_applied = True
            except Exception as e:
                print(f"[Inference Engine] Online correction fallback: {e}")

        duration = int(feature_dict.get('f_requested_duration_h', 2))
        return self.calculate_price_policy(
            pred_occ,
            base_hourly_rate=base_hourly_rate,
            duration_hours=duration,
            online_applied=online_applied,
            online_residual=online_residual,
            base_occupancy=pred_occ_base
        )

# Global singleton helper
_engine = None
def get_inference_engine():
    global _engine
    if _engine is None:
        _engine = DrivixPricingInferenceEngine()
    return _engine

def predict_demand_and_price(feature_dict, base_rate=60):
    engine = get_inference_engine()
    return engine.predict_single(feature_dict, base_hourly_rate=base_rate)
