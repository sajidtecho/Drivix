import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from xgboost import XGBRegressor

from feature_engineering import build_preprocessor_pipeline, FEATURE_COLUMNS_RAW
from evaluate import compute_metrics, evaluate_by_location, plot_evaluation_diagnostics

def train_and_compare_models(train_df, valid_df, model_dir="models", reports_dir="reports"):
    """
    Trains multiple model architectures on the training set,
    evaluates them on the validation set, and records comparative metrics.
    """
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)

    X_train = train_df[FEATURE_COLUMNS_RAW]
    y_train = train_df['y_reserved_occupancy_rate'].values

    X_val = valid_df[FEATURE_COLUMNS_RAW]
    y_val = valid_df['y_reserved_occupancy_rate'].values

    # Preprocessor
    preprocessor = build_preprocessor_pipeline(scale_numeric=True)
    preprocessor.fit(X_train)

    X_train_trans = preprocessor.transform(X_train)
    X_val_trans = preprocessor.transform(X_val)

    # Baselines
    results = []
    
    # Baseline 1: Training Mean
    mean_val = np.mean(y_train)
    y_pred_mean = np.full_like(y_val, fill_value=mean_val)
    results.append(compute_metrics(y_val, y_pred_mean, name="Baseline: Training Mean"))

    # Baseline 2: Occupancy already booked at quote time
    y_pred_quote = valid_df['f_occ_entry_at_quote'].values
    results.append(compute_metrics(y_val, y_pred_quote, name="Baseline: Quoted Entry Occupancy"))

    # Baseline 3: Same hour last week (imputed with mean if NaN)
    y_pred_last_week = valid_df['f_occ_same_hour_last_week'].fillna(mean_val).values
    results.append(compute_metrics(y_val, y_pred_last_week, name="Baseline: Same Hour Last Week"))

    # Candidate Models
    models = {
        'Linear Regression': LinearRegression(),
        'Ridge Regression': Ridge(alpha=1.0, random_state=42),
        'Decision Tree Regressor': DecisionTreeRegressor(max_depth=10, min_samples_leaf=10, random_state=42),
        'Random Forest Regressor': RandomForestRegressor(n_estimators=100, max_depth=14, min_samples_leaf=5, n_jobs=-1, random_state=42),
        'HistGradientBoosting Regressor': HistGradientBoostingRegressor(max_iter=150, max_depth=8, learning_rate=0.08, random_state=42),
        'XGBoost Regressor': XGBRegressor(n_estimators=150, max_depth=6, learning_rate=0.08, random_state=42, n_jobs=-1)
    }

    trained_models = {}
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_trans, y_train)
        y_val_pred = model.predict(X_val_trans)
        metrics = compute_metrics(y_val, y_val_pred, name=name)
        results.append(metrics)
        trained_models[name] = model

    results_df = pd.DataFrame(results).sort_values(by='mae', ascending=True)
    print("\n================== VALIDATION MODEL COMPARISON ==================")
    print(results_df.to_string(index=False))

    # Identify best model
    best_row = results_df[~results_df['model_name'].str.startswith('Baseline')].iloc[0]
    best_name = best_row['model_name']
    best_model = trained_models[best_name]

    print(f"\nTop Candidate Model: {best_name} (Validation MAE: {best_row['mae']})")

    # Package as full end-to-end Pipeline
    full_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', best_model)
    ])

    # Save artifacts
    model_path = os.path.join(model_dir, "drivix_price_model.pkl")
    joblib.dump(full_pipeline, model_path)
    joblib.dump(preprocessor, os.path.join(model_dir, "preprocessor.joblib"))
    print(f"Serialized complete pipeline to: {model_path}")

    # Save results table
    results_path = os.path.join(reports_dir, "validation_model_comparison.json")
    with open(results_path, 'w') as f:
        json.dump(results, f, indent=2)

    return full_pipeline, results_df
