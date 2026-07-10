import express from 'express';
import { registerUser, loginUser, getUserProfile, authGoogle, authPhone, updateUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', authGoogle);
router.post('/phone', authPhone);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

export default router;
