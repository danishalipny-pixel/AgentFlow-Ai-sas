import mongoose, { Document, Schema } from 'mongoose';

export interface IToolDefinition extends Document {
  name: string;
  displayName: string;
  category: string;
  description: string;
  parametersSchema: Record<string, any>;
  requiresApproval: boolean;
  isBuiltin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ToolDefinitionSchema = new Schema<IToolDefinition>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    parametersSchema: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    isBuiltin: {
      type: Boolean,
      default: true,
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

export const ToolDefinition = mongoose.model<IToolDefinition>('ToolDefinition', ToolDefinitionSchema);
