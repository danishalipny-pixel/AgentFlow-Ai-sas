import { Response, NextFunction } from 'express';
import { PlanTier } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { BillingService } from '../services/billing.service';
import { Organization, Subscription } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuditService } from '../services/audit.service';

export class SubscriptionsController {
  public static async getDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const details = await BillingService.getSubscriptionDetails(req.organizationId!);
      res.json({ success: true, data: details });
    } catch (error) {
      next(error);
    }
  }

  public static async changePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plan } = req.body;
      if (!Object.values(PlanTier).includes(plan)) {
        throw new AppError('Invalid subscription tier', 400);
      }

      // Update organization & subscription plan
      const org = await Organization.findByIdAndUpdate(req.organizationId, { plan }, { new: true });
      const sub = await Subscription.findOneAndUpdate(
        { organizationId: req.organizationId },
        { plan },
        { new: true }
      );

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'SUBSCRIPTION_PLAN_CHANGED',
        resourceType: 'Subscription',
        metadata: { newPlan: plan },
      });

      res.json({
        success: true,
        message: `Plan updated to ${plan.toUpperCase()}`,
        data: { organization: org?.toJSON(), subscription: sub?.toJSON() },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createCheckout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { plan, returnUrl } = req.body;
      const session = await BillingService.createCheckoutSession(req.organizationId!, plan, returnUrl);
      res.json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  }
}
