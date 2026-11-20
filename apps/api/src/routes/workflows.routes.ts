import { Router } from 'express';
import { WorkflowsController } from '../controllers/workflows.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createWorkflowSchema, updateWorkflowSchema, OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', WorkflowsController.list);
router.post('/', requireRole(OrgRole.MEMBER), validate(createWorkflowSchema), WorkflowsController.create);
router.get('/:workflowId', WorkflowsController.getById);
router.patch('/:workflowId', requireRole(OrgRole.MEMBER), validate(updateWorkflowSchema), WorkflowsController.update);
router.post('/:workflowId/run', requireRole(OrgRole.MEMBER), WorkflowsController.run);
router.post('/:workflowId/duplicate', requireRole(OrgRole.MEMBER), WorkflowsController.duplicate);
router.delete('/:workflowId', requireRole(OrgRole.ADMIN), WorkflowsController.delete);

export default router;
