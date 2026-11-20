import { Router } from 'express';
import { IntegrationsController } from '../controllers/integrations.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', IntegrationsController.list);
router.post('/:provider/configure', requireRole(OrgRole.ADMIN), IntegrationsController.configure);
router.post('/:provider/test', requireRole(OrgRole.ADMIN), IntegrationsController.testConnection);
router.post('/:provider/disconnect', requireRole(OrgRole.ADMIN), IntegrationsController.disconnect);

export default router;
