import express from 'express';
import {
  createPartnerApplication,
  getAllPartnerApplications
} from '../controllers/partnerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for form submission
router.post('/register', createPartnerApplication);

// Protected admin route for viewing applications
router.get('/all', protect, getAllPartnerApplications);

export default router;
