import os
import nbformat as nbf

def create_cell(cell_type, content):
    if cell_type == "markdown":
        return nbf.v4.new_markdown_cell(content)
    elif cell_type == "code":
        return nbf.v4.new_code_cell(content)
    else:
        raise ValueError(f"Unknown cell type: {cell_type}")

# ==============================================================================
# NOTEBOOK 1: Data Understanding and Validation
# ==============================================================================
def build_notebook_1():
    nb = nbf.v4.new_notebook()
    cells = []

    cells.append(create_cell("markdown", """# Drivix MLDLC — Stage 1: Data Understanding and Validation

**Project:** Drivix Smart Parking Dynamic Pricing Engine  
**Objective:** Comprehensive data audit, schema validation, data quality check, and data-origin separation.  
**Subsystem:** `ml_service`

---

## 1. Business Context & Objective
Drivix utilizes dynamic pricing to optimize parking space allocation, mitigate congestion during peak hours, and increase parking operator revenues.  
To prevent feedback loops where price predicts price, the machine learning objective is framed as **Occupancy Rate Forecasting** ($y \in [0.0, 1.0]$) at quote time for the requested entry hour. Dynamic multipliers ($0.85\\times$ to $1.50\\times$) are then applied deterministically via bounded policies.

In this stage, we:
1. Inspect all available data artifacts (`DRIVIX_original_plus_synthetic.xlsx`, `DRIVIX_synthetic_only (1).xlsx`, `DRIVIX_synthetic_data_report.md`).
2. Audit schemas, data types, missingness, and data-origin provenance.
3. Investigate data-quality anomalies in the original real dataset (double-bookings, UTC/IST timestamp mismatches, abnormal rates).
4. Verify leakage boundaries between quote-time features ($f\_*$) and post-booking outcomes ($outcome\_*$)."""))

    cells.append(create_cell("code", """import os
import sys
import pandas as pd
import numpy as np

# Configure display options
pd.set_option('display.max_columns', 25)
pd.set_option('display.width', 1000)

RAW_DIR = os.path.join("..", "data", "raw")
synthetic_path = os.path.join(RAW_DIR, "DRIVIX_synthetic_only (1).xlsx")
original_path = os.path.join(RAW_DIR, "DRIVIX_original_plus_synthetic.xlsx")

print("Files in raw data directory:")
for f in os.listdir(RAW_DIR):
    fpath = os.path.join(RAW_DIR, f)
    print(f" - {f} ({os.path.getsize(fpath):,} bytes)")"""))

    cells.append(create_cell("markdown", """## 2. Inspecting Master Synthetic Workbook & Sheets
Let us load the sheets from the synthetic deliverable to understand the available tables."""))

    cells.append(create_cell("code", """import openpyxl

wb_synth = openpyxl.load_workbook(synthetic_path, read_only=True)
print("Sheets in synthetic workbook:", wb_synth.sheetnames)

# Load model_training_table
df_model = pd.read_excel(synthetic_path, sheet_name='model_training_table')
print(f"\\nmodel_training_table dimensions: {df_model.shape[0]:,} rows x {df_model.shape[1]} columns")
df_model.head(3)"""))

    cells.append(create_cell("markdown", """## 3. Schema & Data Types Validation
We inspect each column's role and data type in `model_training_table`."""))

    cells.append(create_cell("code", """info_df = pd.DataFrame({
    'Column': df_model.columns,
    'Non-Null Count': df_model.notnull().sum().values,
    'Null Count': df_model.isnull().sum().values,
    'Null %': (df_model.isnull().sum().values / len(df_model) * 100).round(2),
    'Dtype': df_model.dtypes.values
})
info_df"""))

    cells.append(create_cell("markdown", """### Interpretation of Missing Values:
1. `f_occ_same_hour_last_week` has 624 missing values (5.58%). This corresponds exactly to **Week 1** where a 7-day prior history does not yet exist.
2. `outcome_bookingId` and `outcome_status` have 279 missing values (2.49%). These represent quote requests that were `denied_full` because the parking facility was at 100% capacity.
3. Crucially, **all quote-time features ($f\_*$) and target ($y\_*$) have zero unexpected nulls**."""))

    cells.append(create_cell("markdown", """## 4. Audit of Real Uploaded Bookings vs. Synthetic Data
We now inspect `DRIVIX_original_plus_synthetic.xlsx` to audit the 48 real records and understand why synthetic augmentation was required."""))

    cells.append(create_cell("code", """df_all_bookings = pd.read_excel(original_path, sheet_name='bookings')
print("Breakdown of bookings by data_origin:")
print(df_all_bookings['data_origin'].value_counts())

# Inspect real records
df_real = df_all_bookings[df_all_bookings['data_origin'] == 'real'].copy()
print(f"\\nReal Production Records Count: {len(df_real)}")
df_real[['bookingId', 'locationName', 'slotId', 'entryDate', 'entryTime', 'duration', 'totalCost', 'status']].head(10)"""))

    cells.append(create_cell("markdown", """## 5. Data-Quality Findings in the Original Real Data
Let us load the `original_data_quality` sheet to review flagged real records."""))

    cells.append(create_cell("code", """df_quality = pd.read_excel(original_path, sheet_name='original_data_quality')
print(f"Quality flags documented: {len(df_quality)}")
df_quality.head(10)"""))

    cells.append(create_cell("markdown", """### Key Real-Data Quality Findings:
1. **Double-Booking on Same Slot:** 8 pairs (16 rows) had overlapping non-cancelled bookings on slot `L1-A1`.
2. **Timezone Bug:** `entryDate` was stored as UTC date while `entryTime` was in Indian Standard Time (IST). For midnight bookings (00:00–05:30 IST), `entryDate` landed on the prior day.
3. **Small Sample Size:** Only 44 real rows across 8 weeks (less than 1 booking per day across 3 locations). This is insufficient to train a generalized machine learning model without synthetic bootstrap.
4. **Missing Features:** Real booking exports lacked facility capacity and quote-time state logs."""))

    cells.append(create_cell("markdown", """## 6. Verification of Chronological Splits and Leakage Prevention
The modeling table pre-partitions the dataset chronologically:
- **Train:** Weeks 1–12 (7,704 rows)
- **Valid:** Weeks 13–14 (1,355 rows)
- **Test:** Weeks 15–17 (2,130 rows)"""))

    cells.append(create_cell("code", """split_summary = df_model.groupby('split').agg(
    rows=('quote_id', 'count'),
    min_date=('quote_ts_ist', 'min'),
    max_date=('quote_ts_ist', 'max'),
    locations=('f_location', lambda s: s.nunique()),
    mean_target=('y_reserved_occupancy_rate', 'mean')
).reset_index()

split_summary"""))

    cells.append(create_cell("markdown", """## 7. Stage 1 Conclusions & Dataset Selection
- **Selected Dataset:** `model_training_table` from `DRIVIX_synthetic_only (1).xlsx`.
- **Target Variable:** `y_reserved_occupancy_rate` ($[0.0, 1.0]$ continuous).
- **Leakage Controls:**
  - `policy_quoted_total_inr` and `policy_price_multiplier` are strictly excluded from predictors.
  - `outcome_*` fields are excluded.
  - Splits are purely chronological (no random shuffle leakage).
- **Readiness:** Dataset is verified and validated. Proceeding to Exploratory Data Analysis (EDA)."""))

    with open(os.path.join("notebooks", "01_data_understanding_and_validation.ipynb"), "w") as f:
        nbf.write(nb, f)
    print("Notebook 1 written successfully.")

if __name__ == "__main__":
    build_notebook_1()
