import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { BUILT_IN_AGENT_TEMPLATES, OrgRole, PlanTier } from '@agentflow/shared';
import { config } from '../config';
import { User, Organization, OrganizationMember, Agent } from '../models';
import { AppError } from '../middlewares/errorHandler';
import { NotificationService } from '../services/notification.service';
import { AuditService } from '../services/audit.service';
import { AuthenticatedRequest } from '../middlewares/auth';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
  const refreshToken = jwt.sign({ userId }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as any,
  });
  return { accessToken, refreshToken };
};

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, organizationName } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
      }

      // Hash password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create User
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        isEmailVerified: false,
      });

      // Create Default Organization
      const orgName = organizationName || `${name.split(' ')[0]}'s Workspace`;
      const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

      const organization = await Organization.create({
        name: orgName,
        slug: uniqueSlug,
        plan: PlanTier.FREE,
        ownerId: user._id,
      });

      // Create Membership as OWNER
      await OrganizationMember.create({
        organizationId: organization._id,
        userId: user._id,
        role: OrgRole.OWNER,
      });

      user.defaultOrganizationId = organization._id;
      await user.save();

      // Seed built-in agents for this organization
      const agentDocs = BUILT_IN_AGENT_TEMPLATES.map((tmpl) => ({
        ...tmpl,
        organizationId: organization._id,
        creatorId: user._id,
        isTemplate: false,
        isActive: true,
      }));
      await Agent.insertMany(agentDocs);

      const tokens = generateTokens(user._id.toString());

      await AuditService.record({
        organizationId: organization._id.toString(),
        actorId: user._id.toString(),
        actorEmail: user.email,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: user._id.toString(),
      });

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          organization: organization.toJSON(),
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      user.lastLoginAt = new Date();
      await user.save();

      const tokens = generateTokens(user._id.toString());

      // Get organizations user belongs to
      let memberships = await OrganizationMember.find({ userId: user._id }).populate('organizationId');

      // Auto-provision personal workspace if user has none
      if (memberships.length === 0) {
        const orgName = `${user.name || 'Personal'}'s Workspace`;
        const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        const organization = await Organization.create({
          name: orgName,
          slug: uniqueSlug,
          plan: user.isPlatformAdmin ? PlanTier.ENTERPRISE : PlanTier.FREE,
          ownerId: user._id,
        });

        await OrganizationMember.create({
          organizationId: organization._id,
          userId: user._id,
          role: OrgRole.OWNER,
        });

        user.defaultOrganizationId = organization._id;
        await user.save();

        const agentDocs = BUILT_IN_AGENT_TEMPLATES.map((tmpl) => ({
          ...tmpl,
          organizationId: organization._id,
          creatorId: user._id,
          isTemplate: false,
          isActive: true,
        }));
        await Agent.insertMany(agentDocs);

        memberships = await OrganizationMember.find({ userId: user._id }).populate('organizationId');
      }

      const organizations = memberships.map((m: any) => ({
        ...(m.organizationId ? m.organizationId.toJSON() : {}),
        role: m.role,
      }));

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          defaultOrgId: organizations[0]?.id || user.defaultOrganizationId,
          organizations,
          tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError('Refresh token is required', 400, 'MISSING_TOKEN');
      }

      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
      } catch (err) {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AppError('User not found or inactive', 401, 'USER_NOT_FOUND');
      }

      const tokens = generateTokens(user._id.toString());
      res.json({ success: true, data: { tokens } });
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      // Return success even if not found to prevent user enumeration
      if (!user) {
        res.json({
          success: true,
          message: 'If an account with that email exists, password reset instructions have been sent.',
        });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetUrl = `${config.appBaseUrl}/reset-password?token=${resetToken}`;

      if (config.smtp.isConfigured && user.defaultOrganizationId) {
        await NotificationService.notify({
          organizationId: user.defaultOrganizationId.toString(),
          userId: user._id.toString(),
          title: 'Reset Your Password',
          message: `Click the link to reset your password: ${resetUrl}`,
          type: 'password_reset',
          sendEmail: true,
          userEmail: user.email,
        });
      }

      res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
        // In local development when SMTP is not configured, provide preview link for rapid testing
        ...(config.env === 'development' && !config.smtp.isConfigured ? { devResetUrl: resetUrl } : {}),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AppError('Password reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
      }

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Password has been successfully updated. You may now log in.',
      });
    } catch (error) {
      next(error);
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      let memberships = await OrganizationMember.find({ userId: user._id }).populate('organizationId');

      if (memberships.length === 0) {
        const orgName = `${user.name || 'Personal'}'s Workspace`;
        const baseSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

        const organization = await Organization.create({
          name: orgName,
          slug: uniqueSlug,
          plan: user.isPlatformAdmin ? PlanTier.ENTERPRISE : PlanTier.FREE,
          ownerId: user._id,
        });

        await OrganizationMember.create({
          organizationId: organization._id,
          userId: user._id,
          role: OrgRole.OWNER,
        });

        user.defaultOrganizationId = organization._id;
        await user.save();

        const agentDocs = BUILT_IN_AGENT_TEMPLATES.map((tmpl) => ({
          ...tmpl,
          organizationId: organization._id,
          creatorId: user._id,
          isTemplate: false,
          isActive: true,
        }));
        await Agent.insertMany(agentDocs);

        memberships = await OrganizationMember.find({ userId: user._id }).populate('organizationId');
      }

      const organizations = memberships.map((m: any) => ({
        ...(m.organizationId ? m.organizationId.toJSON() : {}),
        role: m.role,
      }));

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          defaultOrgId: organizations[0]?.id || user.defaultOrganizationId,
          organizations,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
