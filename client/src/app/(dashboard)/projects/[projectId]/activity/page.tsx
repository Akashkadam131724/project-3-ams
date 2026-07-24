"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, resourceActivityApi } from "@/lib/api";
import { ACTIVITY_LABELS } from "@/lib/roles";
import type { ResourceActivity } from "@/lib/types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function activityDetail(activity: ResourceActivity) {
  const meta = activity.metadata || {};
  if (
    activity.action === "resource_renamed" &&
    typeof meta.previousName === "string"
  ) {
    return `"${meta.previousName}" → "${activity.resourceName}"`;
  }
  if (activity.action === "file_uploaded" || activity.action === "file_replaced") {
    const parts = [activity.resourceName];
    if (typeof meta.originalFilename === "string") {
      parts.push(`(${meta.originalFilename})`);
    }
    return parts.join(" ");
  }
  return activity.resourceName;
}

export default function ProjectResourceActivityPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [activities, setActivities] = useState<ResourceActivity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    resourceActivityApi
      .list(projectId, page)
      .then((res) => {
        setActivities(res.activities);
        setTotalPages(res.pagination.totalPages);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load activity")
      )
      .finally(() => setLoading(false));
  }, [projectId, page]);

  return (
    <>
      <h1 className="text-2xl font-semibold">File & folder activity</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Uploads, renames, replacements, and deletes for project resources.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="mt-8 text-zinc-500">No resource activity yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {activities.map((a) => (
            <li key={a._id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-zinc-900">
                  {ACTIVITY_LABELS[a.action] || a.action}
                  <span className="ml-2 font-normal text-zinc-600">
                    {activityDetail(a)}
                  </span>
                </p>
                <time className="text-xs text-zinc-500">
                  {formatWhen(a.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {a.resourceType === "folder" ? "Folder" : "File"} ·{" "}
                {a.performedBy?.name} ({a.performedBy?.email})
              </p>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-zinc-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
