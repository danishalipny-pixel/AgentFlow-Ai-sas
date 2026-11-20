import { Router } from 'express';
import { OrganizationsController } from '../controllers/organizations.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createOrganizationSchema, updateOrganizationSettingsSchema, OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate);

router.get('/', OrganizationsController.list);
router.post('/', validate(createOrganizationSchema), OrganizationsController.create);
router.post('/:organizationId/switch', OrganizationsController.switchDefault);

// Tenant-scoped routes
router.get('/current', requireTenant, OrganizationsController.getById);
router.patch('/current/settings', requireTenant, requireRole(OrgRole.ADMIN), validate(updateOrganizationSettingsSchema), OrganizationsController.updateSettings);

export default router;
