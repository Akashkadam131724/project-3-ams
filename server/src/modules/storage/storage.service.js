import * as s3Storage from "./s3.storage.js";

export const uploadToStorage = (payload) => s3Storage.upload(payload);
export const replaceInStorage = (payload) => s3Storage.replace(payload);
export const removeFromStorage = (key) => s3Storage.remove(key);
export const pingStorage = () => s3Storage.ping();
export const pingStorageUpload = () => s3Storage.pingUpload();
