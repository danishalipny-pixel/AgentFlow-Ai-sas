import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Approval } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { ApprovalService } from '../services/approval.service';

export class ApprovalsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = { organizationId: req.organizationId };

      if (status) {
        filter.status = status;
      }

      const approvals = await Approval.find(filter)
        .populate('taskId', 'title priority')
        .populate('decidedByUserId', 'name email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: approvals.map((a: any) => ({
          ...a.toJSON(),
          taskTitle: a.taskId?.title,
          decidedByName: a.decidedByUserId?.name,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const approval = await Approval.findOne({
        _id: req.params.approvalId,
        organizationId: req.organizationId,
      })
        .populate('taskId', 'title description priority')
        .populate('decidedByUserId', 'name email');

      if (!approval) throw new AppError('Approval request not found', 404);

      res.json({ success: true, data: approval.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async resolve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { decision, comment } = req.body;
      const approval = await ApprovalService.resolveApproval(
        req.params.approvalId,
        req.organizationId!,
        req.user!._id.toString(),
        decision,
        comment
      );

      res.json({
        success: true,
        message: `Action ${decision} successfully`,
        data: approval.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}
