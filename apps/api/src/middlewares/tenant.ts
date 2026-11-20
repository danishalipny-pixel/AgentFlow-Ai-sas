import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from './auth';
import { Organization, OrganizationMember, Agent } from '../models';
import { BUILT_IN_AGENT_TEMPLATES, OrgRole, PlanTier } from '@agentflow/shared';

export const requireTenant = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const user = req.user;

    // Determine target organization ID from header or defaultOrganizationId or query
    let orgId = (req.headers['x-organization-id'] as string) || (req.query.organizationId as string);

    if (!orgId && user.defaultOrganizationId) {
      orgId = user.defaultOrganizationId.toString();
    }

    if (!orgId) {
      // Find the first organization the user is a member of
      const firstMembership = await OrganizationMember.findOne({ userId: user._id });
      if (firstMembership) {
        orgId = firstMembership.organizationId.toString();
      } else {
        // Auto-provision a default personal workspace so user is never stranded
        const defaultOrg = await Organization.create({
          name: `${user.name || 'Personal'}'s Workspace`,
          slug: `workspace-${user._id.toString().slice(-6)}-${Date.now().toString(36)}`,
          plan: user.isPlatformAdmin ? PlanTier.ENTERPRISE : PlanTier.FREE,
          ownerId: user._id,
        });
        await OrganizationMember.create({
          organizationId: defaultOrg._id,
          userId: user._id,
          role: OrgRole.OWNER,
        });
        user.defaultOrganizationId = defaultOrg._id;
        await user.save();
        orgId = defaultOrg._id.toString();

        const agentDocs = BUILT_IN_AGENT_TEMPLATES.map((tmpl) => ({
          ...tmpl,
          organizationId: defaultOrg._id,
          creatorId: user._id,
          isTemplate: false,
          isActive: true,
        }));
        await Agent.insertMany(agentDocs);
      }
    }

    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ORGANIZATION_REQUIRED',
          message: 'An active organization context is required. Pass x-organization-id header.',
        },
      });
      return;
    }

    // Verify user is actually a member of this organization
    const membership = await OrganizationMember.findOne({
      organizationId: new mongoose.Types.ObjectId(orgId),
      userId: user._id,
    });

    // If platform admin, allow access if tenant exists, assigning OWNER role for session
    if (!membership && !user.isPlatformAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_ACCESS_DENIED',
          message: 'You are not authorized to access data in this organization',
        },
      });
      return;
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      res.status(404).json({
        success: false,
        error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization does not exist' },
      });
      return;
    }

    // Echo active organization ID back in response headers for client sync
    res.setHeader('x-organization-id', orgId);

    req.organizationId = orgId;
    req.orgRole = membership ? membership.role : 'owner';
    next();
  } catch (error) {
    next(error);
  }
};
