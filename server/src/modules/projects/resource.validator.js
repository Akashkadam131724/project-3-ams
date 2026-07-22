import { z } from "zod/v4";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export const createFolderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(120, "Folder name can be at most 120 characters"),
  resourceId: objectId.nullable().optional(),
});

export const renameResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name can be at most 120 characters"),
});
