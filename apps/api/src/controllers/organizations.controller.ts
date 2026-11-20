import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { BUILT_IN_AGENT_TEMPLATES, OrgRole, PlanTier } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Organization, OrganizationMember, Agent, Task } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { AuditService } from '../services/audit.service';

export class OrganizationsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberships = await OrganizationMember.find({ userId: req.user!._id }).populate('organizationId');
      const orgsWithDetails = await Promise.all(
        memberships.map(async (m: any) => {
          if (!m.organizationId) return null;
          const org = m.organizationId.toJSON();
          const [memberCount, agentCount] = await Promise.all([
            OrganizationMember.countDocuments({ organizationId: org.id }),
            Agent.countDocuments({ organizationId: org.id, isActive: true }),
          ]);
          return {
            ...org,
            role: m.role,
            memberCount,
            agentCount,
          };
        })
      );

      res.json({ success: true, data: orgsWithDetails.filter(Boolean) });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, slug } = req.body;
      const user = req.user!;

      const finalSlug =
        slug ||
        `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${crypto.randomBytes(3).toString('hex')}`;

      const existing = await Organization.findOne({ slug: finalSlug });
      if (existing) {
        throw new AppError('Organization slug already in use', 409, 'SLUG_IN_USE');
      }

      const organization = await Organization.create({
        name,
        slug: finalSlug,
        plan: PlanTier.FREE,
        ownerId: user._id,
      });

      await OrganizationMember.create({
        organizationId: organization._id,
        userId: user._id,
        role: OrgRole.OWNER,
      });

      // Seed built-in agents
      const agentDocs = BUILT_IN_AGENT_TEMPLATES.map((tmpl) => ({
        ...tmpl,
        organizationId: organization._id,
        creatorId: user._id,
        isTemplate: false,
        isActive: true,
      }));
      await Agent.insertMany(agentDocs);

      await AuditService.record({
        organizationId: organization._id.toString(),
        actorId: user._id.toString(),
        actorEmail: user.email,
        action: 'ORGANIZATION_CREATED',
        resourceType: 'Organization',
        resourceId: organization._id.toString(),
      });

      res.status(201).json({ success: true, data: organization.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await Organization.findById(req.organizationId);
      if (!org) throw new AppError('Organization not found', 404);

      const [memberCount, agentCount, activeTasksCount] = await Promise.all([
        OrganizationMember.countDocuments({ organizationId: org._id }),
        Agent.countDocuments({ organizationId: org._id, isActive: true }),
        Task.countDocuments({ organizationId: org._id, status: 'running' }),
      ]);

      res.json({
        success: true,
        data: {
          ...org.toJSON(),
          role: req.orgRole,
          memberCount,
          agentCount,
          activeTasksCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const org = await Organization.findById(req.organizationId);
      if (!org) throw new AppError('Organization not found', 404);

      const { requireApprovalForTools, domainAllowlist, maxConcurrentTasks, emailNotificationsEnabled } = req.body;

      if (requireApprovalForTools !== undefined) {
        org.settings.requireApprovalForTools = requireApprovalForTools;
      }
      if (domainAllowlist !== undefined) {
        org.settings.domainAllowlist = domainAllowlist;
      }
      if (maxConcurrentTasks !== undefined) {
        org.settings.maxConcurrentTasks = maxConcurrentTasks;
      }
      if (emailNotificationsEnabled !== undefined) {
        org.settings.emailNotificationsEnabled = emailNotificationsEnabled;
      }

      await org.save();

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'ORGANIZATION_SETTINGS_UPDATED',
        resourceType: 'Organization',
        resourceId: org._id.toString(),
        metadata: { settings: org.settings },
      });

      res.json({ success: true, data: org.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  public static async switchDefault(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const membership = await OrganizationMember.findOne({
        organizationId,
        userId: req.user!._id,
      });

      if (!membership && !req.user!.isPlatformAdmin) {
        throw new AppError('Not authorized for this organization', 403, 'FORBIDDEN');
      }

      req.user!.defaultOrganizationId = organizationId as any;
      await req.user!.save();

      res.json({ success: true, message: 'Default workspace switched successfully' });
    } catch (error) {
      next(error);
    }
  }
}
