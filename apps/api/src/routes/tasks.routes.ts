import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createTaskSchema, OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', TasksController.list);
router.post('/', requireRole(OrgRole.MEMBER), validate(createTaskSchema), TasksController.create);
router.get('/:taskId', TasksController.getById);
router.post('/:taskId/retry', requireRole(OrgRole.MEMBER), TasksController.retry);
router.post('/:taskId/cancel', requireRole(OrgRole.MEMBER), TasksController.cancel);

export default router;
