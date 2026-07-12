import express from 'express';
import {
  createLocation,
  getLocations,
  deleteLocation,
  updateLocation,
  getSlots,
  bulkAddSlots,
  deleteSlot,
  toggleSlot,
  reserveSlot,
  releaseSlot,
  getPricingRecommendation
} from '../controllers/parkingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getLocations)
  .post(protect, createLocation);

router.route('/:id')
  .delete(protect, deleteLocation)
  .put(protect, updateLocation);

router.route('/:facilityId/slots')
  .get(getSlots);

router.route('/:facilityId/slots/bulk')
  .post(protect, bulkAddSlots);

router.route('/:facilityId/slots/:slotId')
  .delete(protect, deleteSlot);

router.route('/:facilityId/slots/:slotId/toggle')
  .put(protect, toggleSlot);

router.route('/:facilityId/slots/:slotId/reserve')
  .post(protect, reserveSlot);

router.route('/:facilityId/slots/:slotId/release')
  .post(protect, releaseSlot);

router.route('/:facilityId/pricing')
  .get(getPricingRecommendation);

export default router;
