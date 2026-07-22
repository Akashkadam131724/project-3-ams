import Project from "./project.model.js";
import ProjectMember from "./projectMember.model.js";
import { hasPermission } from "./permissions.js";
import { NotFoundError, ForbiddenError } from "../../common/errors/AppError.js";

/**
 * Loads project into req.project and membership into req.projectMember.
 * Super admin bypasses permission checks when `permissions` is non-empty.
 */
export const requireProjectAccess =
  (...permissions) =>
  async (req, res, next) => {
    try {
      const projectId = req.params.id;

      const project = await Project.findById(projectId);
      if (!project) {
        return next(new NotFoundError("Project not found"));
      }

      req.project = project;

      if (req.user.isSuperAdmin) {
        req.projectMember = null;
        return next();
      }

      const member = await ProjectMember.findOne({
        projectId: project._id,
        userId: req.user._id,
      });

      if (!member) {
        return next(new NotFoundError("Project not found"));
      }

      req.projectMember = member;

      if (permissions.length > 0) {
        for (const permission of permissions) {
          if (!hasPermission(member.role, permission)) {
            return next(
              new ForbiddenError("You do not have permission for this action")
            );
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
