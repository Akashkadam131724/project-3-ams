import type { ProjectRole } from "./types";

/** Mirrors server CAN_ASSIGN_ROLES (+ global super admin). */
export const ASSIGNABLE_ROLES: Record<string, ProjectRole[]> = {
  global_super_admin: ["admin", "editor", "viewer"],
  project_owner: ["admin", "editor", "viewer"],
  admin: ["editor", "viewer"],
};

export function rolesActorCanAssign(
  isSuperAdmin: boolean,
  projectRole?: ProjectRole | null
): ProjectRole[] {
  if (isSuperAdmin) return ASSIGNABLE_ROLES.global_super_admin;
  if (!projectRole) return [];
  return ASSIGNABLE_ROLES[projectRole] ?? [];
}

export function canViewActivity(
  isSuperAdmin: boolean,
  projectRole?: ProjectRole | null
) {
  if (isSuperAdmin) return true;
  return projectRole === "project_owner" || projectRole === "admin";
}

export const ACTIVITY_LABELS: Record<string, string> = {
  folder_created: "Folder created",
  file_uploaded: "File uploaded",
  resource_renamed: "Renamed",
  file_replaced: "File content updated",
  resource_deleted: "Deleted",
  member_added: "Member added",
  member_role_updated: "Member role updated",
  member_removed: "Member removed",
  owner_assigned: "Project owner assigned",
};

export const ROLE_LABELS: Record<ProjectRole, string> = {
  project_owner: "Project owner",
  admin: "Project admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function isProjectOwnerRole(role: string | null | undefined) {
  return role === "project_owner" || role === "project_super_admin";
}
