import { Router } from 'express';
import { AgentsController } from '../controllers/agents.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createAgentSchema, updateAgentSchema, OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', AgentsController.list);
router.post('/', requireRole(OrgRole.MEMBER), validate(createAgentSchema), AgentsController.create);
router.get('/:agentId', AgentsController.getById);
router.patch('/:agentId', requireRole(OrgRole.MEMBER), validate(updateAgentSchema), AgentsController.update);
router.post('/:agentId/duplicate', requireRole(OrgRole.MEMBER), AgentsController.duplicate);
router.post('/:agentId/toggle-status', requireRole(OrgRole.MEMBER), AgentsController.toggleStatus);
router.delete('/:agentId', requireRole(OrgRole.ADMIN), AgentsController.delete);

export default router;
