import { z } from 'zod';
import { OrgRole, TaskPriority, ActionType, WorkflowNodeType } from './enums';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(50),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
});

export const updateOrganizationSettingsSchema = z.object({
  requireApprovalForTools: z.boolean().optional(),
  domainAllowlist: z.array(z.string()).optional(),
  maxConcurrentTasks: z.number().int().min(1).max(50).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(OrgRole),
});

export const createAgentSchema = z.object({
  name: z.string().min(2, 'Agent name must be at least 2 characters').max(60),
  role: z.string().min(2, 'Role must be at least 2 characters').max(60),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  avatar: z.string().optional().default('Bot'),
  systemPrompt: z.string().min(10, 'System instructions must be at least 10 characters'),
  model: z.string().min(1, 'Model selection is required'),
  temperature: z.number().min(0.0).max(1.0).default(0.2),
  maxExecutionSteps: z.number().int().min(1).max(100).default(15),
  timeoutSeconds: z.number().int().min(10).max(900).default(180),
  tokenBudget: z.number().int().min(1000).max(128000).default(16000),
  toolsAllowed: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  templateCategory: z.string().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assignedAgentId: z.string().optional(),
  assignedTeamIds: z.array(z.string()).optional(),
  workflowId: z.string().optional(),
  inputParameters: z.record(z.any()).optional().default({}),
  deadline: z.string().datetime().optional(),
});

export const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(WorkflowNodeType),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    agentId: z.string().optional(),
    toolName: z.string().optional(),
    conditionExpression: z.string().optional(),
    actionType: z.nativeEnum(ActionType).optional(),
    delayMs: z.number().optional(),
    promptTemplate: z.string().optional(),
    config: z.record(z.any()).optional(),
  }),
});

export const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: stringOrUndefined(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});

function stringOrUndefined() {
  return z.string();
}

export const createWorkflowSchema = z.object({
  name: z.string().min(2, 'Workflow name must be at least 2 characters').max(80),
  description: z.string().max(500).optional().default(''),
  nodes: z.array(workflowNodeSchema).min(1, 'At least one node is required'),
  edges: z.array(workflowEdgeSchema),
  isActive: z.boolean().default(true),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();

export const approvalDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(500).optional(),
});

export const runToolRequestSchema = z.object({
  toolName: z.string(),
  parameters: z.record(z.any()),
});
