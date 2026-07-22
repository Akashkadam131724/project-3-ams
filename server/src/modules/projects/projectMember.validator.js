import { z } from "zod/v4";
import { PROJECT_ROLES } from "./permissions.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID");

const memberRole = z.enum([
  PROJECT_ROLES.ADMIN,
  PROJECT_ROLES.EDITOR,
  PROJECT_ROLES.VIEWER,
]);

export const addProjectMemberSchema = z.object({
  userId: objectId.optional(),
  email: z.string().email().optional(),
  role: memberRole,
}).refine((data) => data.userId || data.email, {
  message: "Provide userId or email",
});

export const updateProjectMemberSchema = z.object({
  role: memberRole,
});
