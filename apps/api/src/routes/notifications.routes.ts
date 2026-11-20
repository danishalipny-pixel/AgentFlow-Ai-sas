import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', NotificationsController.list);
router.patch('/:notificationId/read', NotificationsController.markAsRead);
router.post('/mark-all-read', NotificationsController.markAllAsRead);

export default router;
