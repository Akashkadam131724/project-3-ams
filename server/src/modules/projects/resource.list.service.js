import Resource from "./resource.model.js";
import {
  DEFAULT_RESOURCE_PAGE_SIZE,
  DEFAULT_RESOURCE_SORT_BY,
  DEFAULT_RESOURCE_SORT_ORDER,
} from "./resource.list.constants.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter({ projectId, parentId, q, type }) {
  const filter = {
    projectId,
    parentId: parentId ?? null,
  };

  if (type === "folder" || type === "file") {
    filter.type = type;
  }

  if (q) {
    filter.name = { $regex: escapeRegex(q), $options: "i" };
  }

  return filter;
}

function buildMongoSort(sortBy, sortOrder) {
  const dir = sortOrder === "desc" ? -1 : 1;

  switch (sortBy) {
    case "name":
      return { name: dir };
    case "modified":
      return { updatedAt: dir, name: 1 };
    case "created":
      return { createdAt: dir, name: 1 };
    case "size":
      return { sizeBytes: dir, name: 1 };
    case "type":
      // asc: folders first; desc: files first
      return { type: dir === 1 ? -1 : 1, name: 1 };
    default:
      return { name: dir };
  }
}

async function findWithCreatorSort({
  filter,
  sortOrder,
  skip,
  limit,
}) {
  const dir = sortOrder === "desc" ? -1 : 1;

  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creatorDoc",
      },
    },
    {
      $addFields: {
        creatorSortKey: {
          $toLower: {
            $ifNull: [{ $arrayElemAt: ["$creatorDoc.name", 0] }, ""],
          },
        },
      },
    },
    { $sort: { creatorSortKey: dir, name: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        creatorDoc: 0,
        creatorSortKey: 0,
      },
    },
  ];

  const docs = await Resource.aggregate(pipeline);
  return Resource.populate(docs, [
    { path: "owner", select: "name email" },
    { path: "createdBy", select: "name email" },
  ]);
}

export async function queryProjectResources({
  projectId,
  parentId,
  q,
  type = "all",
  sortBy = DEFAULT_RESOURCE_SORT_BY,
  sortOrder = DEFAULT_RESOURCE_SORT_ORDER,
  page = 1,
  pageSize = DEFAULT_RESOURCE_PAGE_SIZE,
}) {
  const filter = buildFilter({ projectId, parentId, q, type });
  const skip = (page - 1) * pageSize;

  const total = await Resource.countDocuments(filter);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  let resources;

  if (sortBy === "creator") {
    resources = await findWithCreatorSort({
      filter,
      sortOrder,
      skip,
      limit: pageSize,
    });
  } else {
    const sort = buildMongoSort(sortBy, sortOrder);
    resources = await Resource.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .populate("owner", "name email")
      .populate("createdBy", "name email")
      .lean();
  }

  return {
    resources,
    sort: { sortBy, sortOrder },
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}
