import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  vacateBooking,
  extendBooking,
  deleteBookingAdmin,
  deleteAllBookingsAdmin
} from '../controllers/bookingController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all booking routes with JWT Auth
router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/all', getAllBookings);
router.put('/:id/vacate', vacateBooking);
router.put('/:id/extend', extendBooking);

// Admin-only management endpoints
router.delete('/admin/all', adminOnly, deleteAllBookingsAdmin);
router.delete('/admin/:id', adminOnly, deleteBookingAdmin);

export default router;
