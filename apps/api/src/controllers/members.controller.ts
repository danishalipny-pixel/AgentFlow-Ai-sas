import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { OrgRole } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { OrganizationMember, User, Invitation } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { BillingService } from '../services/billing.service';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../services/audit.service';
import { config } from '../config';

export class MembersController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await OrganizationMember.find({ organizationId: req.organizationId })
        .populate('userId', 'name email avatarUrl isEmailVerified')
        .sort({ joinedAt: 1 });

      const formatted = members.map((m: any) => ({
        id: m._id.toString(),
        userId: m.userId?._id?.toString() || m.userId?.id,
        name: m.userId?.name,
        email: m.userId?.email,
        avatarUrl: m.userId?.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      }));

      // Also get pending invitations
      const invitations = await Invitation.find({
        organizationId: req.organizationId,
        status: 'pending',
      });

      res.json({
        success: true,
        data: {
          members: formatted,
          invitations: invitations.map((inv) => ({
            id: inv._id.toString(),
            email: inv.email,
            role: inv.role,
            status: inv.status,
            createdAt: inv.createdAt,
            expiresAt: inv.expiresAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async invite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, role } = req.body;
      const organizationId = req.organizationId!;

      await BillingService.assertWithinLimit(organizationId, 'members');

      const existingMember = await OrganizationMember.findOne({
        organizationId,
        userId: await User.findOne({ email: email.toLowerCase() }).select('_id'),
      });
      if (existingMember) {
        throw new AppError('This user is already a member of this workspace', 400, 'ALREADY_MEMBER');
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await Invitation.create({
        organizationId,
        email: email.toLowerCase(),
        role: role || OrgRole.MEMBER,
        token,
        invitedBy: req.user!._id,
        expiresAt,
      });

      const inviteUrl = `${config.appBaseUrl}/accept-invitation?token=${token}`;

      if (config.smtp.isConfigured) {
        await NotificationService.notify({
          organizationId,
          userId: req.user!._id.toString(),
          title: 'Workspace Invitation',
          message: `You have been invited to join AgentFlow workspace as ${role}. Accept here: ${inviteUrl}`,
          type: 'invitation',
          sendEmail: true,
          userEmail: email,
        });
      }

      await AuditService.record({
        organizationId,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'MEMBER_INVITED',
        resourceType: 'Invitation',
        resourceId: invitation._id.toString(),
        metadata: { email, role },
      });

      res.status(201).json({
        success: true,
        message: 'Invitation dispatched successfully',
        data: {
          id: invitation._id.toString(),
          email: invitation.email,
          role: invitation.role,
          ...(config.env === 'development' ? { devInviteUrl: inviteUrl } : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const { role } = req.body;

      const member = await OrganizationMember.findOne({
        _id: memberId,
        organizationId: req.organizationId,
      });

      if (!member) throw new AppError('Member not found', 404);

      if (member.role === OrgRole.OWNER) {
        throw new AppError('Cannot change the role of the workspace Owner', 400, 'CANNOT_MODIFY_OWNER');
      }

      member.role = role;
      await member.save();

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'MEMBER_ROLE_UPDATED',
        resourceType: 'OrganizationMember',
        resourceId: memberId,
        metadata: { newRole: role },
      });

      res.json({ success: true, message: 'Member role updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;

      const member = await OrganizationMember.findOne({
        _id: memberId,
        organizationId: req.organizationId,
      });

      if (!member) throw new AppError('Member not found', 404);

      if (member.role === OrgRole.OWNER) {
        throw new AppError('Cannot remove the workspace Owner', 400, 'CANNOT_REMOVE_OWNER');
      }

      await member.deleteOne();

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'MEMBER_REMOVED',
        resourceType: 'OrganizationMember',
        resourceId: memberId,
      });

      res.json({ success: true, message: 'Member removed from organization' });
    } catch (error) {
      next(error);
    }
  }
}
