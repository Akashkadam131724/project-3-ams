import Project from "./project.model.js";
import ProjectMember from "./projectMember.model.js";
import User from "../users/user.model.js";
import { PROJECT_ROLES, ROLE_PERMISSIONS, PROJECT_OWNER_ROLES, isProjectOwnerRole, normalizeProjectRole } from "./permissions.js";
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from "../../common/errors/AppError.js";
import { MEMBER_ACTIVITY_ACTIONS } from "./memberActivity.constants.js";
import { logMemberActivity } from "./memberActivity.service.js";

const createProject = async (req, res, next) => {
  try {
    const { name, description, ownerId } = req.body;

    let ownerUser = null;

    if (ownerId) {
      ownerUser = await User.findById(ownerId).select("-password");
      if (!ownerUser) {
        return next(new NotFoundError("Owner user not found"));
      }
    }

    const project = await Project.create({
      name,
      description: description || "",
      createdBy: req.user._id,
    });

    let owner = null;

    if (ownerId) {
      owner = await ProjectMember.create({
        userId: ownerId,
        projectId: project._id,
        role: PROJECT_ROLES.PROJECT_OWNER,
        addedBy: req.user._id,
      });
    }

    res.status(201).json({
      message: "Project created successfully",
      project,
      owner,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(
        new ConflictError({
          name: ["A project with this name already exists"],
        })
      );
    }
    next(error);
  }
};

const assignProjectOwner = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { userId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError("Project not found"));
    }

    const user = await User.findById(userId).select("name email isDisabled");
    if (!user) {
      return next(new NotFoundError("User not found"));
    }
    if (user.isDisabled) {
      return next(
        new BadRequestError("Disabled users cannot be assigned as project owner")
      );
    }

    const existingOwner = await ProjectMember.findOne({
      projectId,
      role: { $in: PROJECT_OWNER_ROLES },
    });

    if (
      existingOwner &&
      String(existingOwner.userId) === String(userId)
    ) {
      return next(
        new ConflictError({
          userId: ["This user is already the project owner"],
        })
      );
    }

    if (
      existingOwner &&
      String(existingOwner.userId) !== String(userId)
    ) {
      const formerOwnerUser = await User.findById(existingOwner.userId).select(
        "name email"
      );
      const formerRole = existingOwner.role;
      existingOwner.role = PROJECT_ROLES.ADMIN;
      existingOwner.addedBy = req.user._id;
      await existingOwner.save();

      await logMemberActivity({
        projectId,
        action: MEMBER_ACTIVITY_ACTIONS.MEMBER_ROLE_UPDATED,
        targetUserId: existingOwner.userId,
        memberId: existingOwner._id,
        role: PROJECT_ROLES.ADMIN,
        previousRole: normalizeProjectRole(formerRole),
        performedBy: req.user._id,
        metadata: {
          email: formerOwnerUser?.email,
          name: formerOwnerUser?.name,
          replacedAsOwner: true,
        },
      });
    }

    const existingMember = await ProjectMember.findOne({ projectId, userId });

    if (existingMember) {
      if (isProjectOwnerRole(existingMember.role)) {
        return next(
          new ConflictError({
            userId: ["This user is already the project owner"],
          })
        );
      }

      const previousRole = existingMember.role;
      existingMember.role = PROJECT_ROLES.PROJECT_OWNER;
      existingMember.addedBy = req.user._id;
      await existingMember.save();

      await logMemberActivity({
        projectId,
        action: MEMBER_ACTIVITY_ACTIONS.OWNER_ASSIGNED,
        targetUserId: userId,
        memberId: existingMember._id,
        role: PROJECT_ROLES.PROJECT_OWNER,
        previousRole,
        performedBy: req.user._id,
        metadata: {
          email: user.email,
          name: user.name,
          promoted: true,
          replacedPreviousOwner: Boolean(existingOwner),
        },
      });

      return res.status(200).json({
        message: existingOwner
          ? "Project owner replaced"
          : "User promoted to project owner",
        member: existingMember,
      });
    }

    const member = await ProjectMember.create({
      userId,
      projectId,
      role: PROJECT_ROLES.PROJECT_OWNER,
      addedBy: req.user._id,
    });

    await logMemberActivity({
      projectId,
      action: MEMBER_ACTIVITY_ACTIONS.OWNER_ASSIGNED,
      targetUserId: userId,
      memberId: member._id,
      role: PROJECT_ROLES.PROJECT_OWNER,
      performedBy: req.user._id,
      metadata: {
        email: user.email,
        name: user.name,
        replacedPreviousOwner: Boolean(existingOwner),
      },
    });

    res.status(201).json({
      message: existingOwner
        ? "Project owner replaced"
        : "Project owner assigned successfully",
      member,
    });
  } catch (error) {
    next(error);
  }
};

const removeProjectOwner = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError("Project not found"));
    }

    const ownerMember = await ProjectMember.findOne({
      projectId,
      role: { $in: PROJECT_OWNER_ROLES },
    });

    if (!ownerMember) {
      return next(new NotFoundError("This project has no owner assigned"));
    }

    const targetUser = await User.findById(ownerMember.userId).select(
      "name email"
    );
    const targetUserId = ownerMember.userId;
    const memberId = ownerMember._id;

    await ownerMember.deleteOne();

    await logMemberActivity({
      projectId,
      action: MEMBER_ACTIVITY_ACTIONS.MEMBER_REMOVED,
      targetUserId,
      memberId,
      role: PROJECT_ROLES.PROJECT_OWNER,
      performedBy: req.user._id,
      metadata: {
        email: targetUser?.email,
        name: targetUser?.name,
        removedOwner: true,
      },
    });

    res.status(200).json({
      message: "Project owner removed",
      id: memberId,
    });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    if (req.user.isSuperAdmin) {
      const projects = await Project.find().sort({ createdAt: -1 });
      return res.status(200).json({ projects });
    }

    const memberships = await ProjectMember.find({ userId: req.user._id })
      .populate("projectId")
      .sort({ createdAt: -1 });

    const projects = memberships
      .filter((m) => m.projectId)
      .map((m) => ({
        ...m.projectId.toObject(),
        role: normalizeProjectRole(m.role),
      }));

    res.status(200).json({ projects });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new NotFoundError("Project not found"));
    }

    if (!req.user.isSuperAdmin) {
      const member = await ProjectMember.findOne({
        projectId: project._id,
        userId: req.user._id,
      });

      if (!member) {
        return next(new NotFoundError("Project not found"));
      }

      const normalizedRole = normalizeProjectRole(member.role);
      return res.status(200).json({
        project,
        role: normalizedRole,
        permissions: ROLE_PERMISSIONS[normalizedRole] || [],
      });
    }

    res.status(200).json({ project });
  } catch (error) {
    next(error);
  }
};

const getProjectMembers = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new NotFoundError("Project not found"));
    }

    if (!req.user.isSuperAdmin) {
      const membership = await ProjectMember.findOne({
        projectId,
        userId: req.user._id,
      });

      if (!membership) {
        return next(new ForbiddenError("You are not a member of this project"));
      }
    }

    const members = await ProjectMember.find({ projectId })
      .populate("userId", "name email isSuperAdmin")
      .populate("addedBy", "name email")
      .sort({ createdAt: 1 });

    const data = members.map((member) => {
      const role = normalizeProjectRole(member.role);
      return {
        _id: member._id,
        role,
        permissions: ROLE_PERMISSIONS[role] || [],
        user: member.userId,
        addedBy: member.addedBy,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
      };
    });

    res.status(200).json({
      project: {
        _id: project._id,
        name: project.name,
      },
      members: data,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createProject,
  assignProjectOwner,
  removeProjectOwner,
  getProjects,
  getProjectById,
  getProjectMembers,
};
