import os
import sys
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

# Add src to sys.path so model loading and inference work cleanly
SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from predict import get_inference_engine, FEATURE_COLUMNS_RAW

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

    class Config:
        json_schema_extra = {
            "example": {
                "location_name": "Connaught Place",
                "total_capacity": 120,
                "available_slots": 15,
                "entry_hour": 18,
                "entry_dow": 4,
                "duration_hours": 3.0,
                "lead_time_minutes": 20.0,
                "base_hourly_rate": 60.0,
                "requests_last_60min": 18.0
            }
        }

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

# -------------------------------------------------------------
# Helper: Feature Mapper
# -------------------------------------------------------------
def map_request_to_features(req: PricingQuoteRequest) -> dict:
    # Resolve current occupancy
    if req.current_occupancy is not None:
        occ = req.current_occupancy
    elif req.available_slots is not None and req.total_capacity > 0:
        occupied = max(0, req.total_capacity - req.available_slots)
        occ = occupied / float(req.total_capacity)
    else:
        occ = 0.50

    # Resolve date/time
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
# Endpoints
# -------------------------------------------------------------
@router.post("/predict", response_model=PricingQuoteResponse, summary="Get dynamic price quote for parking")
def predict_price_quote(request: PricingQuoteRequest):
    """
    Returns AI-driven occupancy prediction and bounded surge/discount pricing
    recommendations for a parking reservation request.
    """
    try:
        engine = get_inference_engine()
        features = map_request_to_features(request)
        quote = engine.predict_single(features, base_hourly_rate=request.base_hourly_rate)

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
def predict_price_batch(batch_req: BatchPricingRequest):
    """
    Returns predictions for multiple parking location quotes concurrently.
    """
    try:
        engine = get_inference_engine()
        results = []
        for req in batch_req.quotes:
            features = map_request_to_features(req)
            quote = engine.predict_single(features, base_hourly_rate=req.base_hourly_rate)
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
