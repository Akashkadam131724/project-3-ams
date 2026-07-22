import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { BadRequestError, NotFoundError } from "../../common/errors/AppError.js";
import { getMediaResourceType } from "../../common/helpers/asset.helper.js";
import logger from "../../common/helpers/logger.js";
import {
  getS3Client,
  getBucket,
  resolveObjectKey,
  publicObjectUrl,
} from "../../common/config/s3.js";

const mapS3Error = (error, fallback = "S3 operation failed") => {
  logger.error("S3 error:", {
    name: error?.name,
    message: error?.message,
    httpStatusCode: error?.$metadata?.httpStatusCode,
  });

  if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
    return new NotFoundError("Object not found in S3");
  }

  if (
    error?.name === "InvalidAccessKeyId" ||
    error?.name === "SignatureDoesNotMatch" ||
    error?.$metadata?.httpStatusCode === 403
  ) {
    return new BadRequestError(
      "S3 auth failed (403). Check AWS credentials and bucket IAM policy."
    );
  }

  return new BadRequestError(`S3: ${error?.message || fallback}`);
};

const putObject = async ({ buffer, objectKey, mimeType }) => {
  const client = getS3Client();
  const bucket = getBucket();

  const contentType = mimeType || "application/octet-stream";
  const params = {
    Bucket: bucket,
    Key: objectKey,
    Body: buffer,
    ContentType: contentType,
  };

  if (contentType === "application/pdf") {
    params.ContentDisposition = "inline";
  }

  return client.send(new PutObjectCommand(params));
};

/**
 * @returns {{ key, url, size, provider, resourceType, mimeType }}
 */
export const upload = async ({ buffer, key, mimeType }) => {
  const objectKey = resolveObjectKey(key);
  const resourceType = getMediaResourceType(mimeType);

  try {
    const result = await putObject({ buffer, objectKey, mimeType });

    return {
      key: objectKey,
      url: publicObjectUrl(objectKey),
      size: buffer.length,
      provider: "s3",
      resourceType,
      mimeType,
      etag: result.ETag,
    };
  } catch (error) {
    throw mapS3Error(error, "upload failed");
  }
};

export const replace = async ({ buffer, key, mimeType, resourceType: _rt }) => {
  const objectKey = resolveObjectKey(key);
  const resourceType = getMediaResourceType(mimeType);

  try {
    const result = await putObject({ buffer, objectKey, mimeType });

    return {
      key: objectKey,
      url: publicObjectUrl(objectKey),
      size: buffer.length,
      provider: "s3",
      resourceType,
      mimeType,
      etag: result.ETag,
    };
  } catch (error) {
    throw mapS3Error(error, "replace failed");
  }
};

export const remove = async (key) => {
  const client = getS3Client();
  const bucket = getBucket();
  const objectKey = resolveObjectKey(key);

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      })
    );

    return { ok: true, key: objectKey, provider: "s3" };
  } catch (error) {
    throw mapS3Error(error, "delete failed");
  }
};

export const ping = async () => {
  const client = getS3Client();
  const bucket = getBucket();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));

    return {
      ok: true,
      provider: "s3",
      bucket,
      region: process.env.AWS_REGION?.trim(),
    };
  } catch (error) {
    throw mapS3Error(error, "ping failed");
  }
};

export const pingUpload = async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );

  const key = `ams/_health/${Date.now()}-ping`;

  try {
    const uploaded = await upload({
      buffer: png,
      key,
      mimeType: "image/png",
    });

    await remove(uploaded.key);

    return {
      ok: true,
      provider: "s3",
      uploadOk: true,
      testedKey: uploaded.key,
    };
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError) {
      throw error;
    }
    throw mapS3Error(error, "ping upload failed");
  }
};

export default { upload, replace, remove, ping, pingUpload };
