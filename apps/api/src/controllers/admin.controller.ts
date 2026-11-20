import { Response, NextFunction } from 'express';
import os from 'os';
import { AuthenticatedRequest } from '../middlewares/auth';
import { User, Organization, Task, Execution, AuditLog, Integration } from '../models';

export class AdminController {
  public static async getSystemOverview(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        totalOrgs,
        totalTasks,
        runningExecutions,
        auditLogsCount,
      ] = await Promise.all([
        User.countDocuments(),
        Organization.countDocuments(),
        Task.countDocuments(),
        Execution.countDocuments({ status: 'running' }),
        AuditLog.countDocuments(),
      ]);

      const systemHealth = {
        status: 'healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        nodeVersion: process.version,
        cpuCores: os.cpus().length,
        freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            totalOrgs,
            totalTasks,
            runningExecutions,
            auditLogsCount,
          },
          systemHealth,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, limit = '50' } = req.query;
      const filter: any = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string, 10));

      res.json({ success: true, data: users.map((u) => u.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async listOrganizations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '50' } = req.query;
      const orgs = await Organization.find()
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string, 10));

      res.json({ success: true, data: orgs.map((o) => o.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit = '100' } = req.query;
      const logs = await AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(parseInt(limit as string, 10));

      res.json({ success: true, data: logs.map((l) => l.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      user.status = user.status === 'active' ? 'suspended' : 'active';
      await user.save();

      res.json({
        success: true,
        message: `User status changed to ${user.status}`,
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}
