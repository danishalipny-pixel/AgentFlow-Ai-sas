import mongoose, { Document, Schema } from 'mongoose';
import { ApprovalStatus, ActionType } from '@agentflow/shared';

export interface IApproval extends Document {
  organizationId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  executionId: mongoose.Types.ObjectId;
  stepId?: mongoose.Types.ObjectId;
  requestingAgentId: mongoose.Types.ObjectId;
  requestingAgentName: string;
  actionType: ActionType;
  actionTitle: string;
  actionPayload: Record<string, any>;
  reason: string;
  status: ApprovalStatus;
  decidedByUserId?: mongoose.Types.ObjectId;
  decisionComment?: string;
  decidedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
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
    executionId: {
      type: Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true,
    },
    stepId: {
      type: Schema.Types.ObjectId,
      ref: 'ExecutionStep',
    },
    requestingAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: true,
    },
    requestingAgentName: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: Object.values(ActionType),
      required: true,
      index: true,
    },
    actionTitle: {
      type: String,
      required: true,
    },
    actionPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.PENDING,
      index: true,
    },
    decidedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    decisionComment: {
      type: String,
    },
    decidedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
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

ApprovalSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export const Approval = mongoose.model<IApproval>('Approval', ApprovalSchema);
