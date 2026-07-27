"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, memberActivityApi } from "@/lib/api";
import { ACTIVITY_LABELS, ROLE_LABELS } from "@/lib/roles";
import type { MemberActivity, ProjectRole } from "@/lib/types";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatRole(role?: string) {
  if (!role) return "";
  return ROLE_LABELS[role as ProjectRole] || role.replace(/_/g, " ");
}

function userLabel(
  user?: { name?: string; email?: string },
  meta?: Record<string, unknown>
) {
  const email =
    user?.email ||
    (typeof meta?.email === "string" ? meta.email : undefined) ||
    "unknown";
  const name = user?.name || (typeof meta?.name === "string" ? meta.name : "");
  return name ? `${name} (${email})` : email;
}

function activityDetail(activity: MemberActivity) {
  const meta = activity.metadata || {};
  const who = userLabel(activity.targetUser, meta);
  switch (activity.action) {
    case "member_added":
      return `${who} → ${formatRole(activity.role)}`;
    case "member_role_updated":
      return `${who}: ${formatRole(activity.previousRole)} → ${formatRole(activity.role)}`;
    case "member_removed":
      return `${who} (${formatRole(activity.role)})`;
    case "owner_assigned":
      return `${who} as project owner`;
    default:
      return who;
  }
}

export default function MemberActivityPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    memberActivityApi
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
      <Link
        href={`/projects/${projectId}/members`}
        className="text-sm text-zinc-600 hover:text-emerald-900"
      >
        ← Back to members
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Member activity</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Adds, role changes, removals, and owner assignments.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="mt-8 text-zinc-500">No member activity yet.</p>
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
                By {a.performedBy?.name} ({a.performedBy?.email})
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
