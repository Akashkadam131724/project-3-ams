/** @typedef {"name" | "type" | "modified" | "created" | "size" | "creator"} ResourceListSortField */
/** @typedef {"asc" | "desc"} ResourceListSortOrder */

export const RESOURCE_LIST_SORT_FIELDS = [
  "name",
  "type",
  "modified",
  "created",
  "size",
  "creator",
];

export const RESOURCE_LIST_SORT_ORDERS = ["asc", "desc"];

export const DEFAULT_RESOURCE_PAGE_SIZE = 10;
export const MAX_RESOURCE_PAGE_SIZE = 100;
export const DEFAULT_RESOURCE_SORT_BY = "name";
export const DEFAULT_RESOURCE_SORT_ORDER = "asc";
