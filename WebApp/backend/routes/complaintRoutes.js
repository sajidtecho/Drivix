import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  resolveComplaint
} from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all routes with JWT Auth
router.use(protect);

router.route('/')
  .post(createComplaint);

router.get('/my', getMyComplaints);
router.get('/all', getAllComplaints);
router.put('/:id/resolve', resolveComplaint);

export default router;
