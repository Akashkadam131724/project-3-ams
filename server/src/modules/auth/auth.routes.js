import express from "express";

import { login, logout, me } from "./auth.controller.js";
import validate from "../../common/middlewares/validate.middleware.js";
import protect from "./auth.middleware.js";
import { loginSchema } from "./auth.validator.js";

const router = express.Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

export default router;
