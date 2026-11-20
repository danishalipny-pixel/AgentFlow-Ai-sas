import mongoose, { Document, Schema } from 'mongoose';
import { ExecutionStepType } from '@agentflow/shared';

export interface IExecutionStep extends Document {
  executionId: mongoose.Types.ObjectId;
  stepNumber: number;
  agentId?: mongoose.Types.ObjectId;
  agentName?: string;
  nodeId?: string;
  stepType: ExecutionStepType;
  title: string;
  inputPayload?: any;
  outputPayload?: any;
  error?: string;
  durationMs: number;
  tokensUsed?: number;
  createdAt: Date;
}

const ExecutionStepSchema = new Schema<IExecutionStep>(
  {
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true,
    },
    stepNumber: {
      type: Number,
      required: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    agentName: {
      type: String,
    },
    nodeId: {
      type: String,
    },
    stepType: {
      type: String,
      enum: Object.values(ExecutionStepType),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    inputPayload: {
      type: Schema.Types.Mixed,
    },
    outputPayload: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    tokensUsed: {
      type: Number,
      default: 0,
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

ExecutionStepSchema.index({ executionId: 1, stepNumber: 1 });

export const ExecutionStep = mongoose.model<IExecutionStep>('ExecutionStep', ExecutionStepSchema);
