import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Notification } from '../models';

export class NotificationsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await Notification.find({ userId: req.user!._id })
        .sort({ createdAt: -1 })
        .limit(30);

      const unreadCount = await Notification.countDocuments({
        userId: req.user!._id,
        isRead: false,
      });

      res.json({
        success: true,
        data: {
          notifications: notifications.map((n) => n.toJSON()),
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await Notification.findOneAndUpdate(
        { _id: req.params.notificationId, userId: req.user!._id },
        { isRead: true }
      );
      res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  public static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}
