import User from "./user.model.js";
import ProjectMember from "../projects/projectMember.model.js";
import { ROLE_PERMISSIONS } from "../projects/permissions.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../common/errors/AppError.js";

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).send(users);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.create({ name, email, password });
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).send(safeUser);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const isSelf = String(req.user._id) === String(req.params.id);

    if (!isSelf && !req.user.isSuperAdmin) {
      return next(new ForbiddenError("You can only update your own profile"));
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    if (req.body.isSuperAdmin !== undefined && !req.user.isSuperAdmin) {
      return next(new ForbiddenError("You cannot change Super Admin status"));
    }

    const { name, email, password } = req.body;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(200).send(safeUser);
  } catch (error) {
    next(error);
  }
};

const getUserProjects = async (req, res, next) => {
  try {
    const isSelf = String(req.user._id) === String(req.params.id);

    if (!isSelf && !req.user.isSuperAdmin) {
      return next(
        new ForbiddenError("You can only view your own project permissions")
      );
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    const memberships = await ProjectMember.find({ userId: user._id })
      .populate("projectId")
      .sort({ createdAt: -1 });

    const projects = memberships
      .filter((m) => m.projectId)
      .map((m) => ({
        project: m.projectId,
        role: m.role,
        permissions: ROLE_PERMISSIONS[m.role] || [],
        memberId: m._id,
        joinedAt: m.createdAt,
      }));

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      projects,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserByQuery = async (req, res, next) => {
  try {
    const isSelf = String(req.user._id) === String(req.params.id);

    if (!isSelf && !req.user.isSuperAdmin) {
      return next(new ForbiddenError("You can only update your own profile"));
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
};

const setUserDisabled = async (req, res, next) => {
  try {
    const { isDisabled } = req.body;
    const targetId = req.params.id;

    if (String(req.user._id) === String(targetId)) {
      return next(new BadRequestError("You cannot disable your own account"));
    }

    const user = await User.findById(targetId);
    if (!user) {
      return next(new NotFoundError("User not found"));
    }

    if (user.isSuperAdmin) {
      return next(new BadRequestError("Super admin accounts cannot be disabled"));
    }

    user.isDisabled = isDisabled;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(200).json({
      message: isDisabled ? "User disabled" : "User enabled",
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getUsers,
  createUser,
  updateUser,
  getUserProjects,
  updateUserByQuery,
  setUserDisabled,
};
