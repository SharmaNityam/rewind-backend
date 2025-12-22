import { Router } from 'express';
import { HomePetsController } from '../controllers/homepets.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's pet
router.get('/user-pet', HomePetsController.getUserPet);

// Update pet
router.put('/user-pet', HomePetsController.updateUserPet);

export default router;

