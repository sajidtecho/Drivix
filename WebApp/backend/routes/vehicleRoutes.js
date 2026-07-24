import express from 'express';
import { addVehicle, getUserVehicles, deleteVehicle, setPrimaryVehicle } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard all vehicle endpoints with JWT auth
router.use(protect);

router.route('/')
  .post(addVehicle)
  .get(getUserVehicles);

router.route('/:id')
  .delete(deleteVehicle);

router.route('/:id/primary')
  .put(setPrimaryVehicle);

export default router;
