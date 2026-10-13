# Drivix Machine Learning Pricing Subsystem

This folder contains the folder structure and blueprints for building and integrating a Machine Learning model (e.g., Random Forest or XGBoost) to predict parking demand and automatically calculate dynamic hourly prices.

---

## 📊 Machine Learning Pipeline Workflow

The workflow is broken down into data collection, training, evaluation, and production deployment:

```mermaid
graph TD
    subgraph Data Flow [1. Data Preparation]
        A[Raw CSV Data] -->|data_preprocessing.py| B[Train Split 80%]
        A -->|data_preprocessing.py| C[Test Split 20%]
    end

    subgraph Pipeline [2. Engineering & Training]
        B -->|feature_engineering.py| D[Features: hour, occupancy, weather, event, holiday]
        D -->|train.py| E[Model Fit: Random Forest Regression]
        E -->|Serialization| F[drivix_price_model.pkl]
        E -->|ONNX Compile| G[drivix_price_model.onnx]
    end

    subgraph Validation [3. Evaluation]
        C -->|feature_engineering.py| H[Validation Features]
        H & F -->|evaluate.py| I[Metrics: MAE, RMSE, R² Score]
    end
    
    style E fill:#4f46e5,stroke:#312e81,stroke-width:2px,color:#fff
    style F fill:#059669,stroke:#065f46,stroke-width:2px,color:#fff
    style G fill:#059669,stroke:#065f46,stroke-width:2px,color:#fff
```

---

## ⚡ Integration Architectures (How it connects to Express.js)

Depending on your production requirements, choose one of these two integration flowcharts:

### Architecture A: Microservice REST API (FastAPI)
Suitable if you want to keep the Python model running as a separate service.

```mermaid
sequenceDiagram
    participant Client as React App
    participant NodeServer as Express.js Backend
    participant FastServer as FastAPI Server (Python)
    participant Model as Trained Model (.pkl)

    Client->>NodeServer: Book Parking Slot
    Note over NodeServer: Collects context: weather, hour,<br/>occupancy rate, holiday status
    NodeServer->>FastServer: POST /api/v1/predict (JSON payload)
    FastServer->>Model: Load features & Run Regressor
    Model-->>FastServer: Returns Demand Score (0-100)
    FastServer-->>NodeServer: Returns Multiplier & Recommended Price
    NodeServer-->>Client: Returns checkout total + surge badge
```

### Architecture B: Direct Native Execution (NodeJS + ONNX)
Suitable if you want a serverless setup without deploying a separate Python server.

```mermaid
sequenceDiagram
    participant Client as React App
    participant NodeServer as Express.js Backend
    participant ONNXEngine as ONNX NodeJS Runtime
    participant Model as pricing_model.onnx

    Note over NodeServer: Loads onnxruntime-node library
    Client->>NodeServer: Book Parking Slot
    Note over NodeServer: Maps categories (e.g. weather to numeric)
    NodeServer->>ONNXEngine: Run model prediction
    ONNXEngine->>Model: Execute tensor inference (Fast)
    Model-->>ONNXEngine: Outputs Demand Score (0-100)
    ONNXEngine-->>NodeServer: Returns predicted score
    Note over NodeServer: Applies business rules multiplier
    NodeServer-->>Client: Returns checkout total + surge badge
```

---

## 📂 Directory Layout

```text
ml_service/
├── api/
│   ├── main.py                    # FastAPI Service Entrypoint (Placeholder)
│   └── routes.py                  # API endpoints and validators (Placeholder)
├── data/
│   ├── raw/
│   │   └── drivix_pricing_dataset.csv # Raw generated training data CSV (Headers only)
│   └── processed/                 # Folder for preprocessed train/test splits
├── models/                        # Folder to store compiled model artifacts (.pkl, .onnx)
├── notebooks/                     # Exploratory notebooks (blueprints)
│   ├── 01_data_audit.ipynb
│   ├── 02_eda.ipynb
│   ├── 03_feature_engineering.ipynb
│   └── 04_model_training.ipynb
├── src/
│   ├── data_preprocessing.py      # Cleans and splits raw data (Skeleton)
│   ├── feature_engineering.py     # Encodes categorical features (Skeleton)
│   ├── train.py                   # Model training and serialization script (Skeleton)
│   ├── evaluate.py                # Validation metrics evaluator (Skeleton)
│   └── predict.py                 # Single prediction caller script (Skeleton)
├── requirements.txt               # Required Python packages
└── README.md                      # Pipeline Documentation (This file)
```

---

## 📈 Feature Blueprint Schema

For training, variables are defined and mapped as follows:

| Feature Name | Type | Value Range | Description |
| :--- | :--- | :--- | :--- |
| `base_price` | `Float` | `40.0 - 100.0` | Standard base rate of the selected location. |
| `total_slots` | `Integer` | `50 - 200` | Full capacity of the selected location. |
| `available_slots` | `Integer` | `0 - 200` | Currently free slot count. |
| `occupancy_rate` | `Float` | `0.0 - 1.0` | Derived by: `(total_slots - available_slots) / total_slots`. |
| `hour` | `Integer` | `0 - 23` | Hour of day (Peak hours: 9-12 and 17-20). |
| `day_of_week` | `Integer` | `0 - 6` | Day of week (0 = Sunday, 6 = Saturday). |
| `weather_code` | `Integer` | `0 - 2` | Encoded categories: `{'clear': 0, 'rainy': 1, 'stormy': 2}`. |
| `is_holiday` | `Binary` | `0` or `1` | Public holiday indicator. |
| `nearby_event` | `Binary` | `0` or `1` | Concerts, sports, or local events indicator. |
| **`demand_score` (Target)** | `Integer` | `0 - 100` | Target prediction value, used to assign the multiplier. |

---

## 🚀 Starting the FastAPI Microservice

To run the ML inference server locally:

```bash
# Using uvicorn
uvicorn main:app --app-dir ml_service/api --host 0.0.0.0 --port 8000 --reload

# Or directly with Python
python ml_service/api/main.py
```

### 📡 API Endpoints

- **`GET /health`** - Microservice health status, database connection, and model load confirmation.
- **`GET /docs`** - Interactive Swagger UI documentation.
- **`POST /api/v1/predict`** - Real-time occupancy prediction and dynamic price recommendation for a single booking quote, combining champion XGBoost with online residual adaptations.
- **`POST /api/v1/predict/batch`** - Concurrent predictions for multi-lot or multi-floor batches.
- **`GET /api/v1/online-learning/status`** - Telemetry on online learner: MongoDB connectivity, total database bookings, online samples trained, running MAE, weights norm, and blend parameters.
- **`POST /api/v1/online-learning/sync-db`** - Incrementally syncs new operational bookings from MongoDB Atlas and updates model parameters using Stochastic Gradient Descent (`partial_fit`).
- **`POST /api/v1/online-learning/learn-event`** - Ingests single streaming booking or checkout event from Node.js backend for instant sub-second online learning.
- **`POST /api/v1/online-learning/configure`** - Dynamically tunes blend weight ($\lambda$) or enables/disables online residual learning.
- **`POST /api/v1/online-learning/reset`** - Resets online model weights and watermarks.

---

## ⚡ Online Streaming Learning Subsystem (MongoDB Connected)

Drivix incorporates an **Online Continuous Learning Engine** (`online_learner.py`) connected directly to the operational MongoDB database (`bookings` & `parkinglocations` collections):

```mermaid
sequenceDiagram
    participant DB as MongoDB Atlas (Bookings Collection)
    participant Sync as DB Sync Worker / Event Hook
    participant Online as Online SGD Learner (partial_fit)
    participant Champ as Champion XGBoost Pipeline
    participant API as FastAPI Inference Engine (/predict)

    Note over DB,Sync: New customer booking created or checked out
    DB->>Sync: Fetch new bookings since last watermark
    Sync->>Champ: Predict base occupancy (y_base)
    Sync->>Online: Calculate residual: r = y_actual - y_base
    Online->>Online: SGD partial_fit(X_trans, r) -> online_learner.joblib
    Note over Online,API: Real-time Hybrid Inference
    API->>Champ: y_base = XGBoost(X)
    API->>Online: r_hat = OnlineSGD(X)
    API->>API: y_hybrid = clip(y_base + lambda * r_hat, 0.0, 1.0)
    API-->>Client: Dynamic Price Quote + Surge Alert + Telemetry
```

### 🛠️ Running the Database Sync Worker Manually:

```bash
# Ingest up to 100 new bookings since last watermark checkpoint
python ml_service/src/db_sync_worker.py --limit 100

# Force full resynchronization of all database bookings
python ml_service/src/db_sync_worker.py --force

# Reset weights and synchronize afresh
python ml_service/src/db_sync_worker.py --reset --force
```

### 🔗 Node.js Backend Integration

In `WebApp/backend/.env`:
```env
ML_SERVICE_URL=http://localhost:8000
MONGO_URI=mongodb+srv://.../drivix
```

The Node.js backend (`WebApp/backend/controllers/bookingController.js` via `WebApp/backend/utils/pricingEngine.js`):
1. Queries `/api/v1/predict` before confirming a booking quote.
2. Automatically triggers `notifyMlOnlineLearner()` on booking creation and checkout completion to push real-time streaming updates into `/api/v1/online-learning/learn-event` in a non-blocking fire-and-forget pattern.

