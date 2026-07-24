import express from 'express';
import { 
  registerFASTag, 
  getMyFASTags, 
  rechargeFASTag, 
  getTransactions, 
  updateAutoRecharge, 
  estimateToll 
} from '../controllers/fastagController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all FASTag routes
router.use(protect);

router.route('/')
  .post(registerFASTag)
  .get(getMyFASTags);

router.route('/estimate')
  .post(estimateToll);

router.route('/:id/recharge')
  .post(rechargeFASTag);

router.route('/:id/transactions')
  .get(getTransactions);

router.route('/:id/auto-recharge')
  .put(updateAutoRecharge);

export default router;
