import { Schema, model } from "mongoose";
import { RESOURCE_ACTIVITY_ACTIONS } from "./resourceActivity.constants.js";

const resourceActivitySchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(RESOURCE_ACTIVITY_ACTIONS),
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
    },
    resourceType: {
      type: String,
      enum: ["folder", "file"],
      required: true,
    },
    resourceName: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Resource",
      default: null,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

resourceActivitySchema.index({ projectId: 1, createdAt: -1 });

const ResourceActivity = model("ResourceActivity", resourceActivitySchema);

export default ResourceActivity;
