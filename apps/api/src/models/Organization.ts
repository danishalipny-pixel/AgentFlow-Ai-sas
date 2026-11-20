import mongoose, { Document, Schema } from 'mongoose';
import { PlanTier } from '@agentflow/shared';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  plan: PlanTier;
  ownerId: mongoose.Types.ObjectId;
  settings: {
    requireApprovalForTools: boolean;
    domainAllowlist: string[];
    maxConcurrentTasks: number;
    emailNotificationsEnabled: boolean;
  };
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    plan: {
      type: String,
      enum: Object.values(PlanTier),
      default: PlanTier.FREE,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    settings: {
      requireApprovalForTools: {
        type: Boolean,
        default: true,
      },
      domainAllowlist: {
        type: [String],
        default: ['api.github.com', 'en.wikipedia.org', 'news.ycombinator.com', 'httpbin.org'],
      },
      maxConcurrentTasks: {
        type: Number,
        default: 5,
      },
      emailNotificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true,
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

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
