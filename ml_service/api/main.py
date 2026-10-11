import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure src path is discoverable
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from predict import get_inference_engine
from routes import router as pricing_router

app = FastAPI(
    title="Drivix Dynamic Parking Pricing ML Service",
    description="Production-grade AI inference microservice for predicting parking demand occupancy and dynamic pricing multipliers.",
    version="1.0.0"
)

# Enable CORS for cross-origin requests from Drivix WebApp, Mobile, and Node Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-load the ML model at application startup
@app.on_event("startup")
def startup_event():
    print("[Drivix ML Service] Initializing inference engine...")
    try:
        engine = get_inference_engine()
        if engine.pipeline is not None:
            print("[Drivix ML Service] Successfully loaded XGBoost pipeline into memory.")
        else:
            print("[Drivix ML Service] Warning: Pipeline is None. Check model artifacts.")
    except Exception as e:
        print(f"[Drivix ML Service] Startup error loading model: {e}")

@app.get("/", tags=["General"])
def read_root():
    return {
        "service": "Drivix Dynamic Parking Pricing ML Microservice",
        "status": "operational",
        "version": "1.0.0",
        "model": "XGBoost Regressor (MAE: 0.0816, R2: 0.7825)",
        "endpoints": {
            "health": "/health",
            "predict": "/api/v1/predict",
            "batch_predict": "/api/v1/predict/batch",
            "documentation": "/docs"
        }
    }

@app.get("/health", tags=["Health"])
def health_check():
    engine = get_inference_engine()
    model_loaded = engine.pipeline is not None
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "framework": "scikit-learn + xgboost",
        "service_port": 8000
    }

# Mount pricing routes
app.include_router(pricing_router, prefix="/api/v1", tags=["Pricing & Demand"])
app.include_router(pricing_router, tags=["Pricing & Demand"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
