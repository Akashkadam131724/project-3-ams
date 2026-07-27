"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, projectsApi } from "@/lib/api";
import { formatModifiedShort } from "@/lib/format-date";
import { projectPath } from "@/lib/paths";
import { ROLE_LABELS } from "@/lib/roles";
import type { Project, ProjectRole } from "@/lib/types";

function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    projectsApi
      .list()
      .then((res) => setProjects(res.projects))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load projects")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
  }, [projects, search]);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Projects
        </h1>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label className="relative block min-w-0 sm:w-56">
            <span className="sr-only">Search projects</span>
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              placeholder="Search projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-500"
            />
          </label>
          {user?.isSuperAdmin && (
            <Link
              href="/admin/create-project"
              className="inline-flex justify-center rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              New
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-zinc-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-zinc-500">
          {projects.length === 0
            ? "No projects yet."
            : "No projects match your search."}
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200/80 bg-white">
          <div className="hidden border-b border-zinc-200 px-4 py-2.5 text-xs font-medium text-zinc-500 sm:grid sm:grid-cols-[1fr_6rem_2.5rem] sm:gap-4">
            <span>Name</span>
            <span className="text-right">Modified</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul>
            {filtered.map((p) => (
              <ProjectTableRow key={p._id} project={p} router={router} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProjectTableRow({
  project,
  router,
}: {
  project: Project;
  router: ReturnType<typeof useRouter>;
}) {
  const modified = formatModifiedShort(
    project.updatedAt || project.createdAt
  );
  const role = project.role as ProjectRole | undefined;
  const subtitle = project.description
    ? project.description
    : role
      ? ROLE_LABELS[role]
      : null;

  const menuItems = [
    {
      id: "open",
      label: "Open project",
      onClick: () => router.push(projectPath(project._id)),
    },
    {
      id: "members",
      label: "Members",
      onClick: () => router.push(`${projectPath(project._id)}/members`),
    },
  ];

  return (
    <li
      data-row-actions
      className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50"
    >
      <div className="flex items-center gap-3 px-4 py-3 sm:hidden">
        <ProjectIcon className="h-5 w-5 shrink-0 text-zinc-500" />
        <div className="min-w-0 flex-1">
          <Link
            href={projectPath(project._id)}
            className="block truncate font-medium text-zinc-900 hover:underline"
          >
            {project.name}
          </Link>
          {subtitle ? (
            <p className="truncate text-xs text-zinc-500">
              {modified} · {subtitle}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">{modified}</p>
          )}
        </div>
        <RowActionsMenu items={menuItems} />
      </div>
      <div className="group hidden grid-cols-[1fr_6rem_2.5rem] items-center gap-4 px-4 py-2.5 sm:grid">
        <div className="flex min-w-0 items-center gap-3">
          <ProjectIcon className="h-5 w-5 shrink-0 text-zinc-500" />
          <div className="min-w-0">
            <Link
              href={projectPath(project._id)}
              className="block truncate font-medium text-zinc-900 hover:underline"
            >
              {project.name}
            </Link>
            {subtitle ? (
              <p className="truncate text-xs text-zinc-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <span className="text-right text-sm text-zinc-500">{modified}</span>
        <div className="flex justify-end">
          <RowActionsMenu items={menuItems} />
        </div>
      </div>
    </li>
  );
}
