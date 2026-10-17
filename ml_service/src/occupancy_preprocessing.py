import os
import json
import numpy as np
import pandas as pd

def preprocess_birmingham_dataset(
    raw_csv_path="data/raw/dataset.csv",
    output_dir="data/processed",
    target_lead_steps=1  # 1 step = ~30 mins ahead, 2 steps = ~60 mins ahead
):
    """
    Cleans and transforms raw Birmingham parking sensor data (dataset.csv)
    into leak-free time-series features and future occupancy targets.
    """
    print(f"Loading raw dataset from {raw_csv_path}...")
    df = pd.read_csv(raw_csv_path)
    print(f"Raw shape: {df.shape}")

    # 1. Cleaning & Type Casting
    df['LastUpdated'] = pd.to_datetime(df['LastUpdated'])
    df = df.sort_values(by=['SystemCodeNumber', 'LastUpdated']).reset_index(drop=True)

    # Clean anomalous sensor values:
    # Sensor noise can produce negative counts or counts exceeding physical capacity
    initial_negatives = (df['Occupancy'] < 0).sum()
    initial_overflows = (df['Occupancy'] > df['Capacity']).sum()
    print(f"Cleaning anomalies: {initial_negatives} negative values, {initial_overflows} overflows.")

    df['Occupancy'] = df['Occupancy'].clip(lower=0)
    df['Occupancy'] = np.minimum(df['Occupancy'], df['Capacity'])
    df['OccupancyRate'] = (df['Occupancy'] / df['Capacity']).astype(float)
    df['AvailableSlots'] = (df['Capacity'] - df['Occupancy']).astype(int)

    # 2. Temporal Feature Extraction
    df['hour'] = df['LastUpdated'].dt.hour
    df['minute'] = df['LastUpdated'].dt.minute
    df['day_of_week'] = df['LastUpdated'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

    # Cyclical encodings
    df['sin_hour'] = np.sin(2 * np.pi * (df['hour'] + df['minute'] / 60.0) / 24.0)
    df['cos_hour'] = np.cos(2 * np.pi * (df['hour'] + df['minute'] / 60.0) / 24.0)
    df['sin_dow'] = np.sin(2 * np.pi * df['day_of_week'] / 7.0)
    df['cos_dow'] = np.cos(2 * np.pi * df['day_of_week'] / 7.0)

    # 3. Lagged and Rolling Time-Series Features per Car Park
    grouped = df.groupby('SystemCodeNumber')

    # Lags (previous 30 min, 60 min, 90 min)
    df['lag_1_occ_rate'] = grouped['OccupancyRate'].shift(1)
    df['lag_2_occ_rate'] = grouped['OccupancyRate'].shift(2)
    df['lag_3_occ_rate'] = grouped['OccupancyRate'].shift(3)

    # Velocity / momentum (change over last step)
    df['occ_velocity'] = df['lag_1_occ_rate'] - df['lag_2_occ_rate']

    # Rolling 3-step statistics using only past values (shift 1 before rolling to prevent leakage)
    df['rolling_mean_3step'] = grouped['OccupancyRate'].transform(
        lambda s: s.shift(1).rolling(window=3, min_periods=1).mean()
    )
    df['rolling_std_3step'] = grouped['OccupancyRate'].transform(
        lambda s: s.shift(1).rolling(window=3, min_periods=1).std().fillna(0.0)
    )

    # 4. Target Definition (Future occupancy rate)
    # Default: Predict occupancy rate 30 mins ahead (1 step)
    df['target_occupancy_rate'] = grouped['OccupancyRate'].shift(-target_lead_steps)

    # Also compute 60-min ahead target for multi-horizon planning
    df['target_occupancy_rate_60m'] = grouped['OccupancyRate'].shift(-2)

    # Impute any edge lag_3 using lag_2 before dropping
    df['lag_3_occ_rate'] = df['lag_3_occ_rate'].fillna(df['lag_2_occ_rate'])
    df['occ_velocity'] = df['occ_velocity'].fillna(0.0)
    df['rolling_mean_3step'] = df['rolling_mean_3step'].fillna(df['lag_1_occ_rate'])
    df['rolling_std_3step'] = df['rolling_std_3step'].fillna(0.0)

    # Drop edge rows where lags or target are missing due to shifting
    clean_df = df.dropna(subset=['lag_1_occ_rate', 'lag_2_occ_rate', 'target_occupancy_rate']).copy()
    print(f"Cleaned feature dataset shape: {clean_df.shape}")

    # 5. Chronological Train-Val-Test Split (Strictly temporal, no shuffle)
    # Sort strictly by timestamp to ensure no future information leaks into training
    clean_df = clean_df.sort_values(by='LastUpdated').reset_index(drop=True)
    
    n_total = len(clean_df)
    train_end = int(n_total * 0.70)
    val_end = int(n_total * 0.85)

    train_df = clean_df.iloc[:train_end].copy()
    val_df = clean_df.iloc[train_end:val_end].copy()
    test_df = clean_df.iloc[val_end:].copy()

    print(f"Train split: {len(train_df)} rows ({train_df['LastUpdated'].min()} to {train_df['LastUpdated'].max()})")
    print(f"Val split:   {len(val_df)} rows ({val_df['LastUpdated'].min()} to {val_df['LastUpdated'].max()})")
    print(f"Test split:  {len(test_df)} rows ({test_df['LastUpdated'].min()} to {test_df['LastUpdated'].max()})")

    # 6. Save Processed Artifacts
    os.makedirs(output_dir, exist_ok=True)
    train_path = os.path.join(output_dir, "occupancy_train.csv")
    val_path = os.path.join(output_dir, "occupancy_val.csv")
    test_path = os.path.join(output_dir, "occupancy_test.csv")

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    metadata = {
        "source": raw_csv_path,
        "total_records_raw": int(len(df)),
        "total_records_processed": int(len(clean_df)),
        "train_rows": int(len(train_df)),
        "val_rows": int(len(val_df)),
        "test_rows": int(len(test_df)),
        "unique_locations": int(df['SystemCodeNumber'].nunique()),
        "target_col": "target_occupancy_rate",
        "feature_cols": [
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
    }

    meta_path = os.path.join(output_dir, "occupancy_dataset_meta.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Processed datasets successfully saved to {output_dir}/")
    return metadata

if __name__ == "__main__":
    # Resolve paths relative to ml_service
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_path = os.path.join(base_dir, "data", "raw", "dataset.csv")
    out_dir = os.path.join(base_dir, "data", "processed")
    preprocess_birmingham_dataset(raw_path, out_dir)
