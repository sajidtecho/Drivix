import express from 'express';
import { registerUser, loginUser, getUserProfile, authGoogle, authPhone, updateUserProfile, getAllUsers, updateUserPlan, getPublicStats, verifyEmailOtp, resendEmailOtp, sendPublicEmailOtp, verifyPublicEmailOtp } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', authGoogle);
router.post('/phone', authPhone);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-email-otp', resendEmailOtp);
router.post('/send-public-otp', sendPublicEmailOtp);
router.post('/verify-public-otp', verifyPublicEmailOtp);
router.get('/public-stats', getPublicStats);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/plan', protect, adminOnly, updateUserPlan);

export default router;
