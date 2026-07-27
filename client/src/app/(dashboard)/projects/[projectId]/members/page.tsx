"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, membersApi, projectsApi } from "@/lib/api";
import { ROLE_LABELS, rolesActorCanAssign, isProjectOwnerRole } from "@/lib/roles";
import { useProjectAccess } from "@/hooks/use-project-access";
import { useAuth } from "@/contexts/auth-context";
import type { ProjectMemberRow, ProjectRole } from "@/lib/types";

export default function ProjectMembersPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { user } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [myRole, setMyRole] = useState<ProjectRole | null>(null);
  const [members, setMembers] = useState<ProjectMemberRow[]>([]);
  const [candidates, setCandidates] = useState<
    { _id: string; name: string; email: string }[]
  >([]);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<ProjectRole>("editor");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const assignable = rolesActorCanAssign(
    Boolean(user?.isSuperAdmin),
    myRole
  );
  const canManage = assignable.length > 0;
  const projectAccess = useProjectAccess(projectId);
  const showMemberActivity = projectAccess.canViewActivity;

  const loadCandidates = () => {
    if (!canManage) return;
    membersApi
      .candidates(projectId)
      .then((res) => {
        setCandidates(res.users);
        setUserId((current) =>
          current && res.users.some((u) => u._id === current)
            ? current
            : res.users[0]?._id ?? ""
        );
      })
      .catch(() => setCandidates([]));
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      projectsApi.get(projectId),
      membersApi.list(projectId),
    ])
      .then(([projectRes, membersRes]) => {
        setProjectName(projectRes.project.name);
        setMyRole(projectRes.role ?? null);
        setMembers(membersRes.members);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load members")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  useEffect(() => {
    if (projectId && canManage) loadCandidates();
  }, [projectId, canManage]);

  useEffect(() => {
    if (assignable.length && !assignable.includes(role)) {
      setRole(assignable[0]);
    }
  }, [assignable, role]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await membersApi.add(projectId, {
        userId,
        role,
      });
      setMessage("Member added.");
      load();
      loadCandidates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add member");
    }
  };

  const onRemove = async (member: ProjectMemberRow) => {
    const label = isProjectOwnerRole(member.role)
        ? `Remove project owner ${member.user.email}? The project will have no owner until a super admin assigns a new one.`
        : `Remove ${member.user.email} from this project?`;
    if (!confirm(label)) return;
    try {
      await membersApi.remove(projectId, member._id);
      load();
      loadCandidates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Remove failed");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Members</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {projectName ? `${projectName} · ` : ""}
        {canManage
          ? "Choose a user who is not on the project yet, then assign a role."
          : "View project members."}
        {showMemberActivity && (
          <>
            {" "}
            <Link
              href={`/projects/${projectId}/members/activity`}
              className="ams-link"
            >
              Member activity
            </Link>
          </>
        )}
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

      {canManage && (
        <form
          onSubmit={onAdd}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-600">
              User
            </label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-md border border-zinc-300 px-3 py-2 text-sm sm:w-72"
            >
              <option value="" disabled>
                {candidates.length === 0
                  ? "No users available to add"
                  : "Select user"}
              </option>
              {candidates.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProjectRole)}
              className="mt-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              {assignable.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!userId}
            className="ams-btn-primary disabled:opacity-40"
          >
            Add member
          </button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : (
        <>
          <ul className="mt-8 space-y-3 md:hidden">
            {members.map((m) => (
              <li
                key={m._id}
                className="rounded-lg border border-zinc-200 bg-white p-4 text-sm"
              >
                <p className="font-medium text-zinc-900">{m.user.name}</p>
                <p className="truncate text-zinc-500">{m.user.email}</p>
                <p className="mt-2 text-zinc-700">{ROLE_LABELS[m.role]}</p>
                {canManage &&
                  (!isProjectOwnerRole(m.role) || user?.isSuperAdmin) && (
                    <button
                      type="button"
                      onClick={() => onRemove(m)}
                      className="mt-3 text-red-600 hover:underline"
                    >
                      {isProjectOwnerRole(m.role)
                        ? "Remove owner"
                        : "Remove"}
                    </button>
                  )}
              </li>
            ))}
          </ul>
          <div className="-mx-4 hidden overflow-x-auto px-4 md:mx-0 md:block md:px-0">
            <table className="mt-8 w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 font-medium">User</th>
                  <th className="py-2 font-medium">Role</th>
                  {canManage && <th className="py-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="border-b border-zinc-100">
                    <td className="py-3">
                      <span className="block font-medium">{m.user.name}</span>
                      <span className="text-zinc-500">{m.user.email}</span>
                    </td>
                    <td className="py-3">{ROLE_LABELS[m.role]}</td>
                    {canManage && (
                      <td className="py-3 text-right">
                        {(!isProjectOwnerRole(m.role) ||
                          user?.isSuperAdmin) && (
                          <button
                            type="button"
                            onClick={() => onRemove(m)}
                            className="text-red-600 hover:underline"
                          >
                            {isProjectOwnerRole(m.role)
                              ? "Remove owner"
                              : "Remove"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
