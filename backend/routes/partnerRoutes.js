import express from 'express';
import {
  createPartnerApplication,
  getAllPartnerApplications,
  getPartnerStats
} from '../controllers/partnerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for form submission
router.post('/register', createPartnerApplication);

// Public route for landing page stats
router.get('/stats', getPartnerStats);

// Protected admin route for viewing applications
router.get('/all', protect, getAllPartnerApplications);

export default router;
