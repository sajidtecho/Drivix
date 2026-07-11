import express from 'express';
import { registerUser, loginUser, getUserProfile, authGoogle, authPhone, updateUserProfile, getAllUsers, updateUserPlan, getPublicStats } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', authGoogle);
router.post('/phone', authPhone);
router.get('/public-stats', getPublicStats);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/plan', protect, adminOnly, updateUserPlan);

export default router;
