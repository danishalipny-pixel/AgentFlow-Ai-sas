import { Router } from 'express';
import { ExecutionsController } from '../controllers/executions.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ExecutionsController.list);
router.get('/:executionId', ExecutionsController.getById);

export default router;
