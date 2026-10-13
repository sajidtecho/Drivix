/**
 * Drivix Hybrid AI Dynamic Pricing Engine
 * 
 * 1. ML Microservice Integration: Queries the production XGBoost model
 *    running on FastAPI (http://localhost:8000) for real-time demand scoring
 *    and bounded surge/discount multiplier calculation.
 * 2. Deterministic Rule-Based Fallback: If the ML service is offline or unreachable,
 *    gracefully falls back to heuristic occupancy & peak-hour curves with zero downtime.
 */

/**
 * Synchronous rule-based pricing fallback
 */
export const calculateDynamicPriceSync = ({
  basePrice,
  totalSlots,
  availableSlots,
  weather = 'clear',
  isHoliday = false,
  nearbyEvent = false
}) => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // 1. Calculate current occupancy rate
  const occupiedSlots = totalSlots - availableSlots;
  const currentOccupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) : 0;

  // 2. Heuristic demand estimation
  let demandScore = currentOccupancyRate * 60;

  // Capacity pressure factor (high occupancy directly activates surge)
  if (currentOccupancyRate >= 0.85) {
    demandScore += 25;
  } else if (currentOccupancyRate >= 0.70) {
    demandScore += 15;
  }

  if ((hour >= 9 && hour <= 12) || (hour >= 17 && hour <= 20)) {
    demandScore += 20; // Peak hour surge
  } else if (hour >= 0 && hour <= 6) {
    demandScore -= 15; // Late night off-peak
  }

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    demandScore += 10;
  }

  if (isHoliday) {
    demandScore += 15;
  }

  if (nearbyEvent) {
    demandScore += 20;
  }

  if (weather === 'rainy') {
    demandScore += 8;
  } else if (weather === 'stormy') {
    demandScore += 12;
  }

  demandScore = Math.max(0, Math.min(100, Math.round(demandScore)));

  const predictedOccupancy = Math.max(
    Math.round(currentOccupancyRate * 100),
    Math.round(demandScore * 0.95)
  );

  let multiplier = 1.0;
  let pricingAlert = 'Normal Rate';
  let discountSuggestion = '';
  let peakHourAlert = false;

  if (demandScore >= 85) {
    multiplier = 1.50;
    pricingAlert = '🔥 Surge Pricing Active (Critical Demand)';
    peakHourAlert = true;
  } else if (demandScore >= 70) {
    multiplier = 1.25;
    pricingAlert = '📈 Surge Pricing Active (High Demand)';
    peakHourAlert = true;
  } else if (demandScore < 30) {
    multiplier = 0.85; // 15% discount
    pricingAlert = '🎉 Off-Peak Discount Active';
    discountSuggestion = 'Save 15% by booking during this low-demand period!';
  }

  const recommendedPrice = Math.round(basePrice * multiplier);

  return {
    currentOccupancy: Math.round(currentOccupancyRate * 100),
    predictedOccupancy,
    demandScore,
    basePrice,
    recommendedPrice,
    multiplier,
    pricingAlert,
    discountSuggestion,
    peakHourAlert,
    isSurgeActive: peakHourAlert,
    mlPowered: false,
    modelVersion: 'heuristic-rule-engine-v1'
  };
};

/**
 * Predict demand score and recommended dynamic price
 * Queries the ML Microservice first; falls back to synchronous rules if unreachable.
 */
export const calculateDynamicPrice = async ({
  locationName = 'Main Parking',
  basePrice,
  totalSlots,
  availableSlots,
  durationHours = 2,
  weather = 'clear',
  isHoliday = false,
  nearbyEvent = false
}) => {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

  try {
    const payload = {
      location_name: locationName,
      total_capacity: Number(totalSlots) || 100,
      available_slots: Number(availableSlots) >= 0 ? Number(availableSlots) : 50,
      duration_hours: Number(durationHours) || 2,
      base_hourly_rate: Number(basePrice) || 60
    };

    const response = await fetch(`${mlServiceUrl}/api/v1/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1500)
    });

    if (response.ok) {
      const data = await response.json();
      const occupied = Math.max(0, (Number(totalSlots) || 100) - (Number(availableSlots) || 0));
      const currentOcc = Number(totalSlots) > 0 ? Math.round((occupied / Number(totalSlots)) * 100) : 0;

      return {
        currentOccupancy: currentOcc,
        predictedOccupancy: Math.round(data.predicted_occupancy_rate * 100),
        demandScore: Math.round(data.demand_score_percent),
        basePrice: data.base_hourly_rate,
        recommendedPrice: data.recommended_hourly_price,
        multiplier: data.pricing_multiplier,
        pricingAlert: data.alert_label,
        discountSuggestion: data.pricing_multiplier < 1.0 ? '🎉 Save 15% by booking during this low-demand period!' : '',
        peakHourAlert: data.is_surge_active,
        isSurgeActive: data.is_surge_active,
        mlPowered: true,
        modelVersion: data.model_version
      };
    }
  } catch (err) {
    // Expected during offline ML service / network latency - silently fall back
  }

  // Graceful heuristic fallback
  return calculateDynamicPriceSync({
    basePrice,
    totalSlots,
    availableSlots,
    weather,
    isHoliday,
    nearbyEvent
  });
};

/**
 * Streams real-time booking and checkout events to the ML Online Learning subsystem
 * for instant incremental SGD weight updates (fire-and-forget, non-blocking).
 */
export const notifyMlOnlineLearner = (eventData) => {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
  try {
    const payload = {
      booking_id: eventData.bookingId,
      location_name: eventData.locationName || 'Connaught Place',
      total_capacity: Number(eventData.totalCapacity) || 100,
      available_slots: Number(eventData.availableSlots) >= 0 ? Number(eventData.availableSlots) : 50,
      duration_hours: Number(eventData.durationHours) || 2,
      base_hourly_rate: Number(eventData.baseHourlyRate) || 60,
      total_cost: Number(eventData.totalCost) || 0
    };

    fetch(`${mlServiceUrl}/api/v1/online-learning/learn-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1200)
    }).catch(() => {
      // Suppress network errors in fire-and-forget mode
    });
  } catch (_) {
    // Non-fatal
  }
};

