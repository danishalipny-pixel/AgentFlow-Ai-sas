import { Router } from 'express';
import { ApprovalsController } from '../controllers/approvals.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { approvalDecisionSchema, OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', ApprovalsController.list);
router.get('/:approvalId', ApprovalsController.getById);
router.post(
  '/:approvalId/resolve',
  requireRole(OrgRole.MANAGER),
  validate(approvalDecisionSchema),
  ApprovalsController.resolve
);

export default router;
