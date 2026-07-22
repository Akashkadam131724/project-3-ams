import multer from "multer";

// Buffer in memory → upload to S3 (no local disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

export default upload;
