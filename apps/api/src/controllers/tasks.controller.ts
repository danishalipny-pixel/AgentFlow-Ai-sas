import { Response, NextFunction } from 'express';
import { TaskStatus } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Task, Execution, ExecutionStep } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { BillingService } from '../services/billing.service';
import { OrchestrationService } from '../services/orchestration.service';
import { AuditService } from '../services/audit.service';

export class TasksController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, priority, agentId, search, page = '1', limit = '20' } = req.query;
      const filter: any = { organizationId: req.organizationId };

      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (agentId) filter.assignedAgentId = agentId;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [tasks, total] = await Promise.all([
        Task.find(filter)
          .populate('assignedAgentId', 'name role avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        Task.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: tasks.map((t) => t.toJSON()),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId!;
      await BillingService.assertWithinLimit(organizationId, 'tasks');

      const task = await Task.create({
        ...req.body,
        organizationId,
        creatorId: req.user!._id,
        status: TaskStatus.QUEUED,
      });

      await AuditService.record({
        organizationId,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'TASK_CREATED',
        resourceType: 'Task',
        resourceId: task._id.toString(),
        metadata: { title: task.title, priority: task.priority },
      });

      // Asynchronously trigger execution
      OrchestrationService.executeTask(task._id.toString()).catch((err) => {
        console.error('[TasksController] Execution dispatch error:', err);
      });

      res.status(201).json({ success: true, data: task.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findOne({
        _id: req.params.taskId,
        organizationId: req.organizationId,
      }).populate('assignedAgentId', 'name role avatar model systemPrompt');

      if (!task) throw new AppError('Task not found', 404);

      // Fetch execution and its steps
      let latestExecution: any = null;
      let steps: any[] = [];

      if (task.latestExecutionId) {
        latestExecution = await Execution.findById(task.latestExecutionId);
        if (latestExecution) {
          steps = await ExecutionStep.find({ executionId: latestExecution._id }).sort({ stepNumber: 1 });
        }
      }

      res.json({
        success: true,
        data: {
          ...task.toJSON(),
          latestExecution: latestExecution ? latestExecution.toJSON() : null,
          steps: steps.map((s) => s.toJSON()),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async retry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findOne({
        _id: req.params.taskId,
        organizationId: req.organizationId,
      });

      if (!task) throw new AppError('Task not found', 404);

      task.status = TaskStatus.QUEUED;
      task.error = undefined;
      await task.save();

      OrchestrationService.executeTask(task._id.toString()).catch((err) => {
        console.error('[TasksController] Retry execution dispatch error:', err);
      });

      res.json({ success: true, message: 'Task queued for re-execution', data: task.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await Task.findOne({
        _id: req.params.taskId,
        organizationId: req.organizationId,
      });

      if (!task) throw new AppError('Task not found', 404);

      task.status = TaskStatus.CANCELLED;
      await task.save();

      if (task.latestExecutionId) {
        await Execution.findByIdAndUpdate(task.latestExecutionId, {
          status: TaskStatus.CANCELLED,
          endTime: new Date(),
        });
      }

      res.json({ success: true, message: 'Task cancelled successfully', data: task.toJSON() });
    } catch (error) {
      next(error);
    }
  }
}
