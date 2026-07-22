import Resource, { RESOURCE_TYPES } from "./resource.model.js";
import { detectMimeType } from "../../common/helpers/asset.helper.js";
import {
  resolveParentFolder,
  parseOptionalResourceId,
  createFileResource,
  replaceFileResource,
  deleteFileResource,
  deleteFolderResource,
} from "./resource.service.js";
import { PERMISSIONS, hasPermission } from "./permissions.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../common/errors/AppError.js";
import { RESOURCE_ACTIVITY_ACTIONS } from "./resourceActivity.constants.js";
import { logResourceActivity } from "./resourceActivity.service.js";

const assertCanManageFile = (resource, user, projectMember) => {
  if (user.isSuperAdmin) return true;

  const ownerId = resource.owner?._id || resource.owner;
  const isOwner = ownerId && String(ownerId) === String(user._id);

  if (isOwner && hasPermission(projectMember?.role, PERMISSIONS.DELETE_OWN)) {
    return true;
  }

  return hasPermission(projectMember?.role, PERMISSIONS.DELETE_ANY);
};

const listResources = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const resourceId = parseOptionalResourceId(req.query.resourceId);

    const resources = await Resource.find({
      projectId,
      parentId: resourceId || null,
    })
      .sort({ type: 1, name: 1 })
      .populate("owner", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({ resources });
  } catch (error) {
    next(error);
  }
};

const createFolder = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { name, resourceId } = req.body;

    const parentFolder = await resolveParentFolder(projectId, resourceId);

    const resource = await Resource.create({
      projectId,
      parentId: parentFolder,
      type: RESOURCE_TYPES.FOLDER,
      name,
      createdBy: req.user._id,
    });

    await logResourceActivity({
      projectId,
      action: RESOURCE_ACTIVITY_ACTIONS.FOLDER_CREATED,
      resourceId: resource._id,
      resourceType: RESOURCE_TYPES.FOLDER,
      resourceName: resource.name,
      parentId: parentFolder,
      performedBy: req.user._id,
    });

    res.status(201).json({
      message: "Folder created successfully",
      resource,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new ConflictError({
          name: ["A folder with this name already exists here"],
        })
      );
    }
    next(error);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return next(new BadRequestError("Please upload a file"));
    }

    const projectId = req.project._id;
    const parentId = await resolveParentFolder(
      projectId,
      req.body.resourceId || req.query.resourceId || null
    );

    const resource = await createFileResource({
      buffer: req.file.buffer,
      sizeBytes: req.file.size,
      mimeType: detectMimeType(req.file),
      originalFilename: req.file.originalname,
      ownerId: req.user._id,
      createdBy: req.user._id,
      projectId,
      parentId,
    });

    await logResourceActivity({
      projectId,
      action: RESOURCE_ACTIVITY_ACTIONS.FILE_UPLOADED,
      resourceId: resource._id,
      resourceType: RESOURCE_TYPES.FILE,
      resourceName: resource.name,
      parentId,
      performedBy: req.user._id,
      metadata: {
        originalFilename: resource.originalFilename,
        mimeType: resource.mimeType,
        sizeBytes: resource.sizeBytes,
      },
    });

    res.status(201).json({
      message: "File uploaded successfully",
      resource,
    });
  } catch (error) {
    next(error);
  }
};

const getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      projectId: req.project._id,
    })
      .populate("owner", "name email")
      .populate("createdBy", "name email")
      .lean();

    if (!resource) {
      return next(new NotFoundError("Resource not found"));
    }

    if (resource.type === RESOURCE_TYPES.FILE) {
      return res.status(200).json({ resource });
    }

    res.status(200).json({
      resource: {
        _id: resource._id,
        projectId: resource.projectId,
        parentId: resource.parentId,
        type: resource.type,
        name: resource.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

const renameResource = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { name } = req.body;

    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      projectId,
    });

    if (!resource) {
      return next(new NotFoundError("Resource not found"));
    }

    const previousName = resource.name;
    resource.name = name;
    await resource.save();

    await logResourceActivity({
      projectId,
      action: RESOURCE_ACTIVITY_ACTIONS.RESOURCE_RENAMED,
      resourceId: resource._id,
      resourceType: resource.type,
      resourceName: resource.name,
      parentId: resource.parentId,
      performedBy: req.user._id,
      metadata: { previousName },
    });

    const message =
      resource.type === RESOURCE_TYPES.FOLDER
        ? "Folder renamed successfully"
        : "File renamed successfully";

    res.status(200).json({ message, resource });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new ConflictError({
          name: ["A folder with this name already exists here"],
        })
      );
    }
    next(error);
  }
};

const replaceFileContent = async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      return next(new BadRequestError("Please upload a file"));
    }

    const existing = await Resource.findOne({
      _id: req.params.resourceId,
      projectId: req.project._id,
      type: RESOURCE_TYPES.FILE,
    });

    if (!existing) {
      return next(new NotFoundError("File not found"));
    }

    if (!assertCanManageFile(existing, req.user, req.projectMember)) {
      return next(new ForbiddenError("You do not have access to this file"));
    }

    const newMime = detectMimeType(req.file);

    if (newMime !== existing.mimeType) {
      return next(
        new BadRequestError(
          `MIME type must match the existing file (${existing.mimeType})`
        )
      );
    }

    const updated = await replaceFileResource({
      resource: existing,
      buffer: req.file.buffer,
      sizeBytes: req.file.size,
      mimeType: newMime,
      originalFilename: req.file.originalname,
    });

    await logResourceActivity({
      projectId: req.project._id,
      action: RESOURCE_ACTIVITY_ACTIONS.FILE_REPLACED,
      resourceId: updated._id,
      resourceType: RESOURCE_TYPES.FILE,
      resourceName: updated.name,
      parentId: updated.parentId,
      performedBy: req.user._id,
      metadata: {
        originalFilename: updated.originalFilename,
        mimeType: updated.mimeType,
        sizeBytes: updated.sizeBytes,
      },
    });

    res.status(200).json({
      message: "File updated successfully",
      resource: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteResource = async (req, res, next) => {
  try {
    const existing = await Resource.findOne({
      _id: req.params.resourceId,
      projectId: req.project._id,
    });

    if (!existing) {
      return next(new NotFoundError("Resource not found"));
    }

    if (existing.type === RESOURCE_TYPES.FOLDER) {
      if (
        !req.user.isSuperAdmin &&
        !hasPermission(req.projectMember?.role, PERMISSIONS.UPLOAD)
      ) {
        return next(new ForbiddenError("You do not have permission to delete folders"));
      }
      await deleteFolderResource(existing);
    } else {
      if (!assertCanManageFile(existing, req.user, req.projectMember)) {
        return next(new ForbiddenError("You do not have access to this file"));
      }
      await deleteFileResource(existing);
    }

    await logResourceActivity({
      projectId: req.project._id,
      action: RESOURCE_ACTIVITY_ACTIONS.RESOURCE_DELETED,
      resourceId: existing._id,
      resourceType: existing.type,
      resourceName: existing.name,
      parentId: existing.parentId,
      performedBy: req.user._id,
      metadata: {
        originalFilename: existing.originalFilename,
      },
    });

    res.status(200).json({
      message: "Resource deleted successfully",
      id: existing._id,
    });
  } catch (error) {
    next(error);
  }
};

export {
  listResources,
  createFolder,
  uploadFile,
  getResource,
  renameResource,
  replaceFileContent,
  deleteResource,
};
