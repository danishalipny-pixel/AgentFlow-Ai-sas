import { Router } from 'express';
import { ToolsController } from '../controllers/tools.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { validate } from '../middlewares/validate';
import { runToolRequestSchema } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ToolsController.list);
router.post('/test-run', validate(runToolRequestSchema), ToolsController.testRun);

export default router;
