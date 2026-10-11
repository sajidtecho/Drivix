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

from drift_detector import calculate_psi, DrivixDriftDetector, generate_drift_report
from retrain_pipeline import DrivixRetrainingPipeline
from inference_logger import log_inference_event, get_recent_inference_logs
from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_calculate_psi_stable():
    # Identical distributions should yield near zero PSI (< 0.05)
    np.random.seed(42)
    expected = np.random.normal(loc=50.0, scale=10.0, size=1000)
    actual = np.random.normal(loc=50.0, scale=10.0, size=1000)

    psi = calculate_psi(expected, actual)
    assert psi < 0.10, f"Expected stable PSI < 0.10, got {psi}"

def test_calculate_psi_drifted():
    # Significantly shifted distribution should yield high PSI (>= 0.20)
    np.random.seed(42)
    expected = np.random.normal(loc=20.0, scale=5.0, size=1000)
    actual = np.random.normal(loc=80.0, scale=5.0, size=1000)

    psi = calculate_psi(expected, actual)
    assert psi >= 0.20, f"Expected drifted PSI >= 0.20, got {psi}"

def test_drift_detector_report_structure():
    detector = DrivixDriftDetector()
    assert detector.ref_df is not None

    # Synthesize test data
    curr_df = detector.ref_df.sample(n=100, random_state=42).copy()
    report = detector.analyze_drift(curr_df)

    assert "timestamp" in report
    assert "is_drift_detected" in report
    assert "drifted_features" in report
    assert "features" in report
    assert "f_occ_entry_at_quote" in report["features"]
    assert "psi" in report["features"]["f_occ_entry_at_quote"]

def test_inference_logger_and_reader():
    test_feat = {"f_location": "Test Hub", "f_capacity": 50, "f_occ_entry_at_quote": 0.4}
    test_pred = {"predicted_occupancy_rate": 0.45, "pricing_multiplier": 1.0}

    log_inference_event(test_feat, test_pred, client_id="pytest-client")
    logs = get_recent_inference_logs(max_records=10)

    assert len(logs) > 0
    last_log = logs[-1]
    assert last_log["client_id"] == "pytest-client"
    assert last_log["features"]["f_location"] == "Test Hub"

def test_api_mlops_drift_endpoint(client):
    res = client.get("/api/v1/mlops/drift-report")
    assert res.status_code == 200
    data = res.json()
    assert "is_drift_detected" in data
    assert "recommendation" in data

def test_api_mlops_registry_endpoint(client):
    res = client.get("/api/v1/mlops/model-registry")
    assert res.status_code == 200
    data = res.json()
    assert "active_model" in data
    assert data["active_model"]["status"] == "CHAMPION_ACTIVE"
    assert "retraining_history_count" in data

def test_api_mlops_retrain_endpoint(client):
    res = client.post("/api/v1/mlops/retrain", json={"force_promote": True})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert data["promotion_status"] in ["PROMOTED_CHAMPION", "REJECTED_CHALLENGER"]
    assert "champion_metrics" in data
    assert "challenger_metrics" in data
