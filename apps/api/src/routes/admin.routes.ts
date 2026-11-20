import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth';
import { requirePlatformAdmin } from '../middlewares/admin';

const router = Router();

router.use(authenticate, requirePlatformAdmin);

router.get('/overview', AdminController.getSystemOverview);
router.get('/users', AdminController.listUsers);
router.patch('/users/:userId/toggle-status', AdminController.toggleUserStatus);
router.get('/organizations', AdminController.listOrganizations);
router.get('/audit-logs', AdminController.listAuditLogs);

export default router;
