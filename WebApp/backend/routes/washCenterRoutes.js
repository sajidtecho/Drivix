import express from 'express';
import CarWashCenter from '../models/CarWashCenter.js';

const router = express.Router();

/**
 * @route   GET /api/v1/wash-centers
 * @desc    Get all car wash centers with vehicle type filter (car, bike, bus_truck) & search
 */
router.get('/', async (req, res) => {
  try {
    const { vehicleType, city, search } = req.query;
    const query = { isActive: true };

    if (vehicleType && vehicleType !== 'all') {
      query.supportedVehicles = vehicleType;
    }

    if (city && city !== 'all') {
      query.city = city;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { locality: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const centers = await CarWashCenter.find(query).sort({ rating: -1 });
    res.status(200).json({
      success: true,
      count: centers.length,
      data: centers,
    });
  } catch (error) {
    console.error('[CarWashCenterController] Error fetching centers:', error);
    res.status(500).json({ success: false, message: 'Server error fetching wash centers' });
  }
});

export default router;
