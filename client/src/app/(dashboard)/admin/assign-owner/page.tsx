"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, membersApi, projectsApi, usersApi } from "@/lib/api";
import { ROLE_LABELS, isProjectOwnerRole } from "@/lib/roles";
import type { Project, ProjectMemberRow, User } from "@/lib/types";

export default function AssignOwnerPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [projectMembers, setProjectMembers] = useState<ProjectMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([usersApi.list(), projectsApi.list()])
      .then(([u, p]) => {
        setUsers(u.filter((x) => !x.isSuperAdmin && !x.isDisabled));
        setProjects(p.projects);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load data")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setProjectMembers([]);
      setUserId("");
      return;
    }
    setMembersLoading(true);
    membersApi
      .list(projectId)
      .then((res) => setProjectMembers(res.members))
      .catch((e) =>
        setError(
          e instanceof ApiError ? e.message : "Failed to load project members"
        )
      )
      .finally(() => setMembersLoading(false));
  }, [projectId]);

  const ownerMember = projectMembers.find((m) =>
    isProjectOwnerRole(m.role)
  );
  const ownerUserId = ownerMember?.user._id;

  const eligibleUsers = useMemo(() => {
    if (!projectId) return users;
    return users.filter((u) => u._id !== ownerUserId);
  }, [users, projectId, ownerUserId]);

  useEffect(() => {
    if (!userId && eligibleUsers[0]) {
      setUserId(eligibleUsers[0]._id);
    } else if (userId && !eligibleUsers.some((u) => u._id === userId)) {
      setUserId(eligibleUsers[0]?._id ?? "");
    }
  }, [eligibleUsers, userId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await projectsApi.assignOwner(projectId, userId);
      setMessage("Project owner assigned.");
      const res = await membersApi.list(projectId);
      setProjectMembers(res.members);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assign failed");
    }
  };

  const onRemoveOwner = async () => {
    if (!ownerMember) return;
    if (
      !confirm(
        `Remove project owner ${ownerMember.user.email}? The project will have no owner until you assign a new one.`
      )
    ) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await projectsApi.removeOwner(projectId);
      setMessage("Project owner removed.");
      const res = await membersApi.list(projectId);
      setProjectMembers(res.members);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Remove owner failed");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Assign project owner</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Pick a project and user. If the project already has an owner, assigning
        someone else replaces them (the previous owner becomes project admin).
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-8 max-w-lg space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
        >
          <div>
            <label htmlFor="project" className="block text-sm font-medium">
              Project
            </label>
            <select
              id="project"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {projectId && (
            <div className="rounded-md border border-zinc-100 bg-zinc-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Members on this project
              </p>
              {membersLoading ? (
                <p className="mt-2 text-sm text-zinc-500">Loading members…</p>
              ) : projectMembers.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">No members yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-zinc-800">
                  {projectMembers.map((m) => (
                    <li key={m._id} className="flex flex-wrap items-center gap-2">
                      <span>
                        {m.user.name}{" "}
                        <span className="text-zinc-500">({m.user.email})</span>
                        <span className="ml-2 text-zinc-600">
                          — {ROLE_LABELS[m.role]}
                        </span>
                      </span>
                      {isProjectOwnerRole(m.role) && (
                        <button
                          type="button"
                          onClick={onRemoveOwner}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove owner
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <label htmlFor="user" className="block text-sm font-medium">
              Owner user
            </label>
            <select
              id="user"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!projectId || eligibleUsers.length === 0}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">
                {!projectId
                  ? "Select a project first"
                  : eligibleUsers.length === 0
                    ? "No eligible users"
                    : "Select user"}
              </option>
              {eligibleUsers.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!projectId || !userId}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {ownerMember ? "Replace owner" : "Assign owner"}
          </button>
        </form>
      )}
    </>
  );
}
