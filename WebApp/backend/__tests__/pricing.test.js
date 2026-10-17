import { calculateDynamicPriceSync, calculateDynamicPrice } from '../utils/pricingEngine.js';

describe('Drivix Dynamic Pricing Engine Unit & Fallback Tests', () => {

  describe('calculateDynamicPriceSync (Deterministic Fallback)', () => {
    it('should compute standard price for normal occupancy', () => {
      const res = calculateDynamicPriceSync({
        basePrice: 60,
        totalSlots: 100,
        availableSlots: 60,
        hour: 14,
        dayOfWeek: 2,
        weather: 'clear',
        isHoliday: false,
        nearbyEvent: false
      });

      expect(res).toBeDefined();
      expect(res.currentOccupancy).toBe(40);
      expect(res.basePrice).toBe(60);
      expect(res.recommendedPrice).toBeGreaterThan(0);
      expect(res.mlPowered).toBe(false);
      expect(res.modelVersion).toBe('heuristic-rule-engine-v1');
    });

    it('should calculate off-peak discount when occupancy is low', () => {
      const res = calculateDynamicPriceSync({
        basePrice: 60,
        totalSlots: 100,
        availableSlots: 90, // 10% occupied
        hour: 3, // 3 AM off-peak
        dayOfWeek: 2
      });

      expect(res.currentOccupancy).toBe(10);
      expect(res.multiplier).toBe(0.97); // 3% discount
      expect(res.recommendedPrice).toBe(58.2);
    });

    it('should calculate fair surge multiplier (max 5%) when lot is nearly full', () => {
      const res = calculateDynamicPriceSync({
        basePrice: 60,
        totalSlots: 100,
        availableSlots: 10 // 90% occupied
      });

      expect(res.currentOccupancy).toBe(90);
      expect(res.multiplier).toBeGreaterThanOrEqual(1.03);
      expect(res.multiplier).toBeLessThanOrEqual(1.05);
      expect(res.recommendedPrice).toBeGreaterThan(60);
      expect(res.isSurgeActive).toBe(true);
    });
  });

  describe('calculateDynamicPrice (Hybrid ML Integration)', () => {
    it('should query live ML microservice or fall back cleanly without error', async () => {
      const res = await calculateDynamicPrice({
        locationName: 'Vanice Mall',
        basePrice: 60,
        totalSlots: 100,
        availableSlots: 15,
        durationHours: 2
      });

      expect(res).toBeDefined();
      expect(res.recommendedPrice).toBeGreaterThan(0);
      expect(res.basePrice).toBe(60);
      expect(typeof res.multiplier).toBe('number');
      // If ML service is running, it returns mlPowered = true
      if (res.mlPowered) {
        expect(res.modelVersion).toBe('xgboost-v1.0');
      }
    });

    it('should recover gracefully without throwing when ML service is offline', async () => {
      const originalUrl = process.env.ML_SERVICE_URL;
      process.env.ML_SERVICE_URL = 'http://127.0.0.1:9999'; // Non-existent port

      try {
        const res = await calculateDynamicPrice({
          locationName: 'Test Fallback Hub',
          basePrice: 50,
          totalSlots: 100,
          availableSlots: 80
        });

        expect(res).toBeDefined();
        expect(res.mlPowered).toBe(false);
        expect(res.modelVersion).toBe('heuristic-rule-engine-v1');
        expect(res.basePrice).toBe(50);
      } finally {
        process.env.ML_SERVICE_URL = originalUrl;
      }
    });
  });
});
