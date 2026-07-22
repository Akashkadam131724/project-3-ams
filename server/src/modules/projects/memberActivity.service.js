import ProjectMemberActivity from "./memberActivity.model.js";
import logger from "../../common/helpers/logger.js";

export const logMemberActivity = async (entry) => {
  try {
    await ProjectMemberActivity.create(entry);
  } catch (error) {
    logger.warn("Failed to write member activity log:", error?.message);
  }
};
