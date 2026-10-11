import os
import json
from datetime import datetime
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "reports"))
DRIFT_DIR = os.path.join(REPORTS_DIR, "drift_reports")
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "processed"))
REFERENCE_PATH = os.path.join(DATA_DIR, "train_dataset.csv")

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_bins: int = 10) -> float:
    """
    Computes Population Stability Index (PSI) between reference baseline
    and production distribution.
    - PSI < 0.1: No significant shift (Stable)
    - 0.1 <= PSI < 0.2: Moderate shift (Monitor)
    - PSI >= 0.2: Significant drift detected (Action required)
    """
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]

    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    # Determine quantile bins based on reference distribution
    percentiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(expected, percentiles)
    bins[0] = -np.inf
    bins[-1] = np.inf
    bins = np.unique(bins)

    if len(bins) < 2:
        return 0.0

    expected_counts, _ = np.histogram(expected, bins=bins)
    actual_counts, _ = np.histogram(actual, bins=bins)

    expected_pct = expected_counts / len(expected)
    actual_pct = actual_counts / len(actual)

    # Apply Laplace smoothing to avoid log(0) or division by zero
    expected_pct = np.where(expected_pct == 0, 1e-4, expected_pct)
    actual_pct = np.where(actual_pct == 0, 1e-4, actual_pct)

    psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(round(max(0.0, psi_value), 4))

class DrivixDriftDetector:
    def __init__(self, reference_path=None):
        if reference_path is None:
            reference_path = REFERENCE_PATH
        self.reference_path = reference_path
        self.ref_df = None
        if os.path.exists(self.reference_path):
            self.ref_df = pd.read_csv(self.reference_path)

    def analyze_drift(self, current_df: pd.DataFrame, psi_threshold: float = 0.20, ks_alpha: float = 0.05) -> dict:
        """
        Runs two-sample Kolmogorov-Smirnov tests and PSI computations on all key features.
        """
        if self.ref_df is None:
            raise RuntimeError(f"Reference dataset not found at {self.reference_path}")

        numerical_features = [
            'f_occ_entry_at_quote',
            'f_lead_time_min',
            'f_capacity',
            'f_entry_hour',
            'f_entry_dow',
            'f_requests_last_60min_location',
            'f_busy_frac_window_at_quote'
        ]

        feature_reports = {}
        drifted_features = []

        for feat in numerical_features:
            if feat in self.ref_df.columns and feat in current_df.columns:
                ref_vals = self.ref_df[feat].dropna().values
                curr_vals = current_df[feat].dropna().values

                if len(curr_vals) >= 5:
                    ks_stat, ks_pval = ks_2samp(ref_vals, curr_vals)
                    psi = calculate_psi(ref_vals, curr_vals)

                    is_drift = bool((psi >= psi_threshold) or (ks_pval < ks_alpha and ks_stat > 0.15))
                    if is_drift:
                        drifted_features.append(feat)

                    feature_reports[feat] = {
                        "type": "numerical",
                        "ks_statistic": round(float(ks_stat), 4),
                        "ks_pvalue": float(f"{ks_pval:.4e}"),
                        "psi": psi,
                        "drift_detected": is_drift,
                        "severity": "CRITICAL" if psi >= 0.25 else "MODERATE" if psi >= 0.10 else "STABLE"
                    }

        # Categorical drift on location distribution
        if 'f_location' in self.ref_df.columns and 'f_location' in current_df.columns:
            ref_dist = self.ref_df['f_location'].value_counts(normalize=True).to_dict()
            curr_dist = current_df['f_location'].value_counts(normalize=True).to_dict()
            all_locs = set(ref_dist.keys()).union(set(curr_dist.keys()))

            max_delta = max([abs(ref_dist.get(loc, 0.0) - curr_dist.get(loc, 0.0)) for loc in all_locs]) if all_locs else 0.0
            cat_drift = bool(max_delta > 0.25)
            if cat_drift:
                drifted_features.append('f_location')

            feature_reports['f_location'] = {
                "type": "categorical",
                "max_category_shift": round(float(max_delta), 4),
                "drift_detected": cat_drift,
                "severity": "MODERATE" if cat_drift else "STABLE"
            }

        is_overall_drift = len(drifted_features) >= 2 or any(
            f.get("psi", 0.0) >= 0.25 for f in feature_reports.values()
        )

        report = {
            "timestamp": datetime.now().isoformat(),
            "reference_sample_size": len(self.ref_df),
            "production_sample_size": len(current_df),
            "is_drift_detected": is_overall_drift,
            "drifted_features_count": len(drifted_features),
            "drifted_features": drifted_features,
            "recommendation": "TRIGGER_RETRAINING" if is_overall_drift else "MODEL_STABLE",
            "features": feature_reports
        }

        # Persist report
        os.makedirs(DRIFT_DIR, exist_ok=True)
        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = os.path.join(DRIFT_DIR, f"drift_report_{timestamp_str}.json")
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        latest_file = os.path.join(REPORTS_DIR, "latest_drift_report.json")
        with open(latest_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return report

def generate_drift_report():
    """
    Convenience function to run drift analysis against recent inference logs
    or validation distributions.
    """
    from inference_logger import get_recent_inference_logs
    detector = DrivixDriftDetector()

    if detector.ref_df is None:
        raise RuntimeError(f"Reference dataset not found at {detector.reference_path}")

    logs = get_recent_inference_logs(max_records=500)
    if len(logs) >= 10:
        rows = [item["features"] for item in logs if "features" in item]
        curr_df = pd.DataFrame(rows)
    else:
        # Fallback: compare validation set against training set baseline
        test_path = os.path.join(DATA_DIR, "test_dataset.csv")
        if os.path.exists(test_path):
            curr_df = pd.read_csv(test_path).tail(200)
        else:
            curr_df = detector.ref_df.tail(100)

    return detector.analyze_drift(curr_df)
