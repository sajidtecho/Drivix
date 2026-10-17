import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor

FEATURE_COLUMNS = [
    "Capacity",
    "hour",
    "minute",
    "day_of_week",
    "is_weekend",
    "sin_hour",
    "cos_hour",
    "sin_dow",
    "cos_dow",
    "lag_1_occ_rate",
    "lag_2_occ_rate",
    "lag_3_occ_rate",
    "occ_velocity",
    "rolling_mean_3step",
    "rolling_std_3step"
]

TARGET_COLUMN = "target_occupancy_rate"

def evaluate_predictions(y_true, y_pred, name="Model"):
    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    max_err = float(np.max(np.abs(y_true - y_pred)))
    return {
        "model": name,
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2": round(float(r2), 4),
        "max_error": round(max_err, 4)
    }

def train_occupancy_forecaster(
    data_dir="data/processed",
    models_dir="models",
    reports_dir="reports"
):
    print("=" * 60)
    print("STAGE 1: TRAINING PARKING OCCUPANCY FORECASTER")
    print("=" * 60)

    # 1. Load Processed Splits
    train_path = os.path.join(data_dir, "occupancy_train.csv")
    val_path = os.path.join(data_dir, "occupancy_val.csv")
    test_path = os.path.join(data_dir, "occupancy_test.csv")

    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df[TARGET_COLUMN].values

    X_val = val_df[FEATURE_COLUMNS]
    y_val = val_df[TARGET_COLUMN].values

    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df[TARGET_COLUMN].values

    print(f"Features: {len(FEATURE_COLUMNS)} variables")
    print(f"Train samples: {len(X_train)}, Val samples: {len(X_val)}, Test samples: {len(X_test)}")

    # 2. Benchmarks / Baselines
    val_results = []

    # Baseline A: Global Mean
    mean_pred = np.full_like(y_val, fill_value=np.mean(y_train))
    val_results.append(evaluate_predictions(y_val, mean_pred, name="Baseline: Global Mean"))

    # Baseline B: Persistence (Last known occupancy)
    persistence_pred = val_df['lag_1_occ_rate'].values
    val_results.append(evaluate_predictions(y_val, persistence_pred, name="Baseline: Persistence (Lag 1)"))

    # 3. Model Candidates
    candidates = {
        "Linear Regression": LinearRegression(),
        "Ridge Regression": Ridge(alpha=10.0, random_state=42),
        "HistGradientBoosting Regressor": HistGradientBoostingRegressor(
            max_iter=150,
            learning_rate=0.08,
            max_depth=8,
            min_samples_leaf=20,
            random_state=42
        ),
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            min_samples_leaf=10,
            n_jobs=-1,
            random_state=42
        )
    }

    trained_models = {}
    for name, model in candidates.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_val)
        # Occupancy rate must stay in [0.0, 1.0]
        preds = np.clip(preds, 0.0, 1.0)
        res = evaluate_predictions(y_val, preds, name=name)
        val_results.append(res)
        trained_models[name] = model

    print("\n" + "=" * 60)
    print("VALIDATION SET RESULTS")
    print("=" * 60)
    val_summary = pd.DataFrame(val_results)
    print(val_summary.to_string(index=False))

    # 4. Select Best Model by lowest Validation RMSE
    model_rows = [r for r in val_results if not r['model'].startswith("Baseline")]
    best_meta = min(model_rows, key=lambda x: x['rmse'])
    best_name = best_meta['model']
    best_model = trained_models[best_name]
    print(f"\n>>> Best Model: {best_name} (Val RMSE: {best_meta['rmse']}, R2: {best_meta['r2']})")

    # 5. Final Evaluation on Unseen Test Set
    test_preds = np.clip(best_model.predict(X_test), 0.0, 1.0)
    test_metrics = evaluate_predictions(y_test, test_preds, name=f"{best_name} (Test Set)")
    persistence_test = evaluate_predictions(y_test, test_df['lag_1_occ_rate'].values, name="Persistence Baseline (Test Set)")

    print("\n" + "=" * 60)
    print("FINAL UNSEEN TEST SET METRICS")
    print("=" * 60)
    print(pd.DataFrame([persistence_test, test_metrics]).to_string(index=False))

    # Breakdown by Car Park Category / Location
    test_df_copy = test_df.copy()
    test_df_copy['pred'] = test_preds
    location_metrics = {}
    for loc, grp in test_df_copy.groupby('SystemCodeNumber'):
        loc_mae = mean_absolute_error(grp[TARGET_COLUMN], grp['pred'])
        location_metrics[loc] = {
            "samples": int(len(grp)),
            "mae": round(float(loc_mae), 4),
            "capacity": int(grp['Capacity'].iloc[0])
        }

    # 6. Save Model Artifact & Final Report
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "occupancy_forecaster.joblib")
    joblib.dump({
        "model": best_model,
        "model_name": best_name,
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "val_metrics": best_meta,
        "test_metrics": test_metrics
    }, model_path)
    print(f"\nSaved trained model artifact to {model_path}")

    report_payload = {
        "best_model": best_name,
        "validation_benchmark": val_results,
        "test_metrics": test_metrics,
        "persistence_baseline_test": persistence_test,
        "features_used": FEATURE_COLUMNS,
        "location_sample_mae": dict(list(location_metrics.items())[:10])
    }

    report_path = os.path.join(reports_dir, "occupancy_forecaster_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_payload, f, indent=2)
    print(f"Saved evaluation report to {report_path}")

    return report_payload

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data", "processed")
    models_dir = os.path.join(base_dir, "models")
    reports_dir = os.path.join(base_dir, "reports")
    train_occupancy_forecaster(data_dir, models_dir, reports_dir)
