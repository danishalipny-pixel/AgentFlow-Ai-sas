import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerDocument } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';

// Import route modules
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import organizationsRoutes from './routes/organizations.routes';
import membersRoutes from './routes/members.routes';
import agentsRoutes from './routes/agents.routes';
import agentTemplatesRoutes from './routes/agentTemplates.routes';
import tasksRoutes from './routes/tasks.routes';
import executionsRoutes from './routes/executions.routes';
import workflowsRoutes from './routes/workflows.routes';
import approvalsRoutes from './routes/approvals.routes';
import toolsRoutes from './routes/tools.routes';
import integrationsRoutes from './routes/integrations.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationsRoutes from './routes/notifications.routes';
import subscriptionsRoutes from './routes/subscriptions.routes';
import adminRoutes from './routes/admin.routes';
import modelsRoutes from './routes/models.routes';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // For Swagger UI compatibility
    crossOriginEmbedderPolicy: false,
  }));

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or local tools)
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // General rate limiter
  app.use('/api/', apiLimiter);

  // Health check endpoint
  app.get(['/health', '/api/v1/health'], (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'agentflow-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // Swagger Documentation
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Mount API v1 Routers
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/organizations', organizationsRoutes);
  app.use('/api/v1/members', membersRoutes);
  app.use('/api/v1/agents', agentsRoutes);
  app.use('/api/v1/agent-templates', agentTemplatesRoutes);
  app.use('/api/v1/tasks', tasksRoutes);
  app.use('/api/v1/executions', executionsRoutes);
  app.use('/api/v1/workflows', workflowsRoutes);
  app.use('/api/v1/approvals', approvalsRoutes);
  app.use('/api/v1/tools', toolsRoutes);
  app.use('/api/v1/integrations', integrationsRoutes);
  app.use('/api/v1/knowledge', knowledgeRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/subscriptions', subscriptionsRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/models', modelsRoutes);

  // Catch-all 404 handler
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
