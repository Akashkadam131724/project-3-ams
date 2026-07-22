import express from "express";

import {
  createProject,
  assignProjectOwner,
  removeProjectOwner,
  getProjects,
  getProjectById,
  getProjectMembers,
} from "./project.controller.js";
import {
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  listMemberCandidates,
} from "./projectMember.controller.js";
import { listResourceActivity } from "./resourceActivity.controller.js";
import { listMemberActivity } from "./memberActivity.controller.js";
import {
  listResources,
  createFolder,
  uploadFile,
  getResource,
  renameResource,
  replaceFileContent,
  deleteResource,
} from "./resource.controller.js";
import protect from "../auth/auth.middleware.js";
import requireSuperAdmin from "../users/requireSuperAdmin.middleware.js";
import validate from "../../common/middlewares/validate.middleware.js";
import upload from "../../common/middlewares/upload.middleware.js";
import { requireProjectAccess } from "./project.middleware.js";
import { PERMISSIONS } from "./permissions.js";
import {
  createProjectSchema,
  assignProjectOwnerSchema,
} from "./project.validator.js";
import {
  createFolderSchema,
  renameResourceSchema,
} from "./resource.validator.js";
import {
  addProjectMemberSchema,
  updateProjectMemberSchema,
} from "./projectMember.validator.js";

const router = express.Router();

router.use(protect);

router.get("/", getProjects);

router.post(
  "/",
  requireSuperAdmin,
  validate(createProjectSchema),
  createProject
);

router.get(
  "/:id/resources",
  requireProjectAccess(PERMISSIONS.VIEW),
  listResources
);
router.post(
  "/:id/resources/folder",
  requireProjectAccess(PERMISSIONS.UPLOAD),
  validate(createFolderSchema),
  createFolder
);
router.post(
  "/:id/resources/file",
  requireProjectAccess(PERMISSIONS.UPLOAD),
  upload.single("file"),
  uploadFile
);
router.get(
  "/:id/resources/:resourceId",
  requireProjectAccess(PERMISSIONS.VIEW),
  getResource
);
router.patch(
  "/:id/resources/:resourceId",
  requireProjectAccess(PERMISSIONS.UPLOAD),
  validate(renameResourceSchema),
  renameResource
);
router.put(
  "/:id/resources/:resourceId",
  requireProjectAccess(PERMISSIONS.UPLOAD),
  upload.single("file"),
  replaceFileContent
);
router.delete(
  "/:id/resources/:resourceId",
  requireProjectAccess(),
  deleteResource
);

router.get(
  "/:id/activity",
  requireProjectAccess(PERMISSIONS.VIEW_ACTIVITY),
  listResourceActivity
);

router.get(
  "/:id/members/activity",
  requireProjectAccess(PERMISSIONS.VIEW_ACTIVITY),
  listMemberActivity
);
router.get(
  "/:id/members/candidates",
  requireProjectAccess(),
  listMemberCandidates
);
router.get("/:id/members", getProjectMembers);
router.post(
  "/:id/members",
  requireProjectAccess(),
  validate(addProjectMemberSchema),
  addProjectMember
);
router.patch(
  "/:id/members/:memberId",
  requireProjectAccess(),
  validate(updateProjectMemberSchema),
  updateProjectMember
);
router.delete(
  "/:id/members/:memberId",
  requireProjectAccess(),
  removeProjectMember
);
router.get("/:id", getProjectById);

router.post(
  "/:id/owner",
  requireSuperAdmin,
  validate(assignProjectOwnerSchema),
  assignProjectOwner
);
router.delete("/:id/owner", requireSuperAdmin, removeProjectOwner);

export default router;
