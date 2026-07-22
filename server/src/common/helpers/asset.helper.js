import path from "path";
import mime from "mime-types";
import mongoose from "mongoose";

export const detectMimeType = (file) =>
  file?.mimetype || mime.lookup(file?.originalname) || "application/octet-stream";

export const getBaseNameFromFilename = (originalFilename) =>
  path.parse(originalFilename).name;

/** Safe trailing segment for S3 keys: base name + extension (from filename or MIME). */
export const buildStorageFileSuffix = (originalFilename, mimeType = "") => {
  const parsed = path.parse(originalFilename || "file");
  let ext = parsed.ext?.toLowerCase() || "";
  if (!ext && mimeType) {
    const fromMime = mime.extension(mimeType);
    if (fromMime) ext = `.${fromMime}`;
  }

  let base = (parsed.name || "file").trim() || "file";
  base = base.replace(/[/\\?%*:|"<>#&]/g, "_").replace(/\s+/g, " ").slice(0, 200);

  return `${base}${ext}`;
};

/** Broad media category stored on asset records (image | video | raw). */
export const getMediaResourceType = (mimeType = "") => {
  if (mimeType === "application/pdf" || mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "video";
  return "raw";
};

/**
 * Stable S3 key segment (before S3_KEY_PREFIX is applied in config/s3.js).
 * Uses project + folder IDs only — folder rename does not change keys.
 *
 * Examples:
 *   projects/{projectId}/objects/{objectId}/report.pdf
 *   projects/{projectId}/folders/{folderId}/objects/{objectId}/logo.png
 */
export const buildProjectObjectKey = ({
  projectId,
  folderId,
  objectId,
  originalFilename,
  mimeType,
}) => {
  const id = objectId || new mongoose.Types.ObjectId();
  const segments = ["projects", String(projectId)];

  if (folderId) {
    segments.push("folders", String(folderId));
  }

  segments.push("objects", String(id));

  if (originalFilename) {
    segments.push(buildStorageFileSuffix(originalFilename, mimeType));
  }

  return { storageKey: segments.join("/"), objectId: id };
};
