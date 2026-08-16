import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  vacateBooking,
  calculateBill,
  extendBooking,
  deleteBookingAdmin,
  deleteAllBookingsAdmin,
  assignSlot,
  confirmArrival,
  getSlotRecommendations
} from '../controllers/bookingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all booking routes with JWT Auth
router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/all', getAllBookings);
router.get('/:id/calculate-bill', calculateBill);
router.put('/:id/vacate', vacateBooking);
router.put('/:id/extend', extendBooking);
router.post('/extend', extendBooking); // direct post format support

// Slot assignment and arrival confirmation endpoints
router.post('/assign-slot', assignSlot);
router.post('/:id/assign-slot', assignSlot);
router.post('/arrival-confirmation', confirmArrival);
router.post('/:id/arrival-confirmation', confirmArrival);
router.get('/:bookingId/slot-recommendations', getSlotRecommendations);

// Admin-only management endpoints
router.delete('/admin/all', adminOnly, deleteAllBookingsAdmin);
router.delete('/admin/:id', adminOnly, deleteBookingAdmin);

export default router;
