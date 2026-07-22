import { Schema, model } from "mongoose";
import { PROJECT_ROLES } from "./permissions.js";

const projectMemberSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(PROJECT_ROLES),
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

projectMemberSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const ProjectMember = model("ProjectMember", projectMemberSchema);

export default ProjectMember;
