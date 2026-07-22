import { pingStorage, pingStorageUpload } from "./storage.service.js";

const checkStorage = async (req, res, next) => {
  try {
    const result = await pingStorage();
    res.status(200).json({
      message: "Storage Admin API credentials are valid (ping)",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/** Verifies Upload API with a tiny test image (then deletes it) */
const checkStorageUpload = async (req, res, next) => {
  try {
    const result = await pingStorageUpload();
    res.status(200).json({
      message: "Storage Upload API works",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export { checkStorage, checkStorageUpload };
