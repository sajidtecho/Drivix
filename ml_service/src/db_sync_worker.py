import os
import sys
import argparse
from datetime import datetime
from typing import Dict, Any, Optional

# Ensure utf-8 encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from db_connector import DrivixDatabaseConnector
from online_learner import get_online_learner
from predict import get_inference_engine


def sync_online_learning_with_db(
    limit: int = 200,
    force_full_sync: bool = False,
    mongo_uri: Optional[str] = None
) -> Dict[str, Any]:
    """
    Orchestrates end-to-end synchronization between the live MongoDB database
    and the online adaptive machine learning model.
    """
    connector = DrivixDatabaseConnector(mongo_uri=mongo_uri)
    is_connected = connector.is_connected()
    learner = get_online_learner()
    engine = get_inference_engine()

    if not is_connected:
        return {
            "success": False,
            "error": "Could not connect to MongoDB database. Check network or MONGO_URI.",
            "database_connected": False,
            "online_learner_status": learner.get_status()
        }

    total_in_db = connector.get_total_bookings_count()

    # Determine watermark checkpoint
    since_ts = None
    if not force_full_sync and learner.last_sync_timestamp:
        try:
            since_ts = datetime.fromisoformat(learner.last_sync_timestamp.replace("Z", "+00:00"))
        except Exception:
            since_ts = None

    print(f"[DB Sync] Fetching bookings (watermark: {since_ts}, limit: {limit})...")
    X_df, y_series, latest_ts, records_count = connector.fetch_training_batch_from_db(
        since_timestamp=since_ts,
        limit=limit
    )

    if records_count == 0:
        return {
            "success": True,
            "message": "Online model is fully up to date with the database. No new records found.",
            "records_extracted": 0,
            "total_db_bookings": total_in_db,
            "database_connected": True,
            "online_learner_status": learner.get_status()
        }

    print(f"[DB Sync] Extracted {records_count} operational bookings. Executing online SGD partial_fit...")

    # Helper function to get base predictions from champion model
    def champion_predict(X):
        if engine.pipeline is not None:
            return engine.pipeline.predict(X)
        return None

    train_res = learner.update_from_batch(
        X_df,
        y_series,
        champion_predict_fn=champion_predict,
        latest_timestamp=latest_ts
    )

    return {
        "success": True,
        "records_extracted": records_count,
        "total_db_bookings": total_in_db,
        "database_connected": True,
        "training_result": train_res,
        "online_learner_status": learner.get_status()
    }


def main():
    parser = argparse.ArgumentParser(description="Drivix Online Learning Database Sync Worker")
    parser.add_argument("--limit", type=int, default=200, help="Maximum number of bookings to ingest")
    parser.add_argument("--force", action="store_true", help="Force ingestion of all bookings from scratch (ignore checkpoint)")
    parser.add_argument("--reset", action="store_true", help="Reset online learner before syncing")
    args = parser.parse_args()

    print("=" * 65)
    print(" [DRIVIX MLOPS] ONLINE STREAMING LEARNER - DATABASE SYNC WORKER")
    print("=" * 65)

    if args.reset:
        print("[DB Sync] Resetting online learner weights...")
        learner = get_online_learner()
        learner.reset()

    result = sync_online_learning_with_db(limit=args.limit, force_full_sync=args.force)

    print("\nResult:")
    for k, v in result.items():
        print(f"  * {k}: {v}")

    print("\n[DB Sync Worker Complete]")


if __name__ == "__main__":
    main()
