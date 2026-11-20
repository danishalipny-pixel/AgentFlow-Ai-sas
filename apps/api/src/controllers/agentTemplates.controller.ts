import { Response, NextFunction } from 'express';
import { BUILT_IN_AGENT_TEMPLATES } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Agent } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { BillingService } from '../services/billing.service';

export class AgentTemplatesController {
  public static list(_req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      res.json({ success: true, data: BUILT_IN_AGENT_TEMPLATES });
    } catch (error) {
      next(error);
    }
  }

  public static async instantiate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateRole } = req.body;
      const tmpl = BUILT_IN_AGENT_TEMPLATES.find((t) => t.role === templateRole || t.name === templateRole);

      if (!tmpl) {
        throw new AppError(`Template '${templateRole}' not found`, 404, 'NOT_FOUND');
      }

      await BillingService.assertWithinLimit(req.organizationId!, 'agents');

      const agent = await Agent.create({
        ...tmpl,
        organizationId: req.organizationId,
        creatorId: req.user!._id,
        isTemplate: false,
        isActive: true,
      });

      res.status(201).json({ success: true, data: agent.toJSON() });
    } catch (error) {
      next(error);
    }
  }
}
