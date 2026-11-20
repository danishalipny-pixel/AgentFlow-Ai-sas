import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middlewares/auth';
import { User } from '../models';
import { AppError } from '../middlewares/errorHandler';

export class UsersController {
  public static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: req.user!.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, avatarUrl } = req.body;
      const user = req.user!;

      if (name) user.name = name;
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
      await user.save();

      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user!._id);
      if (!user) throw new AppError('User not found', 404);

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new AppError('Incorrect current password', 400, 'INCORRECT_PASSWORD');
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      next(error);
    }
  }
}
