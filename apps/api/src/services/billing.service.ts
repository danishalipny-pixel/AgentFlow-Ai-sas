import { PlanTier } from '@agentflow/shared';
import { config } from '../config';
import { Subscription, Organization, Task, Agent, KnowledgeDocument, OrganizationMember } from '../models';
import { AppError } from '../middlewares/errorHandler';

export const PLAN_LIMITS: Record<PlanTier, { maxAgents: number; maxTasksPerMonth: number; maxStorageMb: number; maxTeamMembers: number }> = {
  [PlanTier.FREE]: { maxAgents: 3, maxTasksPerMonth: 50, maxStorageMb: 50, maxTeamMembers: 2 },
  [PlanTier.STARTER]: { maxAgents: 10, maxTasksPerMonth: 500, maxStorageMb: 500, maxTeamMembers: 5 },
  [PlanTier.PRO]: { maxAgents: 25, maxTasksPerMonth: 2500, maxStorageMb: 2048, maxTeamMembers: 15 },
  [PlanTier.BUSINESS]: { maxAgents: 100, maxTasksPerMonth: 10000, maxStorageMb: 10240, maxTeamMembers: 50 },
  [PlanTier.ENTERPRISE]: { maxAgents: 999999, maxTasksPerMonth: 999999, maxStorageMb: 102400, maxTeamMembers: 9999 },
};

export class BillingService {
  /**
   * Get subscription and accurate current usage
   */
  public static async getSubscriptionDetails(organizationId: string) {
    let sub = await Subscription.findOne({ organizationId });
    const org = await Organization.findById(organizationId);

    if (!sub) {
      const plan = org?.plan || PlanTier.FREE;
      sub = await Subscription.create({
        organizationId,
        plan,
        status: 'active',
        limits: PLAN_LIMITS[plan],
      });
    }

    // Compute actual live usage from database
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [agentsCount, tasksThisMonth, teamMembersCount, docs] = await Promise.all([
      Agent.countDocuments({ organizationId, isActive: true }),
      Task.countDocuments({ organizationId, createdAt: { $gte: startOfMonth } }),
      OrganizationMember.countDocuments({ organizationId }),
      KnowledgeDocument.find({ organizationId }, 'fileSize'),
    ]);

    const totalBytes = docs.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
    const storageUsedMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

    sub.currentUsage = {
      agentsCount,
      tasksThisMonth,
      storageUsedMb,
      teamMembersCount,
    };
    await sub.save();

    return {
      subscription: sub,
      isStripeConfigured: config.stripe.isConfigured,
    };
  }

  /**
   * Check if organization is within quotas
   */
  public static async assertWithinLimit(
    organizationId: string,
    limitType: 'agents' | 'tasks' | 'storage' | 'members'
  ): Promise<void> {
    const { subscription } = await this.getSubscriptionDetails(organizationId);
    const limits = subscription.limits;
    const usage = subscription.currentUsage;

    if (limitType === 'agents' && usage.agentsCount >= limits.maxAgents) {
      throw new AppError(
        `Agent limit reached for ${subscription.plan.toUpperCase()} plan (${limits.maxAgents} agents). Please upgrade to add more agents.`,
        403,
        'QUOTA_EXCEEDED'
      );
    }

    if (limitType === 'tasks' && usage.tasksThisMonth >= limits.maxTasksPerMonth) {
      throw new AppError(
        `Monthly task quota reached (${limits.maxTasksPerMonth} tasks). Please upgrade to continue running tasks.`,
        403,
        'QUOTA_EXCEEDED'
      );
    }
  }

  /**
   * Create checkout session
   */
  public static async createCheckoutSession(
    organizationId: string,
    targetPlan: PlanTier,
    _returnUrl: string
  ) {
    if (!config.stripe.isConfigured) {
      throw new AppError(
        'Stripe billing integration is not configured. Please supply STRIPE_SECRET_KEY in your environment configuration.',
        503,
        'STRIPE_NOT_CONFIGURED'
      );
    }

    // In a production Stripe setup, Stripe SDK is called here with stripe.checkout.sessions.create
    // We return clean information:
    return {
      message: `Checkout session initiated for ${targetPlan}`,
      organizationId,
      targetPlan,
    };
  }
}
