import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { ToolDefinition, Organization } from '../models';
import { ToolService } from '../services/tool.service';

export class ToolsController {
  public static async list(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tools = await ToolDefinition.find().sort({ isBuiltin: -1, name: 1 });
      res.json({ success: true, data: tools.map((t) => t.toJSON()) });
    } catch (error) {
      next(error);
    }
  }

  public static async testRun(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toolName, parameters } = req.body;
      const org = await Organization.findById(req.organizationId);

      const result = await ToolService.executeTool(toolName, parameters || {}, {
        organizationId: req.organizationId!,
        domainAllowlist: org?.settings?.domainAllowlist,
        userId: req.user!._id.toString(),
      });

      res.json({
        success: result.success,
        data: result.result,
        error: result.error,
      });
    } catch (error) {
      next(error);
    }
  }
}
