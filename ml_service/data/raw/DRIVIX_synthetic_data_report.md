# Drivix — Synthetic Data, First Model & Online-Learning Plan

*Generated 2026-10-09 from `DRIVIX_MASTER_DATASET_2026-10-09.xlsx` by `drivix_synth.py` (generator v1.0, seed 42).*

> **Read this first.** Every synthetic row in this package came from a rule-based simulation whose parameters are **assumptions**. They are not real historical bookings, real demand statistics or market prices. A model trained on them learns the simulation's rules. Good metrics on synthetic data **do not** show real-world accuracy.

---

## Contents of the package

| # | Deliverable | File |
|---|---|---|
| 1 | Original + synthetic rows | `DRIVIX_original_plus_synthetic.xlsx` (sheets: `bookings`, `original_data_quality`, `README`) |
| 2 | Synthetic rows only | `DRIVIX_synthetic_only.xlsx` (sheets: `bookings`, `model_training_table`, `hourly_occupancy`, `simulation_config`, `validation_checks`) |
| 3 | Data dictionary | `DRIVIX_data_dictionary.xlsx` (original columns, model-table columns, hourly-panel columns) |
| 4 | Generation rules & assumptions | this report, §3 |
| 5 | First-model feature/target definition | this report, §4, and `DRIVIX_data_dictionary.xlsx` → `first_model_spec` |
| 6 | Repeatable generator (fixed seed) | `drivix_synth.py` |
| 7 | Production data-collection schema | `drivix_production_schema.sql` (PostgreSQL; tested), summary in `DRIVIX_data_dictionary.xlsx` → `production_schema` |
| 8 | Model update & evaluation plan | this report, §5–6 |
| — | Smoke-test metrics on simulated data | `synthetic_eval_metrics.json` |

---

## 1. What the uploaded file contains

**One worksheet, 48 rows, 13 columns.** It holds real booking records from 2026-07-11 to 2026-09-04: 44 real rows and 4 test rows (`DRX-TEST-*`).

| Column | Role | Known at pricing time? |
|---|---|---|
| `bookingId` | Identifier | n/a |
| `locationName` | Input (categorical). Approved values: **Vanice Mall, Sharda University, Botanical garden** | Yes |
| `slotId` | Assigned at booking (blank when Cancelled) | No |
| `floor` | Input; always `L1` | Yes |
| `entryDate`, `entryTime` | Requested entry (IST time) | Yes |
| `duration` | Booked hours (integer, 1–9) | Yes |
| `totalCost` | Output of the pricing policy (INR) | Produced at pricing |
| `status` | Post-booking outcome: `completed`, `Checked Out`, `Expired`, `Cancelled` | No |
| `vehicleNumber`, `vehicleName`, `userId` | PII / identifiers / free text | n/a |
| `createdAt` | ISO-8601 UTC creation time, the best available proxy for pricing time | Yes |

**There is no target column.** None of the 13 columns is a demand or occupancy measure. A target can be **derived** (§4), but only with information the file does not contain.

### Missing columns that matter for demand prediction

1. **Capacity per location** (bookable slots). This is critical: occupancy cannot be computed without it. *Placeholder values were used; see §3.*
2. **A quote / price-request log.** Only completed bookings exist. Requests that saw a price and did not book, and requests that found the lot full, are invisible. This means demand is censored and price response cannot be learned.
3. **Base rate and policy version per booking.** Without these, `totalCost` cannot be split into a base price and a dynamic multiplier.
4. **Actual check-in and check-out times.** `duration` is the booked time, not the actual stay.
5. **Calendar context known in advance:** holidays, campus term dates, mall events.
6. **A single timezone-safe entry timestamp** (see bug below).

### Data-quality findings (original rows were kept unchanged and flagged in sheet `original_data_quality`)

| Issue | Rows | Impact |
|---|---|---|
| **Same-slot double-booking.** Non-cancelled bookings overlap on the same slot, mostly `L1-A1` | 8 pairs (16 flags) | The app does not enforce slot capacity, so `slotId` cannot be used for occupancy yet |
| **`entryDate` is the UTC date while `entryTime` is IST.** Bookings created between 00:00 and 05:30 IST land on the previous day | 8 | Lead times and occupancy are wrong by a day for these rows |
| Entry well before `createdAt` (booking for a past time) | 3 | Needs validation in the app |
| Malformed `entryDate` (`260715-07-14`) | 1 | Unparseable |
| `DRX-TEST-*` test records | 4 | Must be excluded from training (`data_origin = real_test`) |
| Effective rate outside ₹40–150/h (₹960/h, ₹360/h, ₹135/h, ₹26–37/h) | 12 | Treated as test or promotional prices, not market evidence |
| Mixed-case status labels; 10 spellings of about 6 vehicle models; the same plate under several userIds | column-level | Normalisation needed |

**Status meanings were assumed and need your confirmation:** `completed` and `Checked Out` mean the stay happened, `Expired` means the slot was reserved but not used (no-show), and `Cancelled` means the booking was released before entry.

---

## 2. Provenance rule

A 14th column, **`data_origin`**, is added in both deliverable workbooks. The first 13 columns keep the original schema exactly. The 48 original rows are byte-identical to the upload (this was verified).

| `data_origin` | Meaning | Use |
|---|---|---|
| `real` | Uploaded production rows | Validation and, later, training once enough rows exist |
| `real_test` | `DRX-TEST-*` rows | Never train on these |
| `synthetic` | Generated rows. Booking IDs start with `DRX-SYN-` and user IDs start with `5e` | Development and pipeline testing only |

Synthetic and real rows are also separated **in time**. Synthetic data covers 2026-03-02 to 2026-06-28, which is before the first real booking, so the two sets never compete for the same slot.

---

## 3. How the synthetic data was generated

**Result:** 11,189 simulated booking requests. Of these, **10,910 became bookings** and 279 were denied because the lot was full. The bookings break down as Vanice Mall 7,021, Sharda University 2,108 and Botanical garden 1,781. By status: completed 6,769, Checked Out 2,910, Cancelled 652, Expired 579.

All parameters live in the `CONFIG` block of `drivix_synth.py` and in the `simulation_config` sheet. **Every one of them is an assumption.**

### 3.1 Capacity *(placeholder; replace with real values)*
| Location | Assumed slots | Only constraint used |
|---|---|---|
| Vanice Mall | 20 | must be ≥ 10 (slot `L1-A10` observed) |
| Sharda University | 12 | must be ≥ 4 |
| Botanical garden | 8 | must be ≥ 1 |

### 3.2 Demand (arrivals)
Requests per location and clock hour follow a Poisson distribution with rate:

```
λ = peak_rate × hourly_profile[hour] × weekday_factor[dow] × trend(day) × day_shock × week_shock
```

- **Hourly and weekday shapes** encode simple qualitative assumptions. A mall peaks in the evening and at weekends. A campus peaks on weekday mornings and is quiet at weekends. A garden peaks on weekend mornings and late afternoons. These shapes are not measured.
- **Noise:** a day-level Gamma shock (CV 20%) and a location-week lognormal shock (σ = 0.08).
- **Trend:** ×0.90 rising to ×1.10 across the period, standing in for platform adoption growth.
- **Price does not affect demand in the simulation.** This is deliberate: no elasticity is invented. Price response must be learned from real, logged quotes (§6).

### 3.3 Booking attributes
- **Lead time** is a mixture. 55% are immediate (`createdAt` is 1–59 s after the entry minute, matching the real drive-up pattern). 30% are same-day (15–480 min ahead). 15% are made in advance (1–3 days, created between 08:00 and 23:00). Planned bookings snap to :00 or :30 with probability 0.6, as the real advance bookings do.
- **Duration** in whole hours comes from per-location distributions with mode 2h and range 1–9h, matching the observed range.
- **Users and vehicles:** a pool of 1,500 synthetic users with a Zipf-like booking frequency (a few frequent users, many occasional ones). Each user has one vehicle. Model names are the normalised versions of names in the file. Plates use observed state codes (DL/UP/BR) and are checked never to match a real plate.

### 3.4 Capacity-aware allocation
Requests are processed **in `createdAt` order** against a minute-level slot grid:
1. The quote-time state is read *before* anything else happens: the share of slots busy at the entry minute, and the share not free for the whole requested window.
2. If no slot is free for the whole window, the request is recorded as **`denied_full`** (censored demand) and no booking row is created.
3. Otherwise the lowest-numbered free slot is assigned. The real app also favours `L1-A1`.
4. **Status** is then drawn according to lead type. Cancellation probability is 3% / 8% / 12% (immediate / same-day / advance). No-show (`Expired`) probability is 2% / 7% / 12%. A stay is `Checked Out` 30% of the time and `completed` otherwise.
5. `Cancelled` bookings release the slot and have a blank `slotId`, as in the real data. `Expired` bookings keep the slot reserved.

### 3.5 Price (legacy rule-based policy `rule_v0`, bounded)
```
busy = share of slots not free for the requested window at quote time
multiplier = 1.50 if busy ≥ 0.80 | 1.25 if ≥ 0.60 | 1.10 if ≥ 0.30 | 1.00 if ≥ 0.10 | 0.90 otherwise
totalCost  = round(duration × ₹60 × multiplier)        # bounds: 0.90 ≤ multiplier ≤ 1.50
```
The ₹60/h base rate is the modal rate **in your own app's records**. It is not a market price. The resulting effective rates are ₹54, 60, 66, 75 and 90 per hour.

### 3.6 Validation checks (all pass; see sheet `validation_checks`)
- Booking IDs are unique and never collide with real IDs.
- Every location is one of the three approved names.
- Durations and prices are positive, and every price is inside the policy bounds.
- `createdAt` ≤ entry + 60 s.
- `Cancelled` rows have no slot, and all other rows have one.
- **There are no overlapping bookings on any slot.**
- Slot numbers are ≤ capacity.
- No synthetic row copies an original row.
- Re-running with the same seed reproduces identical output (verified by checksum).

---

## 4. The first model: target, features and leakage

### 4.1 Do the existing columns support a demand target?
**Partly.** Occupancy can be **derived** from `locationName + entryDate + entryTime + duration + status`, but three fixes are needed first:
1. a capacity per location;
2. same-slot overlaps prevented at the source;
3. the `entryDate` UTC/IST bug fixed.

With only 44 real rows across 3 locations and 8 weeks, a real occupancy model is **not trainable yet**. Real data should be collected through the schema in §6 rather than reconstructed from this export.

### 4.2 Target
**`y_reserved_occupancy_rate`**: for a price request for location *L* and requested entry *e*, the final share of *L*'s slot-minutes that are reserved (non-cancelled, no-shows included) during the clock hour containing *e*.

This target was chosen because:
- it is the demand signal pricing reacts to;
- it is bounded in [0, 1] and comparable across lot sizes;
- it is defined independently of the price shown.

No-shows are included because they block inventory. `physical_occupancy_rate` is also produced in `hourly_occupancy` for when gate or sensor data arrives.

The label is **delayed**: it exists only after the target hour has ended, plus a settling window for late cancellations and check-outs.

### 4.3 Four separate concepts

| Concept | Columns (model table) |
|---|---|
| **Features known at pricing time** | `f_location`, `f_capacity`, `f_entry_hour`, `f_entry_dow`, `f_is_weekend`, `f_lead_time_min`, `f_requested_duration_h`, `f_occ_entry_at_quote`, `f_busy_frac_window_at_quote`, `f_requests_last_60min_location`, `f_occ_same_hour_last_week` |
| **Prediction target** | `y_reserved_occupancy_rate` (keyed by `target_hour_start_ist`) |
| **Post-booking outcomes** (stored for future training, never features) | `outcome_request`, `outcome_bookingId`, `outcome_status`, and in production check-in/out, actual stay, final charge |
| **Price-calculation rules & constraints** | `policy_price_multiplier`, `policy_quoted_total_inr`, defined by a versioned policy, never learned implicitly |

### 4.4 Leakage controls
- At-quote occupancy features use **only bookings created before the quote**. The simulation computes them before allocating the current request.
- `f_occ_same_hour_last_week` is used only if that hour had ended before the quote. Otherwise it is NaN.
- **Excluded:** `totalCost` and the quoted price (policy output; using them would create a price→prediction→price feedback loop), `status`, `slotId`, final occupancy, actual stay, and any aggregate whose window ends after the quote.
- **Chronological split by quote time:** train on weeks 1–12, validate on weeks 13–14, test on weeks 15–17. There is no random shuffling.

### 4.5 Smoke-test result on simulated data (not accuracy evidence)

| MAE of occupancy rate | Validation | Test |
|---|---|---|
| Gradient-boosted trees (HGB) | 0.078 | 0.083 |
| Baseline: occupancy already booked at quote time | 0.183 | 0.189 |
| Baseline: same hour last week | 0.174 | 0.193 |
| Baseline: training mean | 0.192 | 0.211 |

All this table shows is that the pipeline works end to end and that the features carry the signal **the simulation put there**. On real data the numbers will be different, and the baselines may be much harder to beat.

---

## 5. Production workflow (online learning with safeguards)

```
request ─► freeze features ─► predict (approved model) ─► bounded pricing policy ─► show quote
                                                                                      │
             ┌────────────────────────────────────────────────────────────────────────┘
             ▼
   booked? (bookings.quote_id) ─► lifecycle events (append-only) ─► hour ends + settling window
             ▼
   label finalised & validated ─► training_examples view ─► scheduled retrain ─► evaluate vs baselines
             ▼                                                                         ▼
       quarantine if invalid                                   shadow ─► canary ─► active (or reject / rollback)
```

| Step | What happens | Where it is stored |
|---|---|---|
| 1 | Price request arrives, carrying an **idempotency key** that deduplicates retries | `price_quotes` |
| 2 | Prediction timestamp and the **exact feature vector** are frozen as JSON with `feature_set_version` | `price_quotes.features_json` |
| 3 | The **currently active** model predicts occupancy. If the model fails, a rule fallback is used and the reason is logged | `price_quotes.model_version`, `prediction_fallback_reason` |
| 4 | A **separate bounded policy** sets the multiplier: min/max limits, a maximum change per quote, and an optional small exploration share | `pricing_policy_versions`, `price_quotes.price_multiplier`, `is_exploration` |
| 5 | Quote displayed (`displayed_at`) and conversion recorded; full-lot quotes are logged too | `price_quotes`, `bookings.quote_id` |
| 6 | Lifecycle and gate events collected (late, out-of-order and duplicate safe, deduplicated by `event_id`) | `booking_events`, `gate_events` |
| 7 | Hourly labels written after hour end plus the settling window, then validated. Failures go to quarantine; late corrections bump `label_version` | `occupancy_labels_hourly` |
| 8 | Scheduled retrain (e.g. weekly) on **finalised, valid, real** examples, from an immutable data snapshot | `training_examples`, `training_runs` |
| 9 | Evaluation against baselines on a **chronological holdout** that comes strictly after the training window | `training_runs.gate_results_json` |
| 10 | Promotion only if every gate passes. The previous version stays registered for one-step rollback | `model_registry.status` |

The database **exclusion constraint** (`no_slot_double_booking`) makes overlapping bookings on a slot impossible. It was tested on PostgreSQL 16 by inserting two of the real overlapping bookings: the second was rejected.

**Label validation rules (step 7):**
- `0 ≤ occupancy ≤ 1`;
- capacity version present;
- no orphan events;
- the booking's terminal state has been reached or the hour is older than 24h;
- duplicate events are removed;
- an hour whose capacity changed mid-hour is quarantined;
- excluded: `real_test`, `synthetic` and admin-created rows.

---

## 6. Step-by-step plan: from synthetic to real

| Phase | Trigger | Model in production | Training data | Key actions |
|---|---|---|---|---|
| **0. Fix & instrument** | now | none (`rule_v0` on current occupancy) | — | Add capacity, fix the `entryDate` bug, enforce the slot constraint, deploy the quote log (`price_quotes`) and the event log. Without these, nothing downstream is trustworthy |
| **1. Synthetic development** | now, in parallel | none | synthetic only | Build the feature pipeline, training job, evaluation report and registry against `DRIVIX_synthetic_only.xlsx`. Treat every metric as a pipeline test |
| **2. Shadow on real traffic** | instrumentation live | `rule_v0` prices; the synthetic-trained model predicts in **shadow** (logged, not used) | — | Compare shadow predictions with real labels as they finalise. Expect the synthetic model to be wrong, and measure how wrong |
| **3. First real model** | roughly ≥ 8 weeks **and** ≥ ~2,000 finalised real location-hours per location with non-trivial occupancy (a starting rule of thumb, to be revised) | still `rule_v0` until gates pass | **real only**. Synthetic data may serve as a pre-training prior, but only with a separate down-weighted flag, and is dropped once real data suffices | Must beat all baselines on the most recent 2–4 real weeks of holdout, per location |
| **4. Model-driven bounded pricing** | phase-3 gates pass | approved model → bounded policy | real | Shadow, then canary (e.g. 10% of quotes or one location), then full rollout. Start with a small exploration share (e.g. 5%) within the bounds so price response can be learned later |
| **5. Steady state** | ongoing | latest approved | rolling window of real data | Scheduled weekly retrain, drift monitoring, rollback |

**Promotion gates (all must pass):**
1. MAE beats every baseline on the chronological holdout, overall **and** for each location;
2. no location gets worse than the current active model by more than a set tolerance;
3. calibration is acceptable for the high-occupancy band (≥ 0.8) that drives surge prices;
4. a policy simulation on the holdout keeps prices inside bounds, limits the share of quotes at the maximum multiplier, and changes revenue by no more than an agreed limit;
5. every feature is available at quote time (schema check on `features_json`);
6. a human signs off (`approved_by`).

**Drift and rollback:**
- Monitor every day:
  - feature distributions (PSI) against training;
  - rolling MAE on newly finalised labels compared with the model's holdout MAE;
  - fallback rate;
  - share of quotes at the price bounds.
- When an alert fires, raise it for review. If live MAE exceeds the active model's holdout MAE by a set margin for N consecutive days, **automatically fall back** to the previous model or to `rule_v0`.
- Rollback means switching `model_registry.status`. Because every quote stores its `model_version`, any period can be audited.

**What not to do:**
- retrain on every incoming row;
- train on unfinalised labels;
- shuffle time before splitting;
- mix synthetic and real data without `data_origin`;
- quote synthetic metrics as evidence of real accuracy;
- feed the model's own price back in as a demand feature.

---

## 7. Re-running the generator

```bash
pip install pandas openpyxl numpy scikit-learn
python drivix_synth.py --input DRIVIX_MASTER_DATASET_2026-10-09.xlsx --out ./out --seed 42
```

To use real capacities or change any assumption, edit `CONFIG` at the top of the script and re-run. The output is deterministic for a given seed and config.

## Open questions for you

1. What are the real **slot counts** per location? (They replace the placeholders 20 / 12 / 8.)
2. Are the **status meanings** right? In particular, does `Expired` mean a no-show, and what is the difference between `completed` and `Checked Out`?
3. Were the ₹960/h, ₹360/h and ₹26–37/h bookings **tests or promotions**?
