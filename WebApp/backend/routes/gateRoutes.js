import express from 'express';
import { simulateEntry, simulateExit } from '../controllers/gateController.js';

const router = express.Router();

router.post('/simulate-entry', simulateEntry);
router.post('/simulate-exit', simulateExit);

export default router;
