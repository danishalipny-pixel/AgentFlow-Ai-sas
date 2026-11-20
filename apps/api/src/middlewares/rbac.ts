import { Response, NextFunction } from 'express';
import { OrgRole } from '@agentflow/shared';
import { AuthenticatedRequest } from './auth';

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  [OrgRole.OWNER]: 100,
  [OrgRole.ADMIN]: 80,
  [OrgRole.MANAGER]: 60,
  [OrgRole.MEMBER]: 40,
  [OrgRole.VIEWER]: 20,
};

export const requireRole = (minRole: OrgRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.orgRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'No tenant role context found for this request',
        },
      });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.orgRole as OrgRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

    if (userLevel < requiredLevel && !req.user?.isPlatformAdmin) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `This action requires ${minRole.toUpperCase()} role or higher`,
        },
      });
      return;
    }

    next();
  };
};
