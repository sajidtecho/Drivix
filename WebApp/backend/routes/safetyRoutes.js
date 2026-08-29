import express from 'express';
import { logSafetyAlert, getSafetyLogs } from '../controllers/safetyController.js';

const router = express.Router();

router.post('/alert', logSafetyAlert);
router.get('/logs', getSafetyLogs);

export default router;
