import { Router } from 'express';
import { AgentTemplatesController } from '../controllers/agentTemplates.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';

const router = Router();

router.use(authenticate, requireTenant);
router.get('/', AgentTemplatesController.list);
router.post('/instantiate', AgentTemplatesController.instantiate);

export default router;
