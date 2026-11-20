import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Agent, Task } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { BillingService } from '../services/billing.service';
import { AuditService } from '../services/audit.service';

export class AgentsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, role } = req.query;
      const filter: any = { organizationId: req.organizationId };

      if (status === 'active') filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } },
        ];
      }

      const agents = await Agent.find(filter).sort({ createdAt: -1 });

      // Add task execution stats for each agent
      const enhanced = await Promise.all(
        agents.map(async (agent) => {
          const tasksCount = await Task.countDocuments({
            organizationId: req.organizationId,
            assignedAgentId: agent._id,
          });
          const completedCount = await Task.countDocuments({
            organizationId: req.organizationId,
            assignedAgentId: agent._id,
            status: 'completed',
          });
          return {
            ...agent.toJSON(),
            tasksCount,
            completedCount,
            successRate: tasksCount > 0 ? Math.round((completedCount / tasksCount) * 100) : 100,
          };
        })
      );

      res.json({ success: true, data: enhanced });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.organizationId!;
      await BillingService.assertWithinLimit(organizationId, 'agents');

      const agent = await Agent.create({
        ...req.body,
        organizationId,
        creatorId: req.user!._id,
      });

      await AuditService.record({
        organizationId,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'AGENT_CREATED',
        resourceType: 'Agent',
        resourceId: agent._id.toString(),
        metadata: { name: agent.name, role: agent.role },
      });

      res.status(201).json({ success: true, data: agent.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const agent = await Agent.findOne({
        _id: req.params.agentId,
        organizationId: req.organizationId,
      });

      if (!agent) throw new AppError('Agent not found', 404);

      const recentTasks = await Task.find({
        organizationId: req.organizationId,
        assignedAgentId: agent._id,
      })
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          ...agent.toJSON(),
          recentTasks,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const agent = await Agent.findOneAndUpdate(
        { _id: req.params.agentId, organizationId: req.organizationId },
        { ...req.body },
        { new: true }
      );

      if (!agent) throw new AppError('Agent not found', 404);

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'AGENT_UPDATED',
        resourceType: 'Agent',
        resourceId: agent._id.toString(),
      });

      res.json({ success: true, data: agent.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async duplicate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await BillingService.assertWithinLimit(req.organizationId!, 'agents');

      const sourceAgent = await Agent.findOne({
        _id: req.params.agentId,
        organizationId: req.organizationId,
      });

      if (!sourceAgent) throw new AppError('Source agent not found', 404);

      const clone = await Agent.create({
        ...sourceAgent.toObject(),
        _id: undefined,
        name: `${sourceAgent.name} (Copy)`,
        creatorId: req.user!._id,
        createdAt: undefined,
        updatedAt: undefined,
      });

      res.status(201).json({ success: true, data: clone.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const agent = await Agent.findOne({
        _id: req.params.agentId,
        organizationId: req.organizationId,
      });

      if (!agent) throw new AppError('Agent not found', 404);

      agent.isActive = !agent.isActive;
      await agent.save();

      res.json({ success: true, data: agent.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const agent = await Agent.findOneAndDelete({
        _id: req.params.agentId,
        organizationId: req.organizationId,
      });

      if (!agent) throw new AppError('Agent not found', 404);

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'AGENT_DELETED',
        resourceType: 'Agent',
        resourceId: agent._id.toString(),
      });

      res.json({ success: true, message: 'Agent deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
