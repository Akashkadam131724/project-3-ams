import { Schema, model } from "mongoose";
import { MEMBER_ACTIVITY_ACTIONS } from "./memberActivity.constants.js";

const memberActivitySchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(MEMBER_ACTIVITY_ACTIONS),
      required: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "ProjectMember",
    },
    role: {
      type: String,
      trim: true,
    },
    previousRole: {
      type: String,
      trim: true,
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

memberActivitySchema.index({ projectId: 1, createdAt: -1 });

const ProjectMemberActivity = model("ProjectMemberActivity", memberActivitySchema);

export default ProjectMemberActivity;
