export type User = {
  _id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  isDisabled?: boolean;
};

export type Project = {
  _id: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: ProjectRole;
};

export type ProjectRole =
  | "project_owner"
  | "admin"
  | "editor"
  | "viewer";

export type ProjectMemberRow = {
  _id: string;
  role: ProjectRole;
  permissions: string[];
  user: { _id: string; name: string; email: string };
  createdAt?: string;
};

export type ResourceActivity = {
  _id: string;
  category: "resource";
  projectId: string;
  action: string;
  resourceId?: string;
  resourceType: "folder" | "file";
  resourceName: string;
  parentId?: string | null;
  performedBy: { _id: string; name: string; email: string };
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type MemberActivity = {
  _id: string;
  category: "member";
  projectId: string;
  action: string;
  targetUser?: { _id: string; name: string; email: string };
  role?: string;
  previousRole?: string;
  memberId?: string;
  performedBy: { _id: string; name: string; email: string };
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ProjectActivityItem = ResourceActivity | MemberActivity;

export type ResourceType = "folder" | "file";

export type Resource = {
  _id: string;
  projectId: string;
  parentId: string | null;
  type: ResourceType;
  name: string;
  createdBy?: string | { _id: string; name: string; email: string };
  originalFilename?: string;
  publicUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  mediaCategory?: "image" | "video" | "raw";
  owner?: string | { _id: string; name: string; email: string };
  createdAt?: string;
  updatedAt?: string;
};

export type ApiErrorBody = {
  errorType?: "field" | "general";
  message?: string;
  errors?: Record<string, string[]>;
};

export type ResourceListPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type ResourceListSort = {
  sortBy: string;
  sortOrder: "asc" | "desc";
};
