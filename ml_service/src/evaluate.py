import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def compute_metrics(y_true, y_pred, name="Model"):
    """
    Computes key regression metrics including surge-band specific metrics.
    """
    y_true = np.asarray(y_true)
    y_pred = np.clip(np.asarray(y_pred), 0.0, 1.0) # Target is strictly [0, 1]

    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)
    max_err = np.max(np.abs(y_true - y_pred))

    # High occupancy (surge trigger >= 0.80)
    surge_mask = y_true >= 0.80
    surge_mae = mean_absolute_error(y_true[surge_mask], y_pred[surge_mask]) if np.sum(surge_mask) > 0 else 0.0

    # Low occupancy (discount trigger <= 0.30)
    discount_mask = y_true <= 0.30
    discount_mae = mean_absolute_error(y_true[discount_mask], y_pred[discount_mask]) if np.sum(discount_mask) > 0 else 0.0

    return {
        'model_name': name,
        'mae': round(float(mae), 4),
        'rmse': round(float(rmse), 4),
        'r2': round(float(r2), 4),
        'max_error': round(float(max_err), 4),
        'surge_band_mae': round(float(surge_mae), 4),
        'discount_band_mae': round(float(discount_mae), 4),
        'sample_count': len(y_true)
    }

def evaluate_by_location(y_true, y_pred, locations):
    """
    Computes MAE and RMSE grouped by parking facility.
    """
    df = pd.DataFrame({
        'true': y_true,
        'pred': np.clip(y_pred, 0.0, 1.0),
        'location': locations
    })

    results = {}
    for loc, group in df.groupby('location'):
        loc_mae = mean_absolute_error(group['true'], group['pred'])
        loc_rmse = np.sqrt(mean_squared_error(group['true'], group['pred']))
        results[str(loc)] = {
            'mae': round(float(loc_mae), 4),
            'rmse': round(float(loc_rmse), 4),
            'count': int(len(group))
        }
    return results

def plot_evaluation_diagnostics(y_true, y_pred, model_name="Best Model", save_dir="reports/figures"):
    """
    Generates actual vs. predicted and residual diagnostic plots.
    """
    os.makedirs(save_dir, exist_ok=True)
    y_true = np.asarray(y_true)
    y_pred = np.clip(np.asarray(y_pred), 0.0, 1.0)
    residuals = y_true - y_pred

    plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # 1. Actual vs Predicted
    axes[0].scatter(y_true, y_pred, alpha=0.3, color='#4f46e5', edgecolors='none', s=25)
    axes[0].plot([0, 1], [0, 1], '--', color='#ef4444', linewidth=2, label='Perfect Prediction (y=x)')
    axes[0].set_title(f'{model_name}: Actual vs Predicted Occupancy Rate', fontsize=12, fontweight='bold')
    axes[0].set_xlabel('Actual Reserved Occupancy Rate (y_true)', fontsize=11)
    axes[0].set_ylabel('Predicted Occupancy Rate (y_pred)', fontsize=11)
    axes[0].set_xlim(0, 1)
    axes[0].set_ylim(0, 1)
    axes[0].legend(loc='upper left')

    # 2. Residual Distribution
    sns.histplot(residuals, kde=True, ax=axes[1], color='#059669', bins=35)
    axes[1].axvline(0, color='#ef4444', linestyle='--', linewidth=2)
    axes[1].set_title(f'{model_name}: Residuals Distribution (Errors)', fontsize=12, fontweight='bold')
    axes[1].set_xlabel('Residual Error (Actual - Predicted)', fontsize=11)
    axes[1].set_ylabel('Frequency Count', fontsize=11)

    plt.tight_layout()
    output_path = os.path.join(save_dir, f"{model_name.lower().replace(' ', '_')}_diagnostics.png")
    plt.savefig(output_path, dpi=300)
    plt.close()

    print(f"Diagnostics plot saved: {output_path}")
    return output_path
