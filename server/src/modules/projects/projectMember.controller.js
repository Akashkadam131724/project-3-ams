import User from "../users/user.model.js";
import ProjectMember from "./projectMember.model.js";
import {
  PERMISSIONS,
  PROJECT_ROLES,
  canAssignRole,
  hasPermission,
  isProjectOwnerRole,
} from "./permissions.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../common/errors/AppError.js";
import { MEMBER_ACTIVITY_ACTIONS } from "./memberActivity.constants.js";
import { logMemberActivity } from "./memberActivity.service.js";

const assertCanManageMembers = (req) => {
  if (req.user.isSuperAdmin) return;

  const actorRole = req.projectMember?.role;
  if (!actorRole) {
    throw new ForbiddenError("You are not a member of this project");
  }

  const canManage =
    hasPermission(actorRole, PERMISSIONS.MANAGE_MEMBERS) ||
    hasPermission(actorRole, PERMISSIONS.ASSIGN_PROJECT_ADMIN);

  if (!canManage) {
    throw new ForbiddenError("You cannot manage members on this project");
  }
};

const assertCanAssignRole = (req, targetRole) => {
  if (targetRole === PROJECT_ROLES.PROJECT_OWNER) {
    throw new BadRequestError(
      "Use POST /projects/:id/owner to assign a project owner"
    );
  }

  if (req.user.isSuperAdmin) return;

  const actorRole = req.projectMember?.role;
  if (!actorRole) {
    throw new ForbiddenError("You are not a member of this project");
  }

  const canManage =
    hasPermission(actorRole, PERMISSIONS.MANAGE_MEMBERS) ||
    hasPermission(actorRole, PERMISSIONS.ASSIGN_PROJECT_ADMIN);

  if (!canManage) {
    throw new ForbiddenError("You cannot manage members on this project");
  }

  if (!canAssignRole(actorRole, targetRole)) {
    throw new ForbiddenError(`You cannot assign the role "${targetRole}"`);
  }
};

export const listMemberCandidates = async (req, res, next) => {
  try {
    assertCanManageMembers(req);

    const projectId = req.project._id;
    const memberUserIds = await ProjectMember.find({ projectId }).distinct(
      "userId"
    );

    const filter = {
      _id: { $nin: memberUserIds },
      isSuperAdmin: { $ne: true },
      isDisabled: { $ne: true },
    };

    const search = String(req.query.search || "").trim();
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ email: regex }, { name: regex }];
    }

    const users = await User.find(filter)
      .select("name email")
      .sort({ name: 1, email: 1 })
      .limit(200)
      .lean();

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { userId: bodyUserId, email, role } = req.body;

    assertCanAssignRole(req, role);

    let userId = bodyUserId;
    if (!userId && email) {
      const byEmail = await User.findOne({ email: email.toLowerCase().trim() }).select(
        "_id"
      );
      if (!byEmail) {
        return next(new NotFoundError("No user with that email"));
      }
      userId = byEmail._id;
    }

    const user = await User.findById(userId).select("_id name email isDisabled");
    if (!user) {
      return next(new NotFoundError("User not found"));
    }
    if (user.isDisabled) {
      return next(
        new BadRequestError("This user is disabled and cannot be added to a project")
      );
    }

    const existing = await ProjectMember.findOne({ projectId, userId });
    if (existing) {
      return next(
        new ConflictError({
          userId: ["User is already a member of this project"],
        })
      );
    }

    const member = await ProjectMember.create({
      userId,
      projectId,
      role,
      addedBy: req.user._id,
    });

    await member.populate("userId", "name email");

    await logMemberActivity({
      projectId,
      action: MEMBER_ACTIVITY_ACTIONS.MEMBER_ADDED,
      targetUserId: user._id,
      memberId: member._id,
      role,
      performedBy: req.user._id,
      metadata: { email: user.email, name: user.name },
    });

    res.status(201).json({
      message: "Member added successfully",
      member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProjectMember = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const { role } = req.body;

    assertCanAssignRole(req, role);

    const member = await ProjectMember.findOne({
      _id: req.params.memberId,
      projectId,
    });

    if (!member) {
      return next(new NotFoundError("Member not found"));
    }

    if (isProjectOwnerRole(member.role)) {
      return next(
        new BadRequestError("Change project owner via POST /projects/:id/owner")
      );
    }

    const previousRole = member.role;
    member.role = role;
    member.addedBy = req.user._id;
    await member.save();
    await member.populate("userId", "name email");

    await logMemberActivity({
      projectId,
      action: MEMBER_ACTIVITY_ACTIONS.MEMBER_ROLE_UPDATED,
      targetUserId: member.userId._id || member.userId,
      memberId: member._id,
      role,
      previousRole,
      performedBy: req.user._id,
      metadata: {
        email: member.userId.email,
        name: member.userId.name,
      },
    });

    res.status(200).json({
      message: "Member role updated",
      member,
    });
  } catch (error) {
    next(error);
  }
};

export const removeProjectMember = async (req, res, next) => {
  try {
    const projectId = req.project._id;

    const member = await ProjectMember.findOne({
      _id: req.params.memberId,
      projectId,
    });

    if (!member) {
      return next(new NotFoundError("Member not found"));
    }

    if (isProjectOwnerRole(member.role)) {
      if (!req.user.isSuperAdmin) {
        return next(new BadRequestError("Cannot remove the project owner here"));
      }
    }

    if (!req.user.isSuperAdmin) {
      const actorRole = req.projectMember?.role;
      if (!actorRole) {
        return next(new ForbiddenError("You are not a member of this project"));
      }
      const canManage =
        hasPermission(actorRole, PERMISSIONS.MANAGE_MEMBERS) ||
        hasPermission(actorRole, PERMISSIONS.ASSIGN_PROJECT_ADMIN);
      if (!canManage) {
        return next(new ForbiddenError("You cannot remove members"));
      }
      if (!canAssignRole(actorRole, member.role)) {
        return next(
          new ForbiddenError("You cannot remove a member with this role")
        );
      }
    }

    const targetUser = await User.findById(member.userId).select("name email");
    const removedRole = member.role;
    const targetUserId = member.userId;

    await member.deleteOne();

    await logMemberActivity({
      projectId,
      action: MEMBER_ACTIVITY_ACTIONS.MEMBER_REMOVED,
      targetUserId,
      memberId: member._id,
      role: removedRole,
      performedBy: req.user._id,
      metadata: {
        email: targetUser?.email,
        name: targetUser?.name,
        ...(isProjectOwnerRole(removedRole)
          ? { removedOwner: true }
          : {}),
      },
    });

    res.status(200).json({
      message: "Member removed",
      id: member._id,
    });
  } catch (error) {
    next(error);
  }
};
