import ResourceActivity from "./resourceActivity.model.js";

export const listResourceActivity = async (req, res, next) => {
  try {
    const projectId = req.project._id;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ResourceActivity.find({ projectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("performedBy", "name email")
        .lean(),
      ResourceActivity.countDocuments({ projectId }),
    ]);

    res.status(200).json({
      activities: activities.map((a) => ({ ...a, category: "resource" })),
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
