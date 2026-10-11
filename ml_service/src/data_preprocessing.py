import os
import sys
import pandas as pd
import numpy as np

def load_raw_data(file_path="data/raw/DRIVIX_synthetic_only (1).xlsx", sheet_name="model_training_table"):
    """
    Loads the modeling table from the master synthetic workbook or fallback CSV.
    """
    if not os.path.exists(file_path):
        # Check relative to ml_service or project root
        alt_paths = [
            os.path.join("..", file_path),
            os.path.join("ml_service", file_path),
            file_path.replace(" (1)", "")
        ]
        for alt in alt_paths:
            if os.path.exists(alt):
                file_path = alt
                break

    if file_path.endswith('.xlsx'):
        df = pd.read_excel(file_path, sheet_name=sheet_name)
    else:
        df = pd.read_csv(file_path)
    
    return df

def clean_and_validate_data(df):
    """
    Validates types, verifies ranges, isolates quote-time features from outcome leakages.
    """
    df = df.copy()

    # 1. Verify required columns
    required_cols = [
        'f_location', 'f_capacity', 'f_entry_hour', 'f_entry_dow', 'f_is_weekend',
        'f_lead_time_min', 'f_requested_duration_h', 'f_occ_entry_at_quote',
        'f_busy_frac_window_at_quote', 'f_requests_last_60min_location',
        'f_occ_same_hour_last_week', 'y_reserved_occupancy_rate', 'split'
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column in dataset: {col}")

    # 2. Type integrity
    df['f_capacity'] = df['f_capacity'].astype(int)
    df['f_entry_hour'] = df['f_entry_hour'].astype(int)
    df['f_entry_dow'] = df['f_entry_dow'].astype(int)
    df['f_is_weekend'] = df['f_is_weekend'].astype(int)
    df['f_requested_duration_h'] = df['f_requested_duration_h'].astype(int)
    df['f_requests_last_60min_location'] = df['f_requests_last_60min_location'].astype(int)

    # 3. Numeric bounded validation
    assert df['y_reserved_occupancy_rate'].min() >= 0.0, "Occupancy target cannot be negative"
    assert df['y_reserved_occupancy_rate'].max() <= 1.0, "Occupancy target cannot exceed 1.0"
    assert df['f_occ_entry_at_quote'].min() >= 0.0 and df['f_occ_entry_at_quote'].max() <= 1.0
    assert df['f_busy_frac_window_at_quote'].min() >= 0.0 and df['f_busy_frac_window_at_quote'].max() <= 1.0

    return df

def split_and_save_data(df, output_dir="data/processed"):
    """
    Splits data using the pre-defined chronological 'split' column
    (train: Weeks 1-12, valid: Weeks 13-14, test: Weeks 15-17).
    """
    os.makedirs(output_dir, exist_ok=True)

    train_df = df[df['split'] == 'train'].copy()
    valid_df = df[df['split'] == 'valid'].copy()
    test_df = df[df['split'] == 'test'].copy()

    train_path = os.path.join(output_dir, "train_dataset.csv")
    valid_path = os.path.join(output_dir, "valid_dataset.csv")
    test_path = os.path.join(output_dir, "test_dataset.csv")

    train_df.to_csv(train_path, index=False)
    valid_df.to_csv(valid_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"Data successfully split and saved to '{output_dir}':")
    print(f" - Train: {len(train_df)} rows ({train_path})")
    print(f" - Validation: {len(valid_df)} rows ({valid_path})")
    print(f" - Test: {len(test_df)} rows ({test_path})")

    return train_df, valid_df, test_df

if __name__ == "__main__":
    raw_path = "data/raw/DRIVIX_synthetic_only (1).xlsx"
    if not os.path.exists(raw_path) and os.path.exists("ml_service/data/raw/DRIVIX_synthetic_only (1).xlsx"):
        raw_path = "ml_service/data/raw/DRIVIX_synthetic_only (1).xlsx"
    
    print(f"Loading raw data from: {raw_path}")
    raw_df = load_raw_data(raw_path)
    clean_df = clean_and_validate_data(raw_df)
    out_dir = "data/processed" if os.path.exists("data") else "ml_service/data/processed"
    split_and_save_data(clean_df, output_dir=out_dir)
