import { ForbiddenError } from "../../common/errors/AppError.js";

const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return next(new ForbiddenError("Only Super Admin can perform this action"));
  }
  next();
};

export default requireSuperAdmin;
