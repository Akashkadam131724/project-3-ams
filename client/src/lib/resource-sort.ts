import { resourceUserLabel } from "@/lib/resource-meta";
import type { Resource } from "@/lib/types";

export type ResourceSortField =
  | "name"
  | "type"
  | "modified"
  | "created"
  | "size"
  | "creator";

export type ResourceSortDirection = "asc" | "desc";

export const RESOURCE_SORT_FIELDS: {
  id: ResourceSortField;
  label: string;
}[] = [
  { id: "name", label: "Name" },
  { id: "type", label: "Type" },
  { id: "modified", label: "Modified" },
  { id: "created", label: "Created" },
  { id: "size", label: "Size" },
  { id: "creator", label: "Created by" },
];

const STORAGE_KEY = "ams-resource-sort";

export type ResourceSortState = {
  field: ResourceSortField;
  direction: ResourceSortDirection;
};

export const DEFAULT_RESOURCE_SORT: ResourceSortState = {
  field: "name",
  direction: "asc",
};

export function defaultDirectionForField(
  field: ResourceSortField
): ResourceSortDirection {
  switch (field) {
    case "modified":
    case "created":
    case "size":
      return "desc";
    default:
      return "asc";
  }
}

function timeValue(iso?: string) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function modifiedTime(r: Resource) {
  return timeValue(r.updatedAt || r.createdAt);
}

function creatorKey(r: Resource) {
  return resourceUserLabel(r.createdBy).toLowerCase();
}

export function sortResources(
  items: Resource[],
  field: ResourceSortField,
  direction: ResourceSortDirection
): Resource[] {
  const mult = direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;
      case "type":
        cmp =
          (a.type === "folder" ? 0 : 1) - (b.type === "folder" ? 0 : 1);
        break;
      case "modified":
        cmp = modifiedTime(a) - modifiedTime(b);
        break;
      case "created":
        cmp = timeValue(a.createdAt) - timeValue(b.createdAt);
        break;
      case "size":
        cmp = (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
        break;
      case "creator":
        cmp = creatorKey(a).localeCompare(creatorKey(b));
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return cmp * mult;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function isSortField(v: string): v is ResourceSortField {
  return RESOURCE_SORT_FIELDS.some((f) => f.id === v);
}

export function readResourceSort(): ResourceSortState {
  if (typeof window === "undefined") return DEFAULT_RESOURCE_SORT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESOURCE_SORT;
    const parsed = JSON.parse(raw) as ResourceSortState;
    if (
      !parsed ||
      !isSortField(parsed.field) ||
      (parsed.direction !== "asc" && parsed.direction !== "desc")
    ) {
      return DEFAULT_RESOURCE_SORT;
    }
    return parsed;
  } catch {
    return DEFAULT_RESOURCE_SORT;
  }
}

export function writeResourceSort(state: ResourceSortState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
