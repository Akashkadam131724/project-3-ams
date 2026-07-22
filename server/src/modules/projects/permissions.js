export const PROJECT_ROLES = {
  PROJECT_OWNER: "project_owner",
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
};

/** @deprecated stored value; normalized to project_owner on read */
const LEGACY_PROJECT_OWNER_ROLE = "project_super_admin";

export const PROJECT_OWNER_ROLES = [
  PROJECT_ROLES.PROJECT_OWNER,
  LEGACY_PROJECT_OWNER_ROLE,
];

export const normalizeProjectRole = (role) => {
  if (role === LEGACY_PROJECT_OWNER_ROLE) {
    return PROJECT_ROLES.PROJECT_OWNER;
  }
  return role;
};

export const PERMISSIONS = {
  CREATE_PROJECT: "create_project",
  EDIT_PROJECT: "edit_project",
  DELETE_PROJECT: "delete_project",
  ASSIGN_PROJECT_OWNER: "assign_project_owner",
  ASSIGN_PROJECT_ADMIN: "assign_project_admin",
  MANAGE_MEMBERS: "manage_members",
  UPLOAD: "upload",
  DELETE_ANY: "delete_any",
  DELETE_OWN: "delete_own",
  VIEW: "view",
  DOWNLOAD: "download",
  VIEW_ACTIVITY: "view_activity",
};

// Role → allowed actions (project-scoped)
// CREATE_PROJECT / DELETE_PROJECT / ASSIGN_PROJECT_OWNER → Global Super Admin only
export const ROLE_PERMISSIONS = {
  [PROJECT_ROLES.PROJECT_OWNER]: [
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.ASSIGN_PROJECT_ADMIN,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.UPLOAD,
    PERMISSIONS.DELETE_ANY,
    PERMISSIONS.DELETE_OWN,
    PERMISSIONS.VIEW,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.VIEW_ACTIVITY,
  ],
  [PROJECT_ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.UPLOAD,
    PERMISSIONS.DELETE_ANY,
    PERMISSIONS.DELETE_OWN,
    PERMISSIONS.VIEW,
    PERMISSIONS.DOWNLOAD,
    PERMISSIONS.VIEW_ACTIVITY,
  ],
  [PROJECT_ROLES.EDITOR]: [
    PERMISSIONS.UPLOAD,
    PERMISSIONS.DELETE_OWN,
    PERMISSIONS.VIEW,
    PERMISSIONS.DOWNLOAD,
  ],
  [PROJECT_ROLES.VIEWER]: [PERMISSIONS.VIEW, PERMISSIONS.DOWNLOAD],
};

// Who can assign which roles
export const CAN_ASSIGN_ROLES = {
  // Global super admin handled separately
  [PROJECT_ROLES.PROJECT_OWNER]: [
    PROJECT_ROLES.ADMIN,
    PROJECT_ROLES.EDITOR,
    PROJECT_ROLES.VIEWER,
  ],
  [PROJECT_ROLES.ADMIN]: [PROJECT_ROLES.EDITOR, PROJECT_ROLES.VIEWER],
  [PROJECT_ROLES.EDITOR]: [],
  [PROJECT_ROLES.VIEWER]: [],
};

export const hasPermission = (role, permission) => {
  const normalized = normalizeProjectRole(role);
  return ROLE_PERMISSIONS[normalized]?.includes(permission) ?? false;
};

export const canAssignRole = (actorRole, targetRole) => {
  const actor = normalizeProjectRole(actorRole);
  const target = normalizeProjectRole(targetRole);
  return CAN_ASSIGN_ROLES[actor]?.includes(target) ?? false;
};

export const isProjectOwnerRole = (role) =>
  normalizeProjectRole(role) === PROJECT_ROLES.PROJECT_OWNER;
