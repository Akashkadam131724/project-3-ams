/**
 * Permission strings must match server `PERMISSIONS` in
 * server/src/modules/projects/permissions.js
 */
export const PROJECT_PERMISSIONS = {
  VIEW_ACTIVITY: "view_activity",
  MANAGE_MEMBERS: "manage_members",
  ASSIGN_PROJECT_ADMIN: "assign_project_admin",
  UPLOAD: "upload",
  DELETE_ANY: "delete_any",
  DELETE_OWN: "delete_own",
  VIEW: "view",
  DOWNLOAD: "download",
} as const;

export type ProjectPermission =
  (typeof PROJECT_PERMISSIONS)[keyof typeof PROJECT_PERMISSIONS];

export function hasProjectPermission(
  permissions: string[] | undefined | null,
  permission: string
) {
  return permissions?.includes(permission) ?? false;
}

/** UI gates should use this + `permissions` from GET /projects/:id */
export function canViewActivity(
  isSuperAdmin: boolean,
  permissions?: string[] | null
) {
  if (isSuperAdmin) return true;
  return hasProjectPermission(
    permissions,
    PROJECT_PERMISSIONS.VIEW_ACTIVITY
  );
}

export function canManageMembers(
  isSuperAdmin: boolean,
  permissions?: string[] | null
) {
  if (isSuperAdmin) return true;
  return (
    hasProjectPermission(permissions, PROJECT_PERMISSIONS.MANAGE_MEMBERS) ||
    hasProjectPermission(
      permissions,
      PROJECT_PERMISSIONS.ASSIGN_PROJECT_ADMIN
    )
  );
}

export function canUpload(
  isSuperAdmin: boolean,
  permissions?: string[] | null
) {
  if (isSuperAdmin) return true;
  return hasProjectPermission(permissions, PROJECT_PERMISSIONS.UPLOAD);
}

export function canDeleteResources(
  isSuperAdmin: boolean,
  permissions?: string[] | null
) {
  if (isSuperAdmin) return true;
  return (
    hasProjectPermission(permissions, PROJECT_PERMISSIONS.DELETE_ANY) ||
    hasProjectPermission(permissions, PROJECT_PERMISSIONS.DELETE_OWN)
  );
}
