import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure src path is discoverable
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from predict import get_inference_engine
from online_learner import get_online_learner
from db_connector import DrivixDatabaseConnector
from routes import router as pricing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    print("[Drivix ML Service] Initializing inference engine...")
    try:
        engine = get_inference_engine()
        if engine.pipeline is not None:
            print("[Drivix ML Service] Successfully loaded Champion XGBoost pipeline into memory.")
        else:
            print("[Drivix ML Service] Warning: Pipeline is None. Check model artifacts.")
    except Exception as e:
        print(f"[Drivix ML Service] Startup error loading model: {e}")

    # Initialize Online Adaptive Learner
    try:
        learner = get_online_learner()
        status = learner.get_status()
        print(f"[Drivix ML Service] Online Adaptive Learner initialized (trained samples: {status['total_samples_trained']}).")
    except Exception as e:
        print(f"[Drivix ML Service] Error initializing online learner: {e}")

    # Check MongoDB Connectivity
    try:
        connector = DrivixDatabaseConnector()
        if connector.is_connected():
            cnt = connector.get_total_bookings_count()
            print(f"[Drivix ML Service] MongoDB connection verified (live bookings: {cnt}).")
        else:
            print("[Drivix ML Service] Notice: MongoDB currently offline or unreachable. Online learner operating in local mode.")
    except Exception as e:
        print(f"[Drivix ML Service] DB check notice: {e}")

    yield

    # Shutdown sequence
    print("[Drivix ML Service] Shutting down. Persisting online learner state...")
    try:
        learner = get_online_learner()
        learner.save_state()
    except Exception:
        pass


app = FastAPI(
    title="Drivix Dynamic Parking Pricing ML Service",
    description="Production-grade AI inference microservice for predicting parking demand occupancy and dynamic pricing multipliers with real-time online streaming learning connected to MongoDB.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for cross-origin requests from Drivix WebApp, Mobile, and Node Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["General"])
def read_root():
    learner = get_online_learner()
    connector = DrivixDatabaseConnector()
    return {
        "service": "Drivix Dynamic Parking Pricing ML Microservice",
        "status": "operational",
        "version": "2.0.0",
        "model": "Hybrid XGBoost + Online Adaptive SGD Residual Learner",
        "online_learning": {
            "enabled": True,
            "trained_samples": learner.total_samples_trained,
            "database_connected": connector.is_connected()
        },
        "endpoints": {
            "health": "/health",
            "predict": "/api/v1/predict",
            "batch_predict": "/api/v1/predict/batch",
            "online_status": "/api/v1/online-learning/status",
            "online_sync_db": "/api/v1/online-learning/sync-db",
            "online_learn_event": "/api/v1/online-learning/learn-event",
            "documentation": "/docs"
        }
    }

@app.get("/health", tags=["Health"])
def health_check():
    engine = get_inference_engine()
    learner = get_online_learner()
    connector = DrivixDatabaseConnector()
    model_loaded = engine.pipeline is not None
    db_connected = connector.is_connected()

    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "online_learner_active": learner.is_initialized or learner.total_samples_trained >= 0,
        "database_connected": db_connected,
        "framework": "scikit-learn + xgboost + pymongo streaming",
        "service_port": 8000
    }

# Mount pricing routes
app.include_router(pricing_router, prefix="/api/v1", tags=["Pricing & Demand"])
app.include_router(pricing_router, tags=["Pricing & Demand"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
