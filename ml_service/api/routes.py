import os
import sys
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, BackgroundTasks

# Add src to sys.path so model loading and inference work cleanly
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from predict import get_inference_engine, forecast_lot_occupancy, FEATURE_COLUMNS_RAW
from inference_logger import log_inference_event
from drift_detector import generate_drift_report
from retrain_pipeline import DrivixRetrainingPipeline
from online_learner import get_online_learner
from db_connector import DrivixDatabaseConnector
from db_sync_worker import sync_online_learning_with_db

router = APIRouter()

# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class OccupancyForecastRequest(BaseModel):
    capacity: int = Field(default=100, ge=1, description="Total lot capacity")
    current_occupancy_rate: float = Field(default=0.5, ge=0.0, le=1.0, description="Latest known occupancy rate (0.0 to 1.0)")
    lag_2_occupancy_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Occupancy rate 60 mins ago")
    lag_3_occupancy_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Occupancy rate 90 mins ago")
    hour: Optional[int] = Field(default=None, ge=0, le=23, description="Target prediction hour (0-23)")
    minute: Optional[int] = Field(default=None, ge=0, le=59, description="Target minute (0-59)")
    day_of_week: Optional[int] = Field(default=None, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")
    is_weekend: Optional[int] = Field(default=None, ge=0, le=1, description="1 if weekend else 0")

class OccupancyForecastResponse(BaseModel):
    predicted_occupancy_rate: float
    predicted_occupancy_percent: float
    total_capacity: int
    predicted_occupied_slots: int
    predicted_available_slots: int
    model_version: str

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
    recommended_hourly_price: float
    duration_hours: float
    total_quoted_cost: float
    model_version: str
    online_learning_applied: Optional[bool] = False
    online_residual: Optional[float] = 0.0

class BatchPricingRequest(BaseModel):
    quotes: List[PricingQuoteRequest]

class BatchPricingResponse(BaseModel):
    count: int
    results: List[PricingQuoteResponse]

class RetrainRequest(BaseModel):
    force_promote: bool = Field(default=False, description="Promote challenger model even if margin is flat")

class OnlineSyncRequest(BaseModel):
    limit: int = Field(default=100, ge=1, le=1000, description="Max bookings to ingest in this sync")
    force_full_sync: bool = Field(default=False, description="Sync from the beginning, ignoring saved watermark")

class OnlineEventRequest(BaseModel):
    booking_id: Optional[str] = Field(default=None, description="Unique booking ID or reference")
    location_name: str = Field(default="Connaught Place", description="Parking location name")
    total_capacity: int = Field(default=100, ge=1, description="Total lot capacity")
    available_slots: Optional[int] = Field(default=None, ge=0, description="Available slots at time of event")
    duration_hours: float = Field(default=2.0, gt=0.0, le=72.0, description="Parking duration in hours")
    base_hourly_rate: float = Field(default=60.0, gt=0.0, description="Base hourly rate in INR")
    total_cost: Optional[float] = Field(default=None, description="Total booking fee paid/charged")
    realized_occupancy_rate: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Actual realized lot occupancy fraction if known")
    entry_hour: Optional[int] = Field(default=None, ge=0, le=23, description="Entry hour")
    entry_dow: Optional[int] = Field(default=None, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)")

class OnlineConfigRequest(BaseModel):
    blend_weight: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Weight of online residual [0.0 = pure offline XGBoost, 1.0 = heavy online]")
    enable_online_learning: Optional[bool] = Field(default=None, description="Toggle online learning in inference engine")
    max_residual_clamp: Optional[float] = Field(default=None, ge=0.05, le=0.50, description="Max allowed residual correction")

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
    recommendations for a parking reservation request, combining offline XGBoost
    with continuous online residual corrections.
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
            model_version="xgboost-online-v1.0",
            online_learning_applied=quote.get('online_learning_applied', False),
            online_residual=quote.get('online_residual', 0.0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@router.post("/forecast-occupancy", response_model=OccupancyForecastResponse, summary="Forecast parking occupancy using Stage 1 sensor model")
def forecast_occupancy(request: OccupancyForecastRequest):
    """
    Directly queries the Stage 1 HistGradientBoosting occupancy forecasting model
    (trained on 35,000+ real sensor readings) to project parking lot occupancy
    and available capacity 30-60 minutes ahead.
    """
    try:
        result = forecast_lot_occupancy(
            capacity=request.capacity,
            current_occupancy_rate=request.current_occupancy_rate,
            lag_2_occ=request.lag_2_occupancy_rate,
            lag_3_occ=request.lag_3_occupancy_rate,
            hour=request.hour,
            minute=request.minute,
            day_of_week=request.day_of_week,
            is_weekend=request.is_weekend
        )
        return OccupancyForecastResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Occupancy forecast error: {str(e)}")

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
                model_version="xgboost-online-v1.0",
                online_learning_applied=quote.get('online_learning_applied', False),
                online_residual=quote.get('online_residual', 0.0)
            ))
        return BatchPricingResponse(count=len(results), results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference error: {str(e)}")

# -------------------------------------------------------------
# Online Learning & Database Sync Endpoints
# -------------------------------------------------------------
@router.get("/online-learning/status", tags=["Online Learning System"])
def get_online_learning_status():
    """
    Returns real-time status of the Online Learning system, including
    MongoDB connection status, total bookings in database, samples trained online,
    running loss metrics, and active blend hyperparameters.
    """
    try:
        learner = get_online_learner()
        connector = DrivixDatabaseConnector()
        db_connected = connector.is_connected()
        total_db_bookings = connector.get_total_bookings_count() if db_connected else 0
        engine = get_inference_engine()

        return {
            "online_learning_enabled": engine.enable_online_learning,
            "database_connected": db_connected,
            "total_bookings_in_database": total_db_bookings,
            "learner_telemetry": learner.get_status(),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting online learning status: {str(e)}")

@router.post("/online-learning/sync-db", tags=["Online Learning System"])
def trigger_database_online_sync(req: OnlineSyncRequest = OnlineSyncRequest()):
    """
    Connects directly to the operational MongoDB database, extracts newly created
    or completed bookings since the last watermark, and updates the online adaptive
    model parameters incrementally via SGD partial_fit.
    """
    try:
        res = sync_online_learning_with_db(limit=req.limit, force_full_sync=req.force_full_sync)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database online sync error: {str(e)}")

@router.post("/online-learning/learn-event", tags=["Online Learning System"])
def ingest_streaming_event(event: OnlineEventRequest):
    """
    Allows the Node.js backend or external gateway to push an individual booking,
    check-in, or check-out event in real-time for immediate single-step online learning.
    """
    try:
        learner = get_online_learner()
        engine = get_inference_engine()

        # Calculate occupancy fraction
        if event.realized_occupancy_rate is not None:
            actual_occ = event.realized_occupancy_rate
        elif event.available_slots is not None and event.total_capacity > 0:
            actual_occ = max(0.0, min(1.0, (event.total_capacity - event.available_slots) / float(event.total_capacity)))
        else:
            actual_occ = 0.55

        now = datetime.now()
        hour = event.entry_hour if event.entry_hour is not None else now.hour
        dow = event.entry_dow if event.entry_dow is not None else now.weekday()

        features = {
            'f_location': event.location_name,
            'f_capacity': float(event.total_capacity),
            'f_entry_hour': int(hour),
            'f_entry_dow': int(dow),
            'f_is_weekend': 1 if dow in [5, 6] else 0,
            'f_lead_time_min': 15.0,
            'f_requested_duration_h': float(event.duration_hours),
            'f_occ_entry_at_quote': float(actual_occ),
            'f_busy_frac_window_at_quote': float(actual_occ),
            'f_requests_last_60min_location': 12.0,
            'f_occ_same_hour_last_week': float(actual_occ)
        }

        def champion_predict(X):
            if engine.pipeline is not None:
                return engine.pipeline.predict(X)
            return None

        update_res = learner.update_from_single_event(
            features_dict=features,
            actual_occupancy=actual_occ,
            champion_predict_fn=champion_predict
        )

        return {
            "success": True,
            "booking_id": event.booking_id,
            "learned_occupancy": actual_occ,
            "online_update": update_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ingesting online learning event: {str(e)}")

@router.post("/online-learning/configure", tags=["Online Learning System"])
def configure_online_learner(config: OnlineConfigRequest):
    """
    Adjusts online learning hyperparameters (blend weight, max residual clamp,
    or enables/disables online corrections in inference engine).
    """
    learner = get_online_learner()
    engine = get_inference_engine()

    if config.blend_weight is not None:
        learner.blend_weight = config.blend_weight
    if config.max_residual_clamp is not None:
        learner.max_residual_clamp = config.max_residual_clamp
    if config.enable_online_learning is not None:
        engine.enable_online_learning = config.enable_online_learning

    learner.save_state()

    return {
        "success": True,
        "blend_weight": learner.blend_weight,
        "max_residual_clamp": learner.max_residual_clamp,
        "enable_online_learning": engine.enable_online_learning
    }

@router.post("/online-learning/reset", tags=["Online Learning System"])
def reset_online_learner():
    """
    Resets the online adaptive learner weights and watermarks back to zero.
    """
    learner = get_online_learner()
    learner.reset()
    return {
        "success": True,
        "message": "Online learner weights and watermark successfully reset."
    }

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
