export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AGENTFLOW AI — REST API',
    version: '1.0.0',
    description: 'Enterprise Multi-Tenant AI Agent Workforce & Orchestration Platform API',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'AgentFlow AI API v1',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      OrganizationHeader: {
        name: 'x-organization-id',
        in: 'header',
        required: false,
        schema: { type: 'string' },
        description: 'Target tenant organization identifier',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new user and default organization',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  organizationName: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Registration successful' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Log in with email and password',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve current authenticated user and organizations',
        tags: ['Authentication'],
        responses: { 200: { description: 'Current user profile' } },
      },
    },
    '/agents': {
      get: {
        summary: 'List agents for the active tenant',
        tags: ['Agents'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'List of agents' } },
      },
      post: {
        summary: 'Create custom agent in tenant',
        tags: ['Agents'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 201: { description: 'Agent created' } },
      },
    },
    '/tasks': {
      get: {
        summary: 'List tasks with filtering and pagination',
        tags: ['Tasks'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'List of tasks' } },
      },
      post: {
        summary: 'Dispatch an autonomous task',
        tags: ['Tasks'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 201: { description: 'Task queued for execution' } },
      },
    },
    '/approvals': {
      get: {
        summary: 'List pending or resolved human approvals',
        tags: ['Human Approvals'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'List of approvals' } },
      },
    },
    '/approvals/{approvalId}/resolve': {
      post: {
        summary: 'Approve or reject a sensitive agent action',
        tags: ['Human Approvals'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'Approval decision recorded' } },
      },
    },
    '/workflows': {
      get: {
        summary: 'List visual workflows',
        tags: ['Workflows'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'List of workflows' } },
      },
    },
    '/tools': {
      get: {
        summary: 'List registered tools',
        tags: ['Tools'],
        responses: { 200: { description: 'List of registered tools' } },
      },
    },
    '/knowledge': {
      get: {
        summary: 'List knowledge base documents',
        tags: ['Knowledge Base'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'List of documents' } },
      },
    },
    '/analytics/overview': {
      get: {
        summary: 'Get telemetry, usage trends, and cost analytics',
        tags: ['Analytics'],
        parameters: [{ $ref: '#/components/parameters/OrganizationHeader' }],
        responses: { 200: { description: 'Analytics overview' } },
      },
    },
  },
};
