import os
import sys
import joblib
import numpy as np
import pandas as pd
from predict import DrivixPricingInferenceEngine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def run_end_to_end_demo():
    print("=" * 70)
    print("DRIVIX TWO-STAGE DYNAMIC PRICING DEMONSTRATION")
    print("=" * 70)

    # 1. Load Stage 1 Occupancy Forecaster
    model_path = os.path.join(os.path.dirname(__file__), "..", "models", "occupancy_forecaster.joblib")
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return

    artifact = joblib.load(model_path)
    forecaster = artifact["model"]
    feature_names = artifact["features"]
    print(f"Loaded Stage 1 Forecaster: {artifact['model_name']}")
    print(f"Trained on Birmingham real sensor dataset ({artifact['test_metrics']['r2']*100:.1f}% test R2)")

    # 2. Load Stage 2 Pricing Engine
    pricing_engine = DrivixPricingInferenceEngine()

    # 3. Simulate Scenarios
    scenarios = [
        {
            "title": "Scenario A: Early Morning Low Occupancy (Off-Peak)",
            "hour": 8,
            "minute": 0,
            "day_of_week": 1, # Tuesday
            "is_weekend": 0,
            "capacity": 500,
            "lag_1_occ": 0.18, # 18% full 30 mins ago
            "lag_2_occ": 0.12,
            "lag_3_occ": 0.08,
            "base_rate": 60,
            "duration": 2
        },
        {
            "title": "Scenario B: Midday Regular Traffic",
            "hour": 12,
            "minute": 30,
            "day_of_week": 2, # Wednesday
            "is_weekend": 0,
            "capacity": 800,
            "lag_1_occ": 0.52, # 52% full
            "lag_2_occ": 0.48,
            "lag_3_occ": 0.45,
            "base_rate": 60,
            "duration": 3
        },
        {
            "title": "Scenario C: Weekend Shopping Rush (High Surge)",
            "hour": 14,
            "minute": 0,
            "day_of_week": 5, # Saturday
            "is_weekend": 1,
            "capacity": 1500,
            "lag_1_occ": 0.88, # 88% full
            "lag_2_occ": 0.82,
            "lag_3_occ": 0.75,
            "base_rate": 60,
            "duration": 4
        }
    ]

    for sc in scenarios:
        print("\n" + "-" * 70)
        print(f">>> {sc['title']}")
        print(f"Context: Time={sc['hour']:02d}:{sc['minute']:02d}, Weekend={bool(sc['is_weekend'])}, Capacity={sc['capacity']} slots")
        print(f"Recent Occupancy: Lag1={sc['lag_1_occ']*100:.1f}%, Lag2={sc['lag_2_occ']*100:.1f}%")

        # Feature vector assembly
        sin_h = np.sin(2 * np.pi * (sc['hour'] + sc['minute']/60.0) / 24.0)
        cos_h = np.cos(2 * np.pi * (sc['hour'] + sc['minute']/60.0) / 24.0)
        sin_d = np.sin(2 * np.pi * sc['day_of_week'] / 7.0)
        cos_d = np.cos(2 * np.pi * sc['day_of_week'] / 7.0)
        velocity = sc['lag_1_occ'] - sc['lag_2_occ']
        rolling_mean = np.mean([sc['lag_1_occ'], sc['lag_2_occ'], sc['lag_3_occ']])
        rolling_std = np.std([sc['lag_1_occ'], sc['lag_2_occ'], sc['lag_3_occ']])

        input_data = pd.DataFrame([{
            "Capacity": sc['capacity'],
            "hour": sc['hour'],
            "minute": sc['minute'],
            "day_of_week": sc['day_of_week'],
            "is_weekend": sc['is_weekend'],
            "sin_hour": sin_h,
            "cos_hour": cos_h,
            "sin_dow": sin_d,
            "cos_dow": cos_d,
            "lag_1_occ_rate": sc['lag_1_occ'],
            "lag_2_occ_rate": sc['lag_2_occ'],
            "lag_3_occ_rate": sc['lag_3_occ'],
            "occ_velocity": velocity,
            "rolling_mean_3step": rolling_mean,
            "rolling_std_3step": rolling_std
        }])[feature_names]

        # Stage 1 Inference
        pred_occ = float(np.clip(forecaster.predict(input_data)[0], 0.0, 1.0))
        predicted_slots = int(round(pred_occ * sc['capacity']))
        remaining_slots = sc['capacity'] - predicted_slots

        # Stage 2 Dynamic Pricing Quote
        quote = pricing_engine.calculate_price_policy(
            predicted_occupancy=pred_occ,
            base_hourly_rate=sc['base_rate'],
            duration_hours=sc['duration']
        )

        print(f"Stage 1 Prediction: Expected Occupancy = {pred_occ*100:.1f}% ({predicted_slots}/{sc['capacity']} occupied, {remaining_slots} slots free)")
        print(f"Stage 2 Pricing:    Rate = Rs. {quote['recommended_hourly_price']}/hr (Multiplier: {quote['pricing_multiplier']}x)")
        print(f"                    Total ({sc['duration']}h) = Rs. {quote['total_quoted_cost']}")
        print(f"                    Badge: [{quote['alert_label']}]")

if __name__ == "__main__":
    run_end_to_end_demo()
