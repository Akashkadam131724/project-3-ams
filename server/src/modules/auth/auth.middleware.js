import User from "../users/user.model.js";
import { UnauthorizedError, ForbiddenError } from "../../common/errors/AppError.js";
import {
  getAccessTokenFromRequest,
  verifyAccessToken,
} from "./jwt.helper.js";

const loadUserFromRequest = async (req) => {
  const token = getAccessTokenFromRequest(req);
  if (!token) return null;

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.userId).select("-password");
  if (!user || user.isDisabled) return null;
  return user;
};
const protect = async (req, res, next) => {
  try {
    const user = await loadUserFromRequest(req);

    if (!user) {
      return next(new UnauthorizedError("Please log in to continue"));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    next(error);
  }
};

/** For browser pages (e.g. Swagger) — redirect to login instead of JSON 401 */
export const requireAuthOrRedirect = async (req, res, next) => {
  try {
    const user = await loadUserFromRequest(req);
    if (!user) {
      return res.redirect("/login");
    }
    req.user = user;
    next();
  } catch {
    return res.redirect("/login");
  }
};

export default protect;
