import os
import sys
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, BackgroundTasks

# Add src to sys.path so model loading and inference work cleanly
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from predict import get_inference_engine, FEATURE_COLUMNS_RAW
from inference_logger import log_inference_event
from drift_detector import generate_drift_report
from retrain_pipeline import DrivixRetrainingPipeline

router = APIRouter()

# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class PricingQuoteRequest(BaseModel):
    location_name: str = Field(default="Connaught Place", description="Parking location / facility name")
    total_capacity: int = Field(default=100, ge=1, description="Total parking capacity (slots)")
    available_slots: Optional[int] = Field(default=None, ge=0, description="Currently vacant slots")
    current_occupancy: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Current occupancy fraction [0.0 - 1.0]")
    entry_datetime: Optional[str] = Field(default=None, description="ISO format entry datetime, e.g. '2026-10-15T18:30:00'")
    entry_hour: Optional[int] = Field(default=None, ge=0, le=23, description="Entry hour (0-23)")
    entry_dow: Optional[int] = Field(default=None, ge=0, le=6, description="Day of week (0=Monday, 6=Sunday)")
    duration_hours: float = Field(default=2.0, gt=0.0, le=72.0, description="Requested parking duration in hours")
    lead_time_minutes: float = Field(default=15.0, ge=0.0, description="Minutes between quote creation and arrival")
    base_hourly_rate: float = Field(default=60.0, gt=0.0, description="Base standard hourly rate in INR")
    requests_last_60min: Optional[float] = Field(default=12.0, ge=0.0, description="Velocity of booking requests in last 60 minutes")
    busy_frac_window: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Lot busy fraction in recent moving window")
    occ_same_hour_last_week: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Lagged occupancy at same hour last week")

class PricingQuoteResponse(BaseModel):
    location_name: str
    predicted_occupancy_rate: float
    demand_score_percent: float
    pricing_multiplier: float
    alert_label: str
    is_surge_active: bool
    base_hourly_rate: float
    recommended_hourly_price: int
    duration_hours: float
    total_quoted_cost: int
    model_version: str

class BatchPricingRequest(BaseModel):
    quotes: List[PricingQuoteRequest]

class BatchPricingResponse(BaseModel):
    count: int
    results: List[PricingQuoteResponse]

class RetrainRequest(BaseModel):
    force_promote: bool = Field(default=False, description="Promote challenger model even if margin is flat")

# -------------------------------------------------------------
# Helper: Feature Mapper
# -------------------------------------------------------------
def map_request_to_features(req: PricingQuoteRequest) -> dict:
    if req.current_occupancy is not None:
        occ = req.current_occupancy
    elif req.available_slots is not None and req.total_capacity > 0:
        occupied = max(0, req.total_capacity - req.available_slots)
        occ = occupied / float(req.total_capacity)
    else:
        occ = 0.50

    now = datetime.now()
    if req.entry_datetime:
        try:
            dt = datetime.fromisoformat(req.entry_datetime.replace("Z", "+00:00"))
        except Exception:
            dt = now
    else:
        dt = now

    hour = req.entry_hour if req.entry_hour is not None else dt.hour
    dow = req.entry_dow if req.entry_dow is not None else dt.weekday()
    is_weekend = 1 if dow in [5, 6] else 0

    busy_frac = req.busy_frac_window if req.busy_frac_window is not None else occ
    occ_last_week = req.occ_same_hour_last_week if req.occ_same_hour_last_week is not None else occ
    req_60 = req.requests_last_60min if req.requests_last_60min is not None else 10.0

    return {
        'f_location': req.location_name,
        'f_capacity': float(req.total_capacity),
        'f_entry_hour': int(hour),
        'f_entry_dow': int(dow),
        'f_is_weekend': int(is_weekend),
        'f_lead_time_min': float(req.lead_time_minutes),
        'f_requested_duration_h': float(req.duration_hours),
        'f_occ_entry_at_quote': float(occ),
        'f_busy_frac_window_at_quote': float(busy_frac),
        'f_requests_last_60min_location': float(req_60),
        'f_occ_same_hour_last_week': float(occ_last_week)
    }

# -------------------------------------------------------------
# Inference Endpoints
# -------------------------------------------------------------
@router.post("/predict", response_model=PricingQuoteResponse, summary="Get dynamic price quote for parking")
def predict_price_quote(request: PricingQuoteRequest, background_tasks: BackgroundTasks):
    """
    Returns AI-driven occupancy prediction and bounded surge/discount pricing
    recommendations for a parking reservation request.
    """
    try:
        engine = get_inference_engine()
        features = map_request_to_features(request)
        quote = engine.predict_single(features, base_hourly_rate=request.base_hourly_rate)

        # Asynchronously log inference event for MLOps drift tracking
        background_tasks.add_task(log_inference_event, features, quote)

        return PricingQuoteResponse(
            location_name=request.location_name,
            predicted_occupancy_rate=quote['predicted_occupancy_rate'],
            demand_score_percent=quote['demand_score_percent'],
            pricing_multiplier=quote['pricing_multiplier'],
            alert_label=quote['alert_label'],
            is_surge_active=quote['is_surge_active'],
            base_hourly_rate=request.base_hourly_rate,
            recommended_hourly_price=quote['recommended_hourly_price'],
            duration_hours=request.duration_hours,
            total_quoted_cost=quote['total_quoted_cost'],
            model_version="xgboost-v1.0"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/predict/batch", response_model=BatchPricingResponse, summary="Batch price quote predictions")
def predict_price_batch(batch_req: BatchPricingRequest, background_tasks: BackgroundTasks):
    """
    Returns predictions for multiple parking location quotes concurrently.
    """
    try:
        engine = get_inference_engine()
        results = []
        for req in batch_req.quotes:
            features = map_request_to_features(req)
            quote = engine.predict_single(features, base_hourly_rate=req.base_hourly_rate)
            background_tasks.add_task(log_inference_event, features, quote)
            results.append(PricingQuoteResponse(
                location_name=req.location_name,
                predicted_occupancy_rate=quote['predicted_occupancy_rate'],
                demand_score_percent=quote['demand_score_percent'],
                pricing_multiplier=quote['pricing_multiplier'],
                alert_label=quote['alert_label'],
                is_surge_active=quote['is_surge_active'],
                base_hourly_rate=req.base_hourly_rate,
                recommended_hourly_price=quote['recommended_hourly_price'],
                duration_hours=req.duration_hours,
                total_quoted_cost=quote['total_quoted_cost'],
                model_version="xgboost-v1.0"
            ))
        return BatchPricingResponse(count=len(results), results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference error: {str(e)}")

# -------------------------------------------------------------
# MLOps Monitoring & Retraining Endpoints
# -------------------------------------------------------------
@router.get("/mlops/drift-report", tags=["MLOps Monitoring & Drift"])
def get_drift_report():
    """
    Executes real-time Kolmogorov-Smirnov and Population Stability Index (PSI)
    drift tests between baseline reference data and recent production logs.
    """
    try:
        report = generate_drift_report()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drift analysis error: {str(e)}")

@router.post("/mlops/retrain", tags=["MLOps Retraining & Registry"])
def trigger_retraining(req: RetrainRequest = RetrainRequest()):
    """
    Triggers automated model retraining, runs Champion-vs-Challenger validation gate,
    and conditionally promotes the new model to production.
    """
    try:
        pipeline = DrivixRetrainingPipeline()
        result = pipeline.run_retraining(force_promote=req.force_promote)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")

@router.get("/mlops/model-registry", tags=["MLOps Retraining & Registry"])
def get_model_registry():
    """
    Returns active champion model metadata, archived champion snapshots,
    and historical retraining audit trails.
    """
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    model_path = os.path.join(base_dir, "models", "drivix_price_model.pkl")
    archive_dir = os.path.join(base_dir, "models", "archive")
    history_file = os.path.join(base_dir, "reports", "retraining_history.json")

    archived_models = []
    if os.path.exists(archive_dir):
        archived_models = sorted(os.listdir(archive_dir), reverse=True)

    history = []
    if os.path.exists(history_file):
        try:
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []

    last_modified = None
    if os.path.exists(model_path):
        last_modified = datetime.fromtimestamp(os.path.getmtime(model_path)).isoformat()

    return {
        "active_model": {
            "name": "drivix_price_model.pkl",
            "framework": "XGBoost Regressor Pipeline",
            "last_modified": last_modified,
            "status": "CHAMPION_ACTIVE"
        },
        "archived_snapshots_count": len(archived_models),
        "archived_snapshots": archived_models[:10],
        "retraining_history_count": len(history),
        "recent_retraining_runs": history[-5:]
    }
