"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { adminNav, mainNav } from "@/lib/navigation";
import { projectPath } from "@/lib/paths";
import { canViewActivity, rolesActorCanAssign } from "@/lib/roles";
import { useEffect, useState } from "react";
import { projectsApi } from "@/lib/api";
import type { ProjectRole } from "@/lib/types";

function NavLink({
  href,
  label,
  matchPrefix,
  membersSection,
}: {
  href: string;
  label: string;
  matchPrefix?: boolean;
  membersSection?: boolean;
}) {
  const pathname = usePathname();
  let active = false;
  if (href === "/projects") {
    active = pathname === "/projects";
  } else if (membersSection) {
    active =
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !pathname.endsWith("/activity"));
  } else if (matchPrefix) {
    active =
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !pathname.includes("/members") &&
        !pathname.includes("/activity"));
  } else {
    active = pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-zinc-900 font-medium text-white"
          : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<ProjectRole | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/projects\/([a-f\d]{24})/i);
    const id = match?.[1] ?? null;
    setProjectId(id);
    if (!id) {
      setProjectName(null);
      setMyRole(null);
      return;
    }
    projectsApi
      .get(id)
      .then((res) => {
        setProjectName(res.project.name);
        setMyRole(res.role ?? null);
      })
      .catch(() => {
        setProjectName(null);
        setMyRole(null);
      });
  }, [pathname]);

  const canManageMembers =
    user?.isSuperAdmin || rolesActorCanAssign(false, myRole).length > 0;
  const showActivity =
    user?.isSuperAdmin || canViewActivity(false, myRole);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <Link href="/projects" className="text-lg font-semibold text-zinc-900">
          AMS
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Workspace
          </p>
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
        </div>

        {projectId && projectName && (
          <div>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              {projectName}
            </p>
            <div className="space-y-0.5">
              <NavLink
                href={projectPath(projectId)}
                label="Files & folders"
                matchPrefix
              />
              {canManageMembers && (
                <>
                  <NavLink
                    href={`/projects/${projectId}/members`}
                    label="Members"
                    membersSection
                  />
                  {showActivity && (
                    <NavLink
                      href={`/projects/${projectId}/members/activity`}
                      label="Member activity"
                    />
                  )}
                </>
              )}
              {showActivity && (
                <NavLink
                  href={`/projects/${projectId}/activity`}
                  label="File activity"
                />
              )}
            </div>
          </div>
        )}

        {user?.isSuperAdmin && (
          <div>
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Super admin
            </p>
            <div className="space-y-0.5">
              {adminNav.map((item) => (
                <NavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div className="border-t border-zinc-200 p-4">
          <p className="truncate text-sm font-medium text-zinc-900">
            {user.name}
          </p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
          {user.isSuperAdmin && (
            <p className="mt-0.5 text-xs text-zinc-500">Super admin</p>
          )}
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
