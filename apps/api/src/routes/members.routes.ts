import { Router } from 'express';
import { MembersController } from '../controllers/members.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { inviteMemberSchema, OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', MembersController.list);
router.post('/invite', requireRole(OrgRole.ADMIN), validate(inviteMemberSchema), MembersController.invite);
router.patch('/:memberId/role', requireRole(OrgRole.ADMIN), MembersController.updateRole);
router.delete('/:memberId', requireRole(OrgRole.ADMIN), MembersController.remove);

export default router;
