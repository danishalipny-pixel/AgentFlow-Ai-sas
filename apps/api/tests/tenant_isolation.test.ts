import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Multi-Tenant Data Isolation', () => {
  let userAToken: string;
  let userAOrgId: string;

  let userBToken: string;
  let userBOrgId: string;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/v1/auth/register').send({
      name: 'Alice Corp',
      email: 'alice@tenant-a.com',
      password: 'Password123!',
      organizationName: 'Tenant Alpha',
    });
    userAToken = resA.body.data.tokens.accessToken;
    userAOrgId = resA.body.data.organization.id;

    // Register User B
    const resB = await request(app).post('/api/v1/auth/register').send({
      name: 'Bob Inc',
      email: 'bob@tenant-b.com',
      password: 'Password123!',
      organizationName: 'Tenant Beta',
    });
    userBToken = resB.body.data.tokens.accessToken;
    userBOrgId = resB.body.data.organization.id;
  });

  it('should prevent User A from accessing Tenant B with x-organization-id', async () => {
    const res = await request(app)
      .get('/api/v1/agents')
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-organization-id', userBOrgId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TENANT_ACCESS_DENIED');
  });

  it('should isolate agents created in Tenant A from Tenant B', async () => {
    // User A creates a proprietary agent in Tenant A
    await request(app)
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${userAToken}`)
      .set('x-organization-id', userAOrgId)
      .send({
        name: 'Alpha Confidential Agent',
        role: 'Research Agent',
        description: 'Proprietary research agent for Tenant Alpha',
        systemPrompt: 'Keep all secrets safe.',
        model: 'gpt-4o-mini',
      });

    // User B lists agents in Tenant B
    const resB = await request(app)
      .get('/api/v1/agents')
      .set('Authorization', `Bearer ${userBToken}`)
      .set('x-organization-id', userBOrgId);

    expect(resB.status).toBe(200);
    const agentNames = resB.body.data.map((a: any) => a.name);
    expect(agentNames).not.toContain('Alpha Confidential Agent');
  });
});
