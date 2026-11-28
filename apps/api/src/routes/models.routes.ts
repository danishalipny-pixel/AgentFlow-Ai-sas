import { Router } from 'express';
import { ModelsController } from '../controllers/models.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Allow authenticated users to check local model runtime status and switch models
router.get('/status', ModelsController.getStatus);
router.post('/switch', authenticate, ModelsController.switchModel);

export default router;
