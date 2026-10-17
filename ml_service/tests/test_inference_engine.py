import os
import sys
import pytest
import numpy as np

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from predict import get_inference_engine, DrivixPricingInferenceEngine

def test_inference_engine_singleton_loads_model():
    engine = get_inference_engine()
    assert engine.pipeline is not None, "Model pipeline should be loaded into memory"

def test_pricing_policy_multipliers():
    engine = get_inference_engine()

    # Critical surge: occ >= 0.85 -> 1.05x (+5% maximum fair adjustment)
    res_crit = engine.calculate_price_policy(0.92, base_hourly_rate=60, duration_hours=2)
    assert res_crit['pricing_multiplier'] == 1.05
    assert res_crit['is_surge_active'] is True
    assert res_crit['recommended_hourly_price'] == 63
    assert res_crit['total_quoted_cost'] == 126

    # High surge: occ >= 0.70 -> 1.03x (+3% fair adjustment)
    res_high = engine.calculate_price_policy(0.75, base_hourly_rate=60, duration_hours=2)
    assert res_high['pricing_multiplier'] == 1.03
    assert res_high['is_surge_active'] is True
    assert res_high['recommended_hourly_price'] == 61.8

    # Moderate demand: occ >= 0.50 -> 1.015x
    res_mod = engine.calculate_price_policy(0.55, base_hourly_rate=60, duration_hours=2)
    assert res_mod['pricing_multiplier'] == 1.015
    assert res_mod['is_surge_active'] is False

    # Normal base rate: occ >= 0.30 -> 1.00x
    res_norm = engine.calculate_price_policy(0.40, base_hourly_rate=60, duration_hours=2)
    assert res_norm['pricing_multiplier'] == 1.00
    assert res_norm['is_surge_active'] is False
    assert res_norm['recommended_hourly_price'] == 60

    # Off-peak discount: occ < 0.30 -> 0.97x (3% off)
    res_disc = engine.calculate_price_policy(0.15, base_hourly_rate=60, duration_hours=2)
    assert res_disc['pricing_multiplier'] == 0.97
    assert res_disc['is_surge_active'] is False
    assert res_disc['recommended_hourly_price'] == 58.2
    assert res_disc['total_quoted_cost'] == 116.4

def test_predict_single_bounds():
    engine = get_inference_engine()

    features = {
        'f_location': 'Vanice Mall',
        'f_capacity': 100,
        'f_entry_hour': 19,
        'f_entry_dow': 5,
        'f_is_weekend': 1,
        'f_lead_time_min': 15,
        'f_requested_duration_h': 3,
        'f_occ_entry_at_quote': 0.80,
        'f_busy_frac_window_at_quote': 0.80,
        'f_requests_last_60min_location': 20,
        'f_occ_same_hour_last_week': 0.75
    }

    quote = engine.predict_single(features, base_hourly_rate=60)
    assert 0.0 <= quote['predicted_occupancy_rate'] <= 1.0
    assert 0.0 <= quote['demand_score_percent'] <= 100.0
    assert quote['recommended_hourly_price'] > 0
    assert quote['total_quoted_cost'] == quote['recommended_hourly_price'] * 3
