import { Schema, model } from "mongoose";

export const RESOURCE_TYPES = {
  FOLDER: "folder",
  FILE: "file",
};

const resourceSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(RESOURCE_TYPES),
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalFilename: { type: String, trim: true },
    publicUrl: { type: String, trim: true },
    storageKey: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    sizeBytes: { type: Number },
    mediaCategory: {
      type: String,
      enum: ["image", "video", "raw"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ projectId: 1, parentId: 1, type: 1, createdAt: -1 });
resourceSchema.index(
  { projectId: 1, parentId: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: { type: RESOURCE_TYPES.FOLDER },
  }
);
resourceSchema.index({ storageKey: 1 }, { unique: true, sparse: true });
resourceSchema.index({ publicUrl: 1 }, { unique: true, sparse: true });

const Resource = model("Resource", resourceSchema);

export default Resource;
