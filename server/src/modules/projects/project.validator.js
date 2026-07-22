import { z } from "zod/v4";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Project name should be at least 3 characters")
    .max(100, "Project name can be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description can be at most 500 characters")
    .optional(),
  ownerId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid owner user ID")
    .optional(),
});

export const assignProjectOwnerSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID"),
});
