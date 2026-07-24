/**
 * Drivix Hybrid AI Dynamic Pricing Engine
 * 
 * 1. AI Demand Predictor: Simulates ML demand prediction (Random Forest/XGBoost) 
 *    based on occupancy, hour, weekend/weekday, holidays, events, and weather.
 * 2. Rule-Based Pricing Engine: Translates predicted demand scores into recommended
 *    prices, surge multipliers, peak alerts, and discount suggestions.
 */

/**
 * Predict demand score and recommended price
 * @param {Object} params
 * @param {number} params.basePrice - Standard hourly price of the location
 * @param {number} params.totalSlots - Total slot capacity
 * @param {number} params.availableSlots - Currently available slots
 * @param {string} params.weather - Weather condition ('clear', 'rainy', 'stormy')
 * @param {boolean} params.isHoliday - Is today a public holiday
 * @param {boolean} params.nearbyEvent - Is there a concert/sports event nearby
 * @returns {Object} Pricing recommendation details
 */
export const calculateDynamicPrice = ({
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

  // 2. AI Demand Estimation Logic (Simulating RandomForest/XGBoost regression output)
  // Base demand starts from current occupancy (0 to 50 points)
  let demandScore = currentOccupancyRate * 50;

  // Hour of the day factor (Peak Hours: 9 AM - 12 PM, 5 PM - 8 PM)
  if ((hour >= 9 && hour <= 12) || (hour >= 17 && hour <= 20)) {
    demandScore += 25; // Peak hour surge
  } else if (hour >= 0 && hour <= 6) {
    demandScore -= 15; // Late night off-peak
  }

  // Day of the week factor (Weekend demand increases by 10 points)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    demandScore += 10;
  }

  // Holiday factor (+15 points)
  if (isHoliday) {
    demandScore += 15;
  }

  // Nearby Event factor (+20 points)
  if (nearbyEvent) {
    demandScore += 20;
  }

  // Weather Factor (Rainy/Stormy weather drives indoor parking demand up)
  if (weather === 'rainy') {
    demandScore += 8;
  } else if (weather === 'stormy') {
    demandScore += 12;
  }

  // Normalize demand score between 0 and 100
  demandScore = Math.max(0, Math.min(100, Math.round(demandScore)));

  // Estimate future occupancy rate based on demand score
  const predictedOccupancy = Math.max(
    Math.round(currentOccupancyRate * 100),
    Math.round(demandScore * 0.95)
  );

  // 3. Rule-Based Pricing Engine (Translates Demand Score to Price Recommendations)
  let multiplier = 1.0;
  let pricingAlert = 'Normal Rate';
  let discountSuggestion = '';
  let peakHourAlert = false;

  if (demandScore >= 85) {
    // Critical Peak Demand
    multiplier = 1.50;
    pricingAlert = '🔥 Surge Pricing Active (Critical Demand)';
    peakHourAlert = true;
  } else if (demandScore >= 70) {
    // High Demand
    multiplier = 1.25;
    pricingAlert = '📈 Surge Pricing Active (High Demand)';
    peakHourAlert = true;
  } else if (demandScore < 30) {
    // Low Demand
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
    peakHourAlert
  };
};
