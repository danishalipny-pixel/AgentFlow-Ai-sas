import mongoose, { Document, Schema } from 'mongoose';
import { TaskPriority, TaskStatus } from '@agentflow/shared';

export interface ITask extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedAgentId?: mongoose.Types.ObjectId;
  assignedTeamIds?: mongoose.Types.ObjectId[];
  workflowId?: mongoose.Types.ObjectId;
  inputParameters?: Record<string, any>;
  outputData?: any;
  error?: string;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimateUSD: number;
  deadline?: Date;
  latestExecutionId?: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      index: true,
    },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    assignedTeamIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    }],
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
    },
    inputParameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    outputData: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    costEstimateUSD: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
    latestExecutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Execution',
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

TaskSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
