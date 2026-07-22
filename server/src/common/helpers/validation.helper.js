import { z } from "zod/v4";

export const formatValidationError = (error) => {
  return z.flattenError(error).fieldErrors;
};
