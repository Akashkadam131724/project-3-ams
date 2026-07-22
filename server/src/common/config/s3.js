import { S3Client } from "@aws-sdk/client-s3";
import { BadRequestError } from "../errors/AppError.js";
import logger from "../helpers/logger.js";

let client = null;

export const getS3Client = () => {
  if (client) return client;

  const region = process.env.AWS_REGION?.trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new BadRequestError(
      "S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env"
    );
  }

  client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });

  logger.info(`S3 client ready (region: ${region})`);
  return client;
};

export const getBucket = () => {
  const bucket = process.env.S3_BUCKET_NAME?.trim();
  if (!bucket) {
    throw new BadRequestError("S3_BUCKET_NAME is not set in .env");
  }
  return bucket;
};

/** Relative object keys; S3_KEY_PREFIX is applied in resolveObjectKey */
export const resolveObjectKey = (key) => {
  const clean = String(key || "").replace(/^\/+/, "");
  const prefix = process.env.S3_KEY_PREFIX?.trim()?.replace(/\/+$/, "");
  if (!prefix) return clean;
  if (clean.startsWith(`${prefix}/`)) return clean;
  return `${prefix}/${clean}`;
};

export const publicObjectUrl = (objectKey) => {
  const bucket = getBucket();
  const region = process.env.AWS_REGION?.trim();
  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
};
