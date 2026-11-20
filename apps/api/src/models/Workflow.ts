import mongoose, { Schema } from 'mongoose';
import { WorkflowNode, WorkflowEdge } from '@agentflow/shared';

export interface IWorkflow {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version: number;
  isActive: boolean;
  executionCount: number;
  creatorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    nodes: {
      type: Schema.Types.Mixed as any,
      default: [],
    },
    edges: {
      type: Schema.Types.Mixed as any,
      default: [],
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    executionCount: {
      type: Number,
      default: 0,
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

WorkflowSchema.index({ organizationId: 1, name: 1 });

export const Workflow = mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
