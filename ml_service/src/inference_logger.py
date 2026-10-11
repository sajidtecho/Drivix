import os
import json
from datetime import datetime
from threading import Lock

LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
LOG_FILE = os.path.join(LOGS_DIR, "inference_logs.jsonl")

_log_lock = Lock()

def log_inference_event(features: dict, prediction_result: dict, client_id: str = "drivix-backend"):
    """
    Appends an inference request and its model output to a persistent JSONL log
    for data drift monitoring, performance auditing, and retraining ingestion.
    """
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    event = {
        "timestamp": datetime.now().isoformat(),
        "client_id": client_id,
        "features": features,
        "prediction": {
            "predicted_occupancy_rate": prediction_result.get("predicted_occupancy_rate"),
            "demand_score_percent": prediction_result.get("demand_score_percent"),
            "pricing_multiplier": prediction_result.get("pricing_multiplier"),
            "recommended_hourly_price": prediction_result.get("recommended_hourly_price"),
            "total_quoted_cost": prediction_result.get("total_quoted_cost")
        }
    }

    with _log_lock:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")

def get_recent_inference_logs(max_records: int = 1000):
    """
    Reads the most recent logged inference events as a list of dicts.
    """
    if not os.path.exists(LOG_FILE):
        return []
    
    records = []
    with _log_lock:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        records.append(json.loads(line))
                    except Exception:
                        continue
    return records[-max_records:]
