import mongoose from 'mongoose';
import { AuditLog } from '../models';

export interface RecordAuditOptions {
  organizationId: string | mongoose.Types.ObjectId;
  actorId?: string | mongoose.Types.ObjectId;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  public static async record(options: RecordAuditOptions): Promise<void> {
    try {
      // Sanitize metadata to strip sensitive fields
      const sanitizedMeta: Record<string, any> = {};
      if (options.metadata) {
        for (const [key, value] of Object.entries(options.metadata)) {
          const lower = key.toLowerCase();
          if (
            lower.includes('password') ||
            lower.includes('token') ||
            lower.includes('secret') ||
            lower.includes('credential') ||
            lower.includes('api_key') ||
            lower.includes('apikey')
          ) {
            sanitizedMeta[key] = '[REDACTED]';
          } else {
            sanitizedMeta[key] = value;
          }
        }
      }

      await AuditLog.create({
        organizationId: new mongoose.Types.ObjectId(options.organizationId.toString()),
        actorId: options.actorId ? new mongoose.Types.ObjectId(options.actorId.toString()) : undefined,
        actorEmail: options.actorEmail,
        action: options.action,
        resourceType: options.resourceType,
        resourceId: options.resourceId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: sanitizedMeta,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('[AuditService] Failed to record audit log:', error);
      // Fail silently to avoid breaking the primary operation
    }
  }
}
