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
  releaseSlot
} from '../controllers/parkingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all parking & slot routes with JWT auth
router.use(protect);

router.route('/')
  .get(getLocations)
  .post(createLocation);

router.route('/:id')
  .delete(deleteLocation)
  .put(updateLocation);

router.route('/:facilityId/slots')
  .get(getSlots);

router.route('/:facilityId/slots/bulk')
  .post(bulkAddSlots);

router.route('/:facilityId/slots/:slotId')
  .delete(deleteSlot);

router.route('/:facilityId/slots/:slotId/toggle')
  .put(toggleSlot);

router.route('/:facilityId/slots/:slotId/reserve')
  .post(reserveSlot);

router.route('/:facilityId/slots/:slotId/release')
  .post(releaseSlot);

export default router;
