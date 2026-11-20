import mongoose, { Schema } from 'mongoose';

export interface IAgent {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  role: string;
  description: string;
  avatar: string;
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
  creatorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
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
    role: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'Bot',
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'gpt-4o-mini',
    },
    temperature: {
      type: Number,
      min: 0.0,
      max: 1.0,
      default: 0.2,
    },
    maxExecutionSteps: {
      type: Number,
      min: 1,
      max: 100,
      default: 15,
    },
    timeoutSeconds: {
      type: Number,
      min: 10,
      max: 900,
      default: 180,
    },
    tokenBudget: {
      type: Number,
      default: 16000,
    },
    toolsAllowed: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isTemplate: {
      type: Boolean,
      default: false,
      index: true,
    },
    templateCategory: {
      type: String,
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
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

AgentSchema.index({ organizationId: 1, name: 1 });

export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);
