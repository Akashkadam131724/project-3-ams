import { z } from "zod/v4";
import {
  DEFAULT_RESOURCE_PAGE_SIZE,
  DEFAULT_RESOURCE_SORT_BY,
  DEFAULT_RESOURCE_SORT_ORDER,
  MAX_RESOURCE_PAGE_SIZE,
  RESOURCE_LIST_SORT_FIELDS,
  RESOURCE_LIST_SORT_ORDERS,
} from "./resource.list.constants.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID");

export { RESOURCE_LIST_SORT_FIELDS };

export const listResourcesQuerySchema = z.object({
  resourceId: objectId.optional(),
  q: z
    .string()
    .trim()
    .max(200, "Search query is too long")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  type: z.enum(["all", "folder", "file"]).optional().default("all"),
  sortBy: z
    .enum(RESOURCE_LIST_SORT_FIELDS)
    .optional()
    .default(DEFAULT_RESOURCE_SORT_BY),
  sortOrder: z
    .enum(RESOURCE_LIST_SORT_ORDERS)
    .optional()
    .default(DEFAULT_RESOURCE_SORT_ORDER),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_RESOURCE_PAGE_SIZE)
    .optional()
    .default(DEFAULT_RESOURCE_PAGE_SIZE),
});

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
