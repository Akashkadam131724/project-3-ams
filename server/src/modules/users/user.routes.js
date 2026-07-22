import express from "express";

import {
  getUsers,
  createUser,
  updateUser,
  getUserProjects,
  setUserDisabled,
} from "./user.controller.js";
import validate from "../../common/middlewares/validate.middleware.js";
import protect from "../auth/auth.middleware.js";
import requireSuperAdmin from "./requireSuperAdmin.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  setUserDisabledSchema,
} from "./user.validator.js";

const router = express.Router();

router.post(
  "/",
  protect,
  requireSuperAdmin,
  validate(createUserSchema),
  createUser
);

// Protected
router.get("/", protect, requireSuperAdmin, getUsers);
router.patch(
  "/:id/disabled",
  protect,
  requireSuperAdmin,
  validate(setUserDisabledSchema),
  setUserDisabled
);
router.get("/:id/projects", protect, getUserProjects);
router.put("/:id", protect, validate(updateUserSchema), updateUser);

export default router;
