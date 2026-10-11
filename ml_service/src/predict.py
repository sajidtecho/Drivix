import os
import joblib
import numpy as np
import pandas as pd
from feature_engineering import FEATURE_COLUMNS_RAW

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "drivix_price_model.pkl")

class DrivixPricingInferenceEngine:
    def __init__(self, model_path=None):
        if model_path is None:
            model_path = MODEL_PATH
        if not os.path.exists(model_path):
            alt = os.path.join("models", "drivix_price_model.pkl")
            if os.path.exists(alt):
                model_path = alt
        
        if os.path.exists(model_path):
            self.pipeline = joblib.load(model_path)
        else:
            self.pipeline = None
            print(f"Warning: Model artifact not found at {model_path}. Run training first.")

    def calculate_price_policy(self, predicted_occupancy, base_hourly_rate=60, duration_hours=2):
        """
        Translates predicted occupancy score to Drivix bounded pricing policy.
        """
        occ = np.clip(predicted_occupancy, 0.0, 1.0)
        
        if occ >= 0.85:
            multiplier = 1.50
            alert_label = "Surge Pricing (Critical Demand)"
            surge_active = True
        elif occ >= 0.70:
            multiplier = 1.25
            alert_label = "Surge Pricing (High Demand)"
            surge_active = True
        elif occ >= 0.50:
            multiplier = 1.10
            alert_label = "Moderate Demand"
            surge_active = False
        elif occ >= 0.30:
            multiplier = 1.00
            alert_label = "Normal Base Rate"
            surge_active = False
        else:
            multiplier = 0.85 # 15% discount
            alert_label = "Off-Peak Discount (15% Off)"
            surge_active = False

        hourly_price = round(base_hourly_rate * multiplier)
        total_estimated_cost = round(hourly_price * duration_hours)

        return {
            'predicted_occupancy_rate': round(float(occ), 4),
            'demand_score_percent': round(float(occ * 100), 1),
            'pricing_multiplier': float(multiplier),
            'alert_label': alert_label,
            'is_surge_active': surge_active,
            'recommended_hourly_price': int(hourly_price),
            'total_quoted_cost': int(total_estimated_cost)
        }

    def predict_single(self, feature_dict, base_hourly_rate=60):
        """
        Predicts demand and dynamic pricing for a single quote request.
        """
        if self.pipeline is None:
            raise RuntimeError("Model pipeline is not loaded. Train and serialize model first.")

        df_input = pd.DataFrame([feature_dict])
        
        # Ensure all required features are present
        for col in FEATURE_COLUMNS_RAW:
            if col not in df_input.columns:
                df_input[col] = np.nan

        pred_occ = float(self.pipeline.predict(df_input[FEATURE_COLUMNS_RAW])[0])
        pred_occ = np.clip(pred_occ, 0.0, 1.0)

        duration = int(feature_dict.get('f_requested_duration_h', 2))
        return self.calculate_price_policy(pred_occ, base_hourly_rate=base_hourly_rate, duration_hours=duration)

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
