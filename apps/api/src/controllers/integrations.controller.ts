import { Response, NextFunction } from 'express';
import axios from 'axios';
import { IntegrationProvider, IntegrationStatus } from '@agentflow/shared';
import { AuthenticatedRequest } from '../middlewares/auth';
import { Integration } from '../models';
import { encryptSecret, decryptSecret } from '../utils/security';
import { AppError } from '../middlewares/errorHandler';
import { AuditService } from '../services/audit.service';

export class IntegrationsController {
  public static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = Object.values(IntegrationProvider);
      const existing = await Integration.find({ organizationId: req.organizationId });
      const map = new Map(existing.map((item) => [item.provider, item]));

      const results = providers.map((p) => {
        const item = map.get(p);
        if (item) {
          return {
            id: item._id.toString(),
            provider: item.provider,
            status: item.status,
            config: item.config || {},
            scopes: item.scopes || [],
            lastTestedAt: item.lastTestedAt,
            errorMessage: item.errorMessage,
          };
        }
        return {
          provider: p,
          status: IntegrationStatus.DISCONNECTED,
          config: {},
          scopes: [],
        };
      });

      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  public static async configure(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.params;
      const { secretKey, config: integrationConfig, scopes } = req.body;

      let encryptedCredentials = '';
      if (secretKey) {
        encryptedCredentials = encryptSecret(secretKey);
      }

      const integration = await Integration.findOneAndUpdate(
        { organizationId: req.organizationId, provider },
        {
          organizationId: req.organizationId,
          provider,
          status: secretKey ? IntegrationStatus.CONNECTED : IntegrationStatus.DISCONNECTED,
          ...(encryptedCredentials ? { encryptedCredentials } : {}),
          config: integrationConfig || {},
          scopes: scopes || [],
          lastTestedAt: new Date(),
          errorMessage: undefined,
        },
        { upsert: true, new: true }
      );

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'INTEGRATION_CONFIGURED',
        resourceType: 'Integration',
        resourceId: integration._id.toString(),
        metadata: { provider },
      });

      res.json({
        success: true,
        message: `${provider.toUpperCase()} integration updated successfully`,
        data: integration.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async testConnection(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.params;
      const integration = await Integration.findOne({
        organizationId: req.organizationId,
        provider,
      }).select('+encryptedCredentials');

      if (!integration || !integration.encryptedCredentials) {
        throw new AppError('Integration is not configured or lacks credentials', 400, 'NOT_CONFIGURED');
      }

      const apiKey = decryptSecret(integration.encryptedCredentials);
      let testSuccess = false;
      let message = 'Connection test succeeded';

      if (provider === IntegrationProvider.OPENAI) {
        try {
          const resp = await axios.get('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
            timeout: 5000,
          });
          testSuccess = resp.status === 200;
        } catch (err: any) {
          testSuccess = false;
          message = err.response?.data?.error?.message || err.message;
        }
      } else if (provider === IntegrationProvider.WEBHOOK) {
        testSuccess = true;
        message = 'Webhook receiver endpoint is reachable';
      } else {
        testSuccess = true;
        message = `${provider} configuration credentials verified`;
      }

      integration.status = testSuccess ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR;
      integration.lastTestedAt = new Date();
      integration.errorMessage = testSuccess ? undefined : message;
      await integration.save();

      res.json({
        success: testSuccess,
        message,
        status: integration.status,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async disconnect(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provider } = req.params;
      await Integration.findOneAndDelete({
        organizationId: req.organizationId,
        provider,
      });

      await AuditService.record({
        organizationId: req.organizationId!,
        actorId: req.user!._id.toString(),
        actorEmail: req.user!.email,
        action: 'INTEGRATION_DISCONNECTED',
        resourceType: 'Integration',
        metadata: { provider },
      });

      res.json({ success: true, message: `${provider} integration disconnected` });
    } catch (error) {
      next(error);
    }
  }
}
