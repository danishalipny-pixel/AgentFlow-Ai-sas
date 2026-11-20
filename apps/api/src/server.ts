import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './config/db';
import { ToolService } from './services/tool.service';
import { User, Organization, OrganizationMember, Agent } from './models';
import { BUILT_IN_AGENT_TEMPLATES, OrgRole, PlanTier } from '@agentflow/shared';
import bcrypt from 'bcryptjs';

const startServer = async () => {
  try {
    // 1. Connect database (with resilient memory fallback if external MongoDB is down)
    await connectDatabase();

    // 2. Seed built-in tools into registry
    await ToolService.seedBuiltinTools();
    console.log('[Bootstrap] Built-in tools verified and seeded.');

    // 3. Seed platform admin account and workspace if configured and not present
    let admin = await User.findOne({ email: config.platformAdmin.email.toLowerCase() });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(config.platformAdmin.password, salt);
      admin = await User.create({
        email: config.platformAdmin.email.toLowerCase(),
        name: 'Platform Administrator',
        passwordHash,
        isPlatformAdmin: true,
        isEmailVerified: true,
      });
      console.log(`[Bootstrap] Platform administrator seeded: ${config.platformAdmin.email}`);
    }

    // Ensure administrator has an active Organization and Membership
    let adminMembership = await OrganizationMember.findOne({ userId: admin._id });
    if (!adminMembership) {
      const adminOrg = await Organization.create({
        name: 'AgentFlow Operations HQ',
        slug: `agentflow-hq-${Date.now().toString(36)}`,
        plan: PlanTier.ENTERPRISE,
        ownerId: admin._id,
      });

      adminMembership = await OrganizationMember.create({
        organizationId: adminOrg._id,
        userId: admin._id,
        role: OrgRole.OWNER,
      });

      admin.defaultOrganizationId = adminOrg._id;
      await admin.save();

      // Seed built-in agents into admin org
      const agentDocs = BUILT_IN_AGENT_TEMPLATES.map((tmpl) => ({
        ...tmpl,
        organizationId: adminOrg._id,
        creatorId: admin._id,
        isTemplate: false,
        isActive: true,
      }));
      await Agent.insertMany(agentDocs);

      console.log(`[Bootstrap] Organization 'AgentFlow Operations HQ' attached to Platform Administrator.`);
    }

    // 4. Start Express HTTP server
    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 AGENTFLOW AI BACKEND SERVICE ONLINE`);
      console.log(`📡 URL: http://localhost:${config.port}`);
      console.log(`📖 Swagger API Docs: http://localhost:${config.port}/api/v1/docs`);
      console.log(`🩺 Health check: http://localhost:${config.port}/health`);
      console.log(`======================================================\n`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Fatal startup failure:', error);
    process.exit(1);
  }
};

startServer();
