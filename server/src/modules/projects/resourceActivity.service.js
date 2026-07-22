import ResourceActivity from "./resourceActivity.model.js";
import logger from "../../common/helpers/logger.js";

export const logResourceActivity = async (entry) => {
  try {
    await ResourceActivity.create(entry);
  } catch (error) {
    logger.warn("Failed to write resource activity log:", error?.message);
  }
};
