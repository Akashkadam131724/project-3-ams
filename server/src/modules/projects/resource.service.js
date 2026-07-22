import mongoose from "mongoose";
import Resource, { RESOURCE_TYPES } from "./resource.model.js";
import {
  getBaseNameFromFilename,
  buildProjectObjectKey,
  getMediaResourceType,
} from "../../common/helpers/asset.helper.js";
import {
  uploadToStorage,
  removeFromStorage,
} from "../storage/storage.service.js";
import { NotFoundError, BadRequestError } from "../../common/errors/AppError.js";
import logger from "../../common/helpers/logger.js";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

/** Query/body optional folder id (project root when omitted or literal "null"). */
export const parseOptionalResourceId = (value) => {
  if (value === undefined || value === null) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
  if (!OBJECT_ID_RE.test(trimmed)) {
    throw new BadRequestError("Invalid resource id");
  }
  return trimmed;
};

const safeRemoveFromStorage = async (storageKey) => {
  if (!storageKey) return;
  try {
    await removeFromStorage(storageKey);
  } catch (error) {
    logger.warn("S3 cleanup failed (orphan object may remain):", storageKey, error?.message);
  }
};

export const resolveParentFolder = async (projectId, folderId) => {
  const containerId = parseOptionalResourceId(folderId);
  if (!containerId) return null;

  const parent = await Resource.findOne({
    _id: containerId,
    projectId,
    type: RESOURCE_TYPES.FOLDER,
  });

  if (!parent) {
    throw new NotFoundError(
      "Folder not found in this project. Use the folder's _id as resourceId (not its parentId field)."
    );
  }

  return parent._id;
};

export const createFileResource = async ({
  buffer,
  sizeBytes,
  mimeType,
  originalFilename,
  ownerId,
  projectId,
  parentId = null,
  createdBy,
}) => {
  const { storageKey, objectId } = buildProjectObjectKey({
    projectId,
    folderId: parentId,
    originalFilename,
    mimeType,
  });
  let uploaded = null;

  try {
    uploaded = await uploadToStorage({
      buffer,
      key: storageKey,
      mimeType,
    });

    const resource = await Resource.create({
      _id: objectId,
      projectId,
      parentId,
      type: RESOURCE_TYPES.FILE,
      name: getBaseNameFromFilename(originalFilename),
      createdBy,
      originalFilename,
      publicUrl: uploaded.url,
      storageKey: uploaded.key,
      mimeType,
      sizeBytes: uploaded.size || sizeBytes,
      owner: ownerId,
      mediaCategory: getMediaResourceType(mimeType),
    });

    return resource;
  } catch (error) {
    if (uploaded?.key) {
      await safeRemoveFromStorage(uploaded.key);
    }
    throw error;
  }
};

export const replaceFileResource = async ({
  resource,
  buffer,
  sizeBytes,
  mimeType,
  originalFilename,
}) => {
  if (resource.type !== RESOURCE_TYPES.FILE) {
    throw new BadRequestError("Only file resources can be replaced");
  }

  const { storageKey: newStorageKey } = buildProjectObjectKey({
    projectId: resource.projectId,
    folderId: resource.parentId,
    objectId: new mongoose.Types.ObjectId(),
    originalFilename,
    mimeType,
  });
  const oldStorageKey = resource.storageKey;
  let uploaded = null;

  try {
    uploaded = await uploadToStorage({
      buffer,
      key: newStorageKey,
      mimeType,
    });

    const updated = await Resource.findOneAndUpdate(
      { _id: resource._id, type: RESOURCE_TYPES.FILE },
      {
        name: getBaseNameFromFilename(originalFilename),
        originalFilename,
        publicUrl: uploaded.url,
        storageKey: uploaded.key,
        mimeType,
        sizeBytes: uploaded.size || sizeBytes,
        mediaCategory: getMediaResourceType(mimeType),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new NotFoundError("File not found");
    }

    await safeRemoveFromStorage(oldStorageKey);
    return updated;
  } catch (error) {
    if (uploaded?.key) {
      await safeRemoveFromStorage(uploaded.key);
    }
    throw error;
  }
};

export const deleteFileResource = async (resource) => {
  if (resource.type !== RESOURCE_TYPES.FILE) {
    throw new BadRequestError("Not a file resource");
  }

  try {
    await removeFromStorage(resource.storageKey);
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger.warn("S3 object already missing; removing DB record:", resource.storageKey);
    } else {
      throw error;
    }
  }

  await Resource.findByIdAndDelete(resource._id);
  return { deleted: true, id: resource._id };
};

export const deleteFolderResource = async (folder) => {
  if (folder.type !== RESOURCE_TYPES.FOLDER) {
    throw new BadRequestError("Not a folder resource");
  }

  const childCount = await Resource.countDocuments({
    projectId: folder.projectId,
    parentId: folder._id,
  });

  if (childCount > 0) {
    throw new BadRequestError("Folder is not empty. Remove contents first.");
  }

  await Resource.findByIdAndDelete(folder._id);
  return { deleted: true, id: folder._id };
};
