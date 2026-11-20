import { Router } from 'express';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';
import { requireRole } from '../middlewares/rbac';
import { OrgRole } from '@agentflow/shared';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/', SubscriptionsController.getDetails);
router.post('/change-plan', requireRole(OrgRole.ADMIN), SubscriptionsController.changePlan);
router.post('/checkout', requireRole(OrgRole.ADMIN), SubscriptionsController.createCheckout);

export default router;
