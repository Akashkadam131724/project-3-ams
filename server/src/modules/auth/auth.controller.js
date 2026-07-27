import User from "../users/user.model.js";
import { UnauthorizedError, ForbiddenError } from "../../common/errors/AppError.js";
import {
  signAccessToken,
  setAccessTokenCookie,
  clearAccessTokenCookie,
} from "./jwt.helper.js";

const bootstrapSuperAdmin = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return next(
        new ForbiddenError(
          "Bootstrap is only available when the database has no users. Log in or run npm run seed:superadmin."
        )
      );
    }

    const { name, email, password } = req.body;
    const user = await User.create({
      name,
      email,
      password,
      isSuperAdmin: true,
    });

    res.status(201).json({
      message: "Super admin created. You can log in now.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return next(new UnauthorizedError("Invalid email or password"));
    }

    if (user.isDisabled) {
      return next(
        new ForbiddenError("This account has been disabled. Contact an administrator.")
      );
    }

    const token = signAccessToken({ userId: user._id });
    setAccessTokenCookie(res, token);

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    clearAccessTokenCookie(res);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    res.status(200).json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isSuperAdmin: req.user.isSuperAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { login, logout, me, bootstrapSuperAdmin };
