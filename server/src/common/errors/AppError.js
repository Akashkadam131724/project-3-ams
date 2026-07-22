// errorType tells the frontend HOW to display the error:
// - "field"   → show under form inputs (errors keyed by field name)
// - "general" → toast / banner / page message (not tied to a field)

export class AppError extends Error {
  constructor(message, statusCode = 500, errorType = "general") {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isOperational = true;
  }
}

// Show under form fields
export class ValidationError extends AppError {
  constructor(errors) {
    super("Validation failed", 400, "field");
    this.errors = errors;
  }
}

// Also field-level (e.g. duplicate email under the email input)
export class ConflictError extends AppError {
  constructor(errors) {
    super("Conflict", 409, "field");
    this.errors = errors;
  }
}

// General errors — toast / alert, not under fields
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "general");
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, "general");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "general");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "general");
  }
}
