import express from 'express';
import {
  getActiveBanners,
  getAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  trackImpression,
  trackClick
} from '../controllers/bannerController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getActiveBanners)
  .post(protect, adminOnly, createBanner);

router.get('/admin', protect, adminOnly, getAdminBanners);

router.route('/:id')
  .put(protect, adminOnly, updateBanner)
  .delete(protect, adminOnly, deleteBanner);

router.post('/:id/impression', trackImpression);
router.post('/:id/click', trackClick);

export default router;
