import mongoose, { Document, Schema } from 'mongoose';
import { DocumentProcessingStatus } from '@agentflow/shared';

export interface IKnowledgeDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  parsedContent: string;
  chunkCount: number;
  status: DocumentProcessingStatus;
  metadata?: Record<string, any>;
  uploaderId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
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
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    parsedContent: {
      type: String,
      default: '',
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(DocumentProcessingStatus),
      default: DocumentProcessingStatus.PENDING,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    uploaderId: {
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
        delete ret.parsedContent;
        return ret;
      },
    },
  }
);

KnowledgeDocumentSchema.index({ organizationId: 1, title: 'text', parsedContent: 'text' });

export const KnowledgeDocument = mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);
