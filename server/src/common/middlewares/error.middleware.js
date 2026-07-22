import {
  AppError,
  ValidationError,
  ConflictError,
  BadRequestError,
} from "../errors/AppError.js";

const sendAppError = (res, err) => {
  if (err.errorType === "field") {
    return res.status(err.statusCode).json({
      errorType: "field",
      errors: err.errors,
    });
  }

  return res.status(err.statusCode).json({
    errorType: "general",
    message: err.message,
  });
};

const errorHandler = (err, req, res, next) => {
  console.log(err);

  if (err instanceof AppError) {
    return sendAppError(res, err);
  }

  // MongoDB duplicate key → under the matched form field
  if (err.code === 11000) {
    const errors = Object.keys(err.keyValue || {}).reduce((acc, field) => {
      acc[field] = [`This ${field} already exists`];
      return acc;
    }, {});

    return sendAppError(res, new ConflictError(errors));
  }

  // Mongoose schema validation → under form fields
  if (err.name === "ValidationError") {
    const errors = Object.keys(err.errors || {}).reduce((acc, field) => {
      acc[field] = [err.errors[field].message];
      return acc;
    }, {});

    return sendAppError(res, new ValidationError(errors));
  }

  if (err.name === "CastError") {
    return sendAppError(res, new BadRequestError("Invalid ID"));
  }

  // Invalid JSON body (e.g. trailing commas)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendAppError(
      res,
      new BadRequestError("Invalid JSON body. Check for trailing commas or syntax errors.")
    );
  }

  // Multer upload errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendAppError(res, new BadRequestError("File too large. Max size is 50MB"));
    }
    return sendAppError(res, new BadRequestError(err.message));
  }

  // Upstream SDK HTTP-style errors (e.g. legacy providers)
  if (err.http_code) {
    return sendAppError(
      res,
      new BadRequestError(err.message || `Upstream error (${err.http_code})`)
    );
  }

  res.status(500).json({
    errorType: "general",
    message: "Internal Server Error",
  });
};

export default errorHandler;
