import os
import sys
import pytest
from starlette.testclient import TestClient

API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api"))
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
for p in [API_DIR, SRC_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert "version" in data

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_predict_single_quote(client):
    payload = {
        "location_name": "Connaught Place",
        "total_capacity": 100,
        "available_slots": 10,
        "base_hourly_rate": 60,
        "duration_hours": 2,
        "lead_time_minutes": 15
    }
    res = client.post("/api/v1/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["location_name"] == "Connaught Place"
    assert 0.0 <= data["predicted_occupancy_rate"] <= 1.0
    assert data["pricing_multiplier"] in [0.85, 1.00, 1.10, 1.25, 1.50]
    assert data["total_quoted_cost"] == data["recommended_hourly_price"] * 2

def test_predict_batch_quotes(client):
    payload = {
        "quotes": [
            {
                "location_name": "Vanice Mall",
                "total_capacity": 150,
                "available_slots": 15,
                "base_hourly_rate": 60,
                "duration_hours": 2
            },
            {
                "location_name": "Botanical garden",
                "total_capacity": 80,
                "available_slots": 70,
                "base_hourly_rate": 50,
                "duration_hours": 1
            }
        ]
    }
    res = client.post("/api/v1/predict/batch", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 2
    assert len(data["results"]) == 2

def test_predict_validation_errors(client):
    # Invalid duration <= 0
    res = client.post("/api/v1/predict", json={
        "location_name": "Vanice Mall",
        "total_capacity": 100,
        "duration_hours": 0
    })
    assert res.status_code == 422

    # Invalid capacity <= 0
    res2 = client.post("/api/v1/predict", json={
        "location_name": "Vanice Mall",
        "total_capacity": 0,
        "duration_hours": 2
    })
    assert res2.status_code == 422
