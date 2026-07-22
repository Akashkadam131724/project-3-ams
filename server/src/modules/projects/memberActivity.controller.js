import ProjectMemberActivity from "./memberActivity.model.js";

export const listMemberActivity = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ProjectMemberActivity.find({ projectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("performedBy", "name email")
        .populate("targetUserId", "name email")
        .lean(),
      ProjectMemberActivity.countDocuments({ projectId }),
    ]);

    res.status(200).json({
      activities: activities.map((a) => ({
        _id: a._id,
        category: "member",
        projectId: a.projectId,
        action: a.action,
        targetUser: a.targetUserId,
        role: a.role,
        previousRole: a.previousRole,
        memberId: a.memberId,
        performedBy: a.performedBy,
        metadata: a.metadata || {},
        createdAt: a.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
