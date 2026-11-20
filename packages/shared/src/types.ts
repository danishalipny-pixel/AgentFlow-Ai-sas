import {
  OrgRole,
  TaskPriority,
  TaskStatus,
  ExecutionStepType,
  ApprovalStatus,
  ActionType,
  WorkflowNodeType,
  PlanTier,
  IntegrationProvider,
  IntegrationStatus,
  DocumentProcessingStatus,
} from './enums';

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPlatformAdmin: boolean;
  defaultOrganizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: PlanTier;
  ownerId: string;
  settings: {
    requireApprovalForTools: boolean;
    domainAllowlist: string[];
    maxConcurrentTasks: number;
    emailNotificationsEnabled: boolean;
  };
  memberCount?: number;
  agentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMemberDTO {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
  invitedBy?: string;
  joinedAt: string;
}

export interface AgentDTO {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  description: string;
  avatar?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxExecutionSteps: number;
  timeoutSeconds: number;
  tokenBudget: number;
  toolsAllowed: string[];
  isActive: boolean;
  isTemplate: boolean;
  templateCategory?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDTO {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgentId?: string;
  assignedAgent?: AgentDTO;
  assignedTeamIds?: string[];
  workflowId?: string;
  inputParameters?: Record<string, any>;
  outputData?: any;
  error?: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimateUSD: number;
  deadline?: string;
  latestExecutionId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStepDTO {
  id: string;
  executionId: string;
  stepNumber: number;
  agentId?: string;
  agentName?: string;
  nodeId?: string;
  stepType: ExecutionStepType;
  title: string;
  inputPayload?: any;
  outputPayload?: any;
  error?: string;
  durationMs: number;
  tokensUsed?: number;
  createdAt: string;
}

export interface ExecutionDTO {
  id: string;
  organizationId: string;
  taskId: string;
  workflowId?: string;
  status: TaskStatus;
  startTime: string;
  endTime?: string;
  durationMs: number;
  stepsCount: number;
  totalTokens: number;
  estimatedCostUSD: number;
  steps?: ExecutionStepDTO[];
  createdAt: string;
}

export interface ApprovalDTO {
  id: string;
  organizationId: string;
  taskId: string;
  executionId: string;
  stepId?: string;
  requestingAgentId: string;
  requestingAgentName?: string;
  actionType: ActionType;
  actionTitle: string;
  actionPayload: Record<string, any>;
  reason: string;
  status: ApprovalStatus;
  decidedByUserId?: string;
  decidedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  decisionComment?: string;
  decidedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface WorkflowNodeData {
  label: string;
  agentId?: string;
  toolName?: string;
  conditionExpression?: string;
  actionType?: ActionType;
  delayMs?: number;
  promptTemplate?: string;
  config?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface WorkflowDTO {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  isActive: boolean;
  executionCount?: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolDefinitionDTO {
  name: string;
  displayName: string;
  category: string;
  description: string;
  parametersSchema: Record<string, any>;
  requiresApproval: boolean;
  isBuiltin: boolean;
}

export interface IntegrationDTO {
  id: string;
  organizationId: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  config: Record<string, any>;
  scopes: string[];
  lastTestedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentDTO {
  id: string;
  organizationId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  chunkCount: number;
  status: DocumentProcessingStatus;
  metadata?: Record<string, any>;
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsOverviewDTO {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingApprovals: number;
  successRate: number;
  avgDurationMs: number;
  totalTokensUsed: number;
  estimatedTotalCostUSD: number;
  usageTrend: Array<{
    date: string;
    tasksCount: number;
    tokensCount: number;
    costUSD: number;
  }>;
  agentPerformance: Array<{
    agentId: string;
    name: string;
    role: string;
    tasksHandled: number;
    successRate: number;
    avgTimeMs: number;
  }>;
}

export interface SubscriptionDTO {
  id: string;
  organizationId: string;
  plan: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  limits: {
    maxAgents: number;
    maxTasksPerMonth: number;
    maxStorageMb: number;
    maxTeamMembers: number;
  };
  currentUsage: {
    agentsCount: number;
    tasksThisMonth: number;
    storageUsedMb: number;
    teamMembersCount: number;
  };
}

export interface AuditLogDTO {
  id: string;
  organizationId: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
