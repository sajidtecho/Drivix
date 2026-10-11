import os
import sys
import argparse
import json

# Ensure utf-8 encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from drift_detector import generate_drift_report
from retrain_pipeline import DrivixRetrainingPipeline

def main():
    parser = argparse.ArgumentParser(description="Drivix MLOps Automated Drift Detection & Retraining Job")
    parser.add_argument("--force", action="store_true", help="Force model retraining regardless of drift check result")
    parser.add_argument("--check-drift-only", action="store_true", help="Only run drift analysis and output report without retraining")
    args = parser.parse_args()

    print("=" * 60)
    print("[DRIVIX MLOPS PIPELINE] DRIFT ANALYSIS & RETRAINING WORKER")
    print("=" * 60)

    # 1. Run Drift Check
    print("\n[Step 1/2] Analyzing data distribution drift...")
    drift_report = generate_drift_report()
    is_drift = drift_report.get("is_drift_detected", False)
    drifted_cols = drift_report.get("drifted_features", [])

    print(f"  * Reference sample size: {drift_report.get('reference_sample_size')}")
    print(f"  * Production sample size: {drift_report.get('production_sample_size')}")
    print(f"  * Overall drift detected: {is_drift}")
    print(f"  * Drifted features ({len(drifted_cols)}): {drifted_cols}")
    print(f"  * Policy Recommendation: {drift_report.get('recommendation')}")

    if args.check_drift_only:
        print("\n[Complete] --check-drift-only specified. Exiting.")
        return

    # 2. Evaluate Retraining Trigger
    should_retrain = is_drift or args.force

    if should_retrain:
        trigger_reason = "Drift Detected" if is_drift else "Forced CLI Flag"
        print(f"\n[Step 2/2] Triggering automated model retraining ({trigger_reason})...")
        pipeline = DrivixRetrainingPipeline()
        retrain_result = pipeline.run_retraining(force_promote=args.force)

        print(f"  * Retraining ID: {retrain_result.get('retraining_id')}")
        print(f"  * Execution Duration: {retrain_result.get('duration_seconds')}s")
        print(f"  * Promotion Status: {retrain_result.get('promotion_status')}")
        print(f"  * Champion MAE: {retrain_result['champion_metrics']['mae']} | R2: {retrain_result['champion_metrics']['r2']}")
        print(f"  * Challenger MAE: {retrain_result['challenger_metrics']['mae']} | R2: {retrain_result['challenger_metrics']['r2']}")
        if retrain_result.get("archived_model"):
            print(f"  * Previous model archived as: {retrain_result['archived_model']}")
        print("\n[OK] MLOps Retraining Pipeline Finished Successfully!")
    else:
        print("\n[Step 2/2] No significant drift detected. Model is stable. Retraining skipped.")

if __name__ == "__main__":
    main()
