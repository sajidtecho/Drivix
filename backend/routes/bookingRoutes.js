import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  vacateBooking,
  extendBooking
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all booking routes with JWT Auth
router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/all', getAllBookings);
router.put('/:id/vacate', vacateBooking);
router.put('/:id/extend', extendBooking);

export default router;
