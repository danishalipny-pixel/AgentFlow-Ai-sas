import mongoose, { Document, Schema } from 'mongoose';
import { PlanTier } from '@agentflow/shared';

export interface ISubscription extends Document {
  organizationId: mongoose.Types.ObjectId;
  plan: PlanTier;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.values(PlanTier),
      default: PlanTier.FREE,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled'],
      default: 'active',
      index: true,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    limits: {
      maxAgents: { type: Number, default: 3 },
      maxTasksPerMonth: { type: Number, default: 50 },
      maxStorageMb: { type: Number, default: 50 },
      maxTeamMembers: { type: Number, default: 2 },
    },
    currentUsage: {
      agentsCount: { type: Number, default: 0 },
      tasksThisMonth: { type: Number, default: 0 },
      storageUsedMb: { type: Number, default: 0 },
      teamMembersCount: { type: Number, default: 1 },
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

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
