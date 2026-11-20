import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Agent, Task, Execution, Approval } from '../models';

export class AnalyticsController {
  public static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = new mongoose.Types.ObjectId(req.organizationId!);

      const [
        totalAgents,
        activeAgents,
        totalTasks,
        completedTasks,
        failedTasks,
        pendingApprovals,
        executions,
      ] = await Promise.all([
        Agent.countDocuments({ organizationId: orgId }),
        Agent.countDocuments({ organizationId: orgId, isActive: true }),
        Task.countDocuments({ organizationId: orgId }),
        Task.countDocuments({ organizationId: orgId, status: 'completed' }),
        Task.countDocuments({ organizationId: orgId, status: 'failed' }),
        Approval.countDocuments({ organizationId: orgId, status: 'pending' }),
        Execution.find({ organizationId: orgId }).select('durationMs totalTokens estimatedCostUSD createdAt status'),
      ]);

      const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      let totalDurationMs = 0;
      let totalTokensUsed = 0;
      let estimatedTotalCostUSD = 0;

      executions.forEach((e) => {
        totalDurationMs += e.durationMs || 0;
        totalTokensUsed += e.totalTokens || 0;
        estimatedTotalCostUSD += e.estimatedCostUSD || 0;
      });

      const avgDurationMs = executions.length > 0 ? Math.round(totalDurationMs / executions.length) : 0;

      // Build 14-day timeline trend
      const trendMap = new Map<string, { tasksCount: number; tokensCount: number; costUSD: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        trendMap.set(key, { tasksCount: 0, tokensCount: 0, costUSD: 0 });
      }

      executions.forEach((e) => {
        const key = new Date(e.createdAt).toISOString().split('T')[0];
        if (trendMap.has(key)) {
          const item = trendMap.get(key)!;
          item.tasksCount += 1;
          item.tokensCount += e.totalTokens || 0;
          item.costUSD = Number((item.costUSD + (e.estimatedCostUSD || 0)).toFixed(5));
        }
      });

      const usageTrend = Array.from(trendMap.entries()).map(([date, metrics]) => ({
        date,
        ...metrics,
      }));

      // Agent performance breakdown
      const agents = await Agent.find({ organizationId: orgId }).limit(10);
      const agentPerformance = await Promise.all(
        agents.map(async (a) => {
          const aTasks = await Task.countDocuments({ organizationId: orgId, assignedAgentId: a._id });
          const aCompleted = await Task.countDocuments({
            organizationId: orgId,
            assignedAgentId: a._id,
            status: 'completed',
          });
          return {
            agentId: a._id.toString(),
            name: a.name,
            role: a.role,
            tasksHandled: aTasks,
            successRate: aTasks > 0 ? Math.round((aCompleted / aTasks) * 100) : 100,
            avgTimeMs: 1200,
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalAgents,
          activeAgents,
          totalTasks,
          completedTasks,
          failedTasks,
          pendingApprovals,
          successRate,
          avgDurationMs,
          totalTokensUsed,
          estimatedTotalCostUSD: Number(estimatedTotalCostUSD.toFixed(4)),
          usageTrend,
          agentPerformance,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
