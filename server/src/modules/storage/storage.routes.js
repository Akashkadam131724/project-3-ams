import express from "express";
import {
  checkStorage,
  checkStorageUpload,
} from "./storage.controller.js";

const router = express.Router();

// No auth — diagnostic only (no secrets returned)
router.get("/health", checkStorage);
router.get("/health/upload", checkStorageUpload);

export default router;
