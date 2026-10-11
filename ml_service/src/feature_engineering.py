import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

class DrivixFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Custom transformer to engineer cyclical temporal features,
    log transformations, and interaction variables without data leakage.
    """
    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_out = X.copy()
        
        # Cyclical Hour (24-hour cycle)
        hour = X_out['f_entry_hour'].values
        X_out['sin_hour'] = np.sin(2 * np.pi * hour / 24.0)
        X_out['cos_hour'] = np.cos(2 * np.pi * hour / 24.0)

        # Cyclical Day of Week (7-day cycle)
        dow = X_out['f_entry_dow'].values
        X_out['sin_dow'] = np.sin(2 * np.pi * dow / 7.0)
        X_out['cos_dow'] = np.cos(2 * np.pi * dow / 7.0)

        # Log lead time (handles skewed lead times: 0 to 4000+ mins)
        lead_time = np.maximum(0.0, X_out['f_lead_time_min'].values)
        X_out['log_lead_time'] = np.log1p(lead_time)

        # Estimated busy slots count (interaction of busy fraction and total lot capacity)
        X_out['est_busy_slots'] = X_out['f_busy_frac_window_at_quote'] * X_out['f_capacity']

        return X_out

FEATURE_COLUMNS_RAW = [
    'f_location',
    'f_capacity',
    'f_entry_hour',
    'f_entry_dow',
    'f_is_weekend',
    'f_lead_time_min',
    'f_requested_duration_h',
    'f_occ_entry_at_quote',
    'f_busy_frac_window_at_quote',
    'f_requests_last_60min_location',
    'f_occ_same_hour_last_week'
]

def build_preprocessor_pipeline(scale_numeric=False):
    """
    Builds an end-to-end ColumnTransformer that encodes categorical features
    and handles missing lag values with simple imputation.
    """
    numeric_features = [
        'f_capacity',
        'f_entry_hour',
        'f_entry_dow',
        'f_is_weekend',
        'f_lead_time_min',
        'f_requested_duration_h',
        'f_occ_entry_at_quote',
        'f_busy_frac_window_at_quote',
        'f_requests_last_60min_location',
        'f_occ_same_hour_last_week',
        'sin_hour',
        'cos_hour',
        'sin_dow',
        'cos_dow',
        'log_lead_time',
        'est_busy_slots'
    ]

    categorical_features = ['f_location']

    if scale_numeric:
        num_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
    else:
        num_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median'))
        ])

    cat_pipeline = Pipeline([
        ('onehot', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'))
    ])

    column_trans = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, numeric_features),
            ('cat', cat_pipeline, categorical_features)
        ],
        remainder='drop'
    )

    full_pipeline = Pipeline([
        ('engineer', DrivixFeatureEngineer()),
        ('transform', column_trans)
    ])

    return full_pipeline

def get_engineered_feature_names(transformer):
    """
    Retrieves the output column names from the fitted ColumnTransformer.
    """
    # Names from transformer steps
    trans = transformer.named_steps.get('transform')
    if trans is None:
        trans = transformer

    feature_names = []
    # Numeric
    feature_names.extend(trans.transformers_[0][2])
    # Categorical
    cat_enc = trans.transformers_[1][1].named_steps['onehot']
    cat_names = cat_enc.get_feature_names_out(trans.transformers_[1][2])
    feature_names.extend(cat_names.tolist())

    return feature_names
