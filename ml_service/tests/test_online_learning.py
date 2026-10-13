import os
import sys
import pytest
import numpy as np
import pandas as pd
from starlette.testclient import TestClient

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api"))
for p in [SRC_DIR, API_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from db_connector import DrivixDatabaseConnector
from online_learner import DrivixOnlineLearner, get_online_learner
from predict import get_inference_engine
from main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def clean_learner():
    learner = get_online_learner()
    learner.reset()
    yield learner
    learner.reset()

def test_db_connector_transform_booking():
    connector = DrivixDatabaseConnector()
    sample_booking = {
        "_id": "6a51ea0d8b498b067f17ab73",
        "bookingId": "DRX-TEST-001",
        "locationName": "Connaught Place",
        "entryDate": "2026-10-15",
        "entryTime": "18:30",
        "duration": 3,
        "totalCost": 225,
        "status": "Confirmed",
        "createdAt": "2026-10-15T18:00:00Z"
    }
    sample_locations = {
        "Connaught Place": {
            "parkingName": "Connaught Place",
            "totalSlots": 120,
            "availableSlots": 20,
            "hourlyPrice": 60
        }
    }

    sample = connector.transform_booking_to_sample(sample_booking, locations_map=sample_locations)
    assert sample is not None
    assert sample["booking_id"] == "DRX-TEST-001"
    assert "features" in sample
    feats = sample["features"]
    assert feats["f_location"] == "Connaught Place"
    assert feats["f_capacity"] == 120.0
    assert feats["f_entry_hour"] == 18
    assert feats["f_requested_duration_h"] == 3.0
    assert 0.0 <= sample["target_occupancy_rate"] <= 1.0

def test_online_learner_single_event_update(clean_learner):
    sample_feat = {
        'f_location': 'Connaught Place',
        'f_capacity': 100.0,
        'f_entry_hour': 18,
        'f_entry_dow': 4,
        'f_is_weekend': 0,
        'f_lead_time_min': 15.0,
        'f_requested_duration_h': 2.0,
        'f_occ_entry_at_quote': 0.85,
        'f_busy_frac_window_at_quote': 0.85,
        'f_requests_last_60min_location': 20.0,
        'f_occ_same_hour_last_week': 0.80
    }

    initial_samples = clean_learner.total_samples_trained
    res = clean_learner.update_from_single_event(
        features_dict=sample_feat,
        actual_occupancy=0.90
    )

    assert clean_learner.is_initialized is True
    assert clean_learner.total_samples_trained == initial_samples + 1
    assert res["samples_trained"] == 1
    assert "running_mae" in res

    # Predict residual on the same features
    df = pd.DataFrame([sample_feat])
    residual = clean_learner.predict_residual(df)
    assert len(residual) == 1
    assert -0.30 <= residual[0] <= 0.30

def test_online_learner_batch_update(clean_learner):
    # Train on a synthetic mini-batch of surges
    rows = []
    y_vals = []
    for h in [17, 18, 19]:
        rows.append({
            'f_location': 'Vanice Mall',
            'f_capacity': 80.0,
            'f_entry_hour': h,
            'f_entry_dow': 5,
            'f_is_weekend': 1,
            'f_lead_time_min': 10.0,
            'f_requested_duration_h': 2.0,
            'f_occ_entry_at_quote': 0.75,
            'f_busy_frac_window_at_quote': 0.75,
            'f_requests_last_60min_location': 15.0,
            'f_occ_same_hour_last_week': 0.70
        })
        y_vals.append(0.85)

    df_batch = pd.DataFrame(rows)
    y_series = pd.Series(y_vals)

    res = clean_learner.update_from_batch(df_batch, y_series)
    assert res["samples_trained"] == 3
    assert clean_learner.total_samples_trained >= 3
    assert clean_learner.running_mae > 0.0

def test_inference_engine_hybrid_blending(clean_learner):
    engine = get_inference_engine()

    features = {
        'f_location': 'Connaught Place',
        'f_capacity': 100.0,
        'f_entry_hour': 18,
        'f_entry_dow': 4,
        'f_is_weekend': 0,
        'f_lead_time_min': 15.0,
        'f_requested_duration_h': 2.0,
        'f_occ_entry_at_quote': 0.60,
        'f_busy_frac_window_at_quote': 0.60,
        'f_requests_last_60min_location': 10.0,
        'f_occ_same_hour_last_week': 0.60
    }

    # Baseline prediction without online learning
    base_quote = engine.predict_single(features, base_hourly_rate=60, use_online=False)
    assert base_quote['online_learning_applied'] is False

    # Now update online learner with strong surge signal
    clean_learner.update_from_single_event(features, actual_occupancy=0.95)

    # Hybrid prediction with online learning
    hybrid_quote = engine.predict_single(features, base_hourly_rate=60, use_online=True)
    assert hybrid_quote['online_learning_applied'] is True
    assert 'online_residual' in hybrid_quote

def test_api_online_learning_status(client):
    res = client.get("/api/v1/online-learning/status")
    assert res.status_code == 200
    data = res.json()
    assert "online_learning_enabled" in data
    assert "database_connected" in data
    assert "learner_telemetry" in data
    assert "total_samples_trained" in data["learner_telemetry"]

def test_api_online_learning_event_endpoint(client):
    payload = {
        "booking_id": "DRX-STREAM-99",
        "location_name": "Vanice Mall",
        "total_capacity": 100,
        "available_slots": 15,
        "duration_hours": 2.0,
        "base_hourly_rate": 70.0,
        "total_cost": 175.0,
        "realized_occupancy_rate": 0.85
    }
    res = client.post("/api/v1/online-learning/learn-event", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["booking_id"] == "DRX-STREAM-99"
    assert data["online_update"]["samples_trained"] == 1

def test_api_online_learning_configure_endpoint(client):
    payload = {
        "blend_weight": 0.45,
        "enable_online_learning": True,
        "max_residual_clamp": 0.25
    }
    res = client.post("/api/v1/online-learning/configure", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["blend_weight"] == 0.45
    assert data["max_residual_clamp"] == 0.25

def test_api_online_learning_sync_endpoint(client):
    # Should successfully execute and return status
    res = client.post("/api/v1/online-learning/sync-db", json={"limit": 10, "force_full_sync": False})
    assert res.status_code == 200
    data = res.json()
    assert "database_connected" in data
    assert "online_learner_status" in data

def test_api_predict_quote_returns_online_metadata(client):
    payload = {
        "location_name": "Connaught Place",
        "total_capacity": 100,
        "available_slots": 20,
        "base_hourly_rate": 60,
        "duration_hours": 2
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "online_learning_applied" in data
    assert "online_residual" in data
    assert 0.0 <= data["predicted_occupancy_rate"] <= 1.0
