import mongoose, { Document, Schema } from 'mongoose';
import { TaskStatus } from '@agentflow/shared';

export interface IExecution extends Document {
  organizationId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  workflowId?: mongoose.Types.ObjectId;
  status: TaskStatus;
  startTime: Date;
  endTime?: Date;
  durationMs: number;
  stepsCount: number;
  totalTokens: number;
  estimatedCostUSD: number;
  logsUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionSchema = new Schema<IExecution>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.RUNNING,
      index: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    stepsCount: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    estimatedCostUSD: {
      type: Number,
      default: 0,
    },
    logsUrl: {
      type: String,
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

ExecutionSchema.index({ organizationId: 1, taskId: 1, createdAt: -1 });

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema);
