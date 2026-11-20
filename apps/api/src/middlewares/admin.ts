import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const requirePlatformAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isPlatformAdmin) {
    res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_ACCESS_REQUIRED',
        message: 'This resource is restricted to platform administrators only',
      },
    });
    return;
  }
  next();
};
