import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Workflow, Task } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { WorkflowService } from '../services/workflow.service';
import { AuditService } from '../services/audit.service';

export class WorkflowsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workflows = await Workflow.find({ organizationId: req.organizationId }).sort({ updatedAt: -1 });
      res.json({ success: true, data: workflows.map((w) => w.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, nodes, edges } = req.body;

      // Validate workflow node/edge topology
      const validation = WorkflowService.validateWorkflow(nodes, edges);
      if (!validation.valid) {
        throw new AppError(`Workflow validation error: ${validation.errors.join('; ')}`, 400, 'INVALID_WORKFLOW');
      }

      const workflow = await Workflow.create({
        organizationId: req.organizationId,
        name,
        description: description || '',
        nodes,
        edges,
        version: 1,
        creatorId: req.user!._id,
      });

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'WORKFLOW_CREATED',
        resourceType: 'Workflow',
        resourceId: workflow._id.toString(),
        metadata: { name, nodeCount: nodes.length },
      });

      res.status(201).json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workflow = await Workflow.findOne({
        _id: req.params.workflowId,
        organizationId: req.organizationId,
      });

      if (!workflow) throw new AppError('Workflow not found', 404);

      const recentExecutions = await Task.find({
        organizationId: req.organizationId,
        workflowId: workflow._id,
      })
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          ...workflow.toJSON(),
          recentExecutions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, nodes, edges, isActive } = req.body;
      const workflow = await Workflow.findOne({
        _id: req.params.workflowId,
        organizationId: req.organizationId,
      });

      if (!workflow) throw new AppError('Workflow not found', 404);

      if (nodes && edges) {
        const validation = WorkflowService.validateWorkflow(nodes, edges);
        if (!validation.valid) {
          throw new AppError(`Workflow validation error: ${validation.errors.join('; ')}`, 400, 'INVALID_WORKFLOW');
        }
        workflow.nodes = nodes;
        workflow.edges = edges;
        workflow.version += 1;
      }

      if (name) workflow.name = name;
      if (description !== undefined) workflow.description = description;
      if (isActive !== undefined) workflow.isActive = isActive;

      await workflow.save();

      res.json({ success: true, data: workflow.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async run(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inputParameters } = req.body;
      const result = await WorkflowService.executeWorkflow(
        req.params.workflowId,
        req.organizationId!,
        req.user!._id.toString(),
        inputParameters
      );

      res.json({
        success: true,
        message: 'Workflow execution initiated successfully',
        data: { taskId: result.taskId },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async duplicate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const source = await Workflow.findOne({
        _id: req.params.workflowId,
        organizationId: req.organizationId,
      });

      if (!source) throw new AppError('Workflow not found', 404);

      const clone = await Workflow.create({
        organizationId: req.organizationId,
        name: `${source.name} (Copy)`,
        description: source.description,
        nodes: source.nodes,
        edges: source.edges,
        version: 1,
        isActive: true,
        creatorId: req.user!._id,
      });

      res.status(201).json({ success: true, data: clone.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const workflow = await Workflow.findOneAndDelete({
        _id: req.params.workflowId,
        organizationId: req.organizationId,
      });

      if (!workflow) throw new AppError('Workflow not found', 404);

      res.json({ success: true, message: 'Workflow deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
