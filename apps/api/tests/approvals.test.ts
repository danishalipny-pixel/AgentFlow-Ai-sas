import request from 'supertest';
import { createApp } from '../src/app';
import { TaskStatus, ApprovalStatus } from '@agentflow/shared';

const app = createApp();

describe('Human Approval Checkpoint Engine', () => {
  let userToken: string;
  let orgId: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Security Officer',
      email: 'secops@enterprise.org',
      password: 'Password123!',
      organizationName: 'Secured AI Corp',
    });
    userToken = res.body.data.tokens.accessToken;
    orgId = res.body.data.organization.id;
  });

  it('should halt execution and create an approval request for sensitive outbound actions', async () => {
    // 1. Submit a task with sensitive keyword "send email"
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-organization-id', orgId)
      .send({
        title: 'Dispatch Outbound Follow-up Email to High Value Lead',
        description: 'Analyze customer lead profile and send email with custom contract terms.',
        priority: 'high',
      });

    expect(taskRes.status).toBe(201);
    const taskId = taskRes.body.data.id;

    // Small delay for async execution step
    await new Promise((r) => setTimeout(r, 600));

    // 2. Fetch approvals for organization
    const approvalsRes = await request(app)
      .get('/api/v1/approvals')
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-organization-id', orgId);

    expect(approvalsRes.status).toBe(200);
    expect(approvalsRes.body.data.length).toBeGreaterThan(0);
    const approval = approvalsRes.body.data[0];
    expect(approval.status).toBe(ApprovalStatus.PENDING);
    expect(approval.actionTitle).toContain('Outreach Email');

    // 3. Resolve approval (Approve with comment)
    const resolveRes = await request(app)
      .post(`/api/v1/approvals/${approval.id}/resolve`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-organization-id', orgId)
      .send({
        decision: 'approved',
        comment: 'Verified email body and pricing. Approved for dispatch.',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe(ApprovalStatus.APPROVED);

    // 4. Verify task updated post-approval
    const updatedTask = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .set('x-organization-id', orgId);

    expect([TaskStatus.RUNNING, TaskStatus.COMPLETED]).toContain(updatedTask.body.data.status);
  });
});
