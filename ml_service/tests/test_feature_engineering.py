import os
import sys
import numpy as np
import pandas as pd
import pytest

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from feature_engineering import (
    DrivixFeatureEngineer,
    build_preprocessor_pipeline,
    FEATURE_COLUMNS_RAW
)

@pytest.fixture
def sample_raw_df():
    return pd.DataFrame([{
        'f_location': 'Vanice Mall',
        'f_capacity': 120.0,
        'f_entry_hour': 18,
        'f_entry_dow': 4,
        'f_is_weekend': 0,
        'f_lead_time_min': 45.0,
        'f_requested_duration_h': 3.0,
        'f_occ_entry_at_quote': 0.75,
        'f_busy_frac_window_at_quote': 0.70,
        'f_requests_last_60min_location': 22.0,
        'f_occ_same_hour_last_week': 0.65
    }])

def test_feature_engineer_cyclical_transforms(sample_raw_df):
    engineer = DrivixFeatureEngineer()
    transformed = engineer.fit_transform(sample_raw_df)

    # Check generated engineered columns exist
    for col in ['sin_hour', 'cos_hour', 'sin_dow', 'cos_dow', 'log_lead_time', 'est_busy_slots']:
        assert col in transformed.columns, f"Missing engineered column {col}"

    # Verify cyclical bounds
    assert -1.0 <= transformed['sin_hour'].iloc[0] <= 1.0
    assert -1.0 <= transformed['cos_hour'].iloc[0] <= 1.0
    assert -1.0 <= transformed['sin_dow'].iloc[0] <= 1.0
    assert -1.0 <= transformed['cos_dow'].iloc[0] <= 1.0

    # Verify interaction: busy slots = busy_frac * capacity
    expected_busy = sample_raw_df['f_busy_frac_window_at_quote'].iloc[0] * sample_raw_df['f_capacity'].iloc[0]
    assert np.isclose(transformed['est_busy_slots'].iloc[0], expected_busy)

def test_feature_engineer_zero_lead_time():
    engineer = DrivixFeatureEngineer()
    df = pd.DataFrame([{
        'f_entry_hour': 12,
        'f_entry_dow': 0,
        'f_lead_time_min': 0.0,
        'f_busy_frac_window_at_quote': 0.5,
        'f_capacity': 100.0
    }])
    transformed = engineer.fit_transform(df)
    assert transformed['log_lead_time'].iloc[0] == 0.0

def test_pipeline_unknown_category_handling():
    pipeline = build_preprocessor_pipeline(scale_numeric=False)

    train_data = pd.DataFrame([
        {
            'f_location': 'Vanice Mall',
            'f_capacity': 100.0,
            'f_entry_hour': 10,
            'f_entry_dow': 1,
            'f_is_weekend': 0,
            'f_lead_time_min': 20.0,
            'f_requested_duration_h': 2.0,
            'f_occ_entry_at_quote': 0.5,
            'f_busy_frac_window_at_quote': 0.5,
            'f_requests_last_60min_location': 10.0,
            'f_occ_same_hour_last_week': 0.5
        }
    ])
    pipeline.fit(train_data[FEATURE_COLUMNS_RAW])

    # Transform with an unseen location name
    unseen_data = train_data.copy()
    unseen_data['f_location'] = 'Unseen Space Station Parking'

    # Should transform cleanly without error due to handle_unknown='ignore'
    result = pipeline.transform(unseen_data[FEATURE_COLUMNS_RAW])
    assert result is not None
    assert result.shape[0] == 1
