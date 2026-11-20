import mongoose, { Document, Schema } from 'mongoose';
import { IntegrationProvider, IntegrationStatus } from '@agentflow/shared';

export interface IIntegration extends Document {
  organizationId: mongoose.Types.ObjectId;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  encryptedCredentials?: string;
  config: Record<string, any>;
  scopes: string[];
  lastTestedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IIntegration>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: Object.values(IntegrationProvider),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(IntegrationStatus),
      default: IntegrationStatus.DISCONNECTED,
      index: true,
    },
    encryptedCredentials: {
      type: String,
      select: false,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    scopes: {
      type: [String],
      default: [],
    },
    lastTestedAt: {
      type: Date,
    },
    errorMessage: {
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
        delete ret.encryptedCredentials;
        return ret;
      },
    },
  }
);

IntegrationSchema.index({ organizationId: 1, provider: 1 }, { unique: true });

export const Integration = mongoose.model<IIntegration>('Integration', IntegrationSchema);
