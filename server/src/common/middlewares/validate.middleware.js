import { formatValidationError } from "../helpers/validation.helper.js";
import { ValidationError } from "../errors/AppError.js";

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError(formatValidationError(result.error)));
  }

  req.body = result.data;
  next();
};

export default validate;
