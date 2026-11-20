export enum OrgRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  WAITING_APPROVAL = 'waiting_approval',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum ExecutionStepType {
  THOUGHT = 'thought',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  APPROVAL_REQUEST = 'approval_request',
  AGENT_HANDOFF = 'agent_handoff',
  FINAL_OUTPUT = 'final_output',
  ERROR = 'error',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum ActionType {
  SEND_EMAIL = 'send_email',
  EXTERNAL_API_MUTATION = 'external_api_mutation',
  DATA_DELETION = 'data_deletion',
  UPDATE_RECORDS = 'update_records',
  PAID_OPERATION = 'paid_operation',
  CODE_EXECUTION = 'code_execution',
}

export enum WorkflowNodeType {
  START = 'start',
  END = 'end',
  AGENT = 'agent',
  SUPERVISOR = 'supervisor',
  CONDITION = 'condition',
  APPROVAL = 'approval',
  DELAY = 'delay',
  TOOL = 'tool',
  INPUT = 'input',
  OUTPUT = 'output',
  NOTIFICATION = 'notification',
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum IntegrationProvider {
  OPENAI = 'openai',
  SMTP = 'smtp',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  STRIPE = 'stripe',
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

export enum DocumentProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}
