import express from 'express';
import { registerUser, loginUser, getUserProfile, authGoogle, authPhone, updateUserProfile, getAllUsers } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', authGoogle);
router.post('/phone', authPhone);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/users', protect, adminOnly, getAllUsers);

export default router;
