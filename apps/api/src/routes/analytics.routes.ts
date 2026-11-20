import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth';
import { requireTenant } from '../middlewares/tenant';

const router = Router();

router.use(authenticate, requireTenant);

router.get('/overview', AnalyticsController.getOverview);

export default router;
