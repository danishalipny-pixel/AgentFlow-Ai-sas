import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Execution, ExecutionStep } from '../models';
import { AppError } from '../middlewares/errorHandler';

export class ExecutionsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId, status, limit = '20' } = req.query;
      const filter: any = { organizationId: req.organizationId };

      if (taskId) filter.taskId = taskId;
      if (status) filter.status = status;

      const executions = await Execution.find(filter)
        .populate('taskId', 'title priority')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string, 10));

      res.json({ success: true, data: executions.map((e) => e.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const execution = await Execution.findOne({
        _id: req.params.executionId,
        organizationId: req.organizationId,
      }).populate('taskId', 'title description priority');

      if (!execution) throw new AppError('Execution not found', 404);

      const steps = await ExecutionStep.find({ executionId: execution._id }).sort({ stepNumber: 1 });

      res.json({
        success: true,
        data: {
          ...execution.toJSON(),
          steps: steps.map((s) => s.toJSON()),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
