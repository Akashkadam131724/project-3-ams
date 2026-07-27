"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { adminNav, mainNav } from "@/lib/navigation";
import { projectPath } from "@/lib/paths";
import { useProjectAccess } from "@/hooks/use-project-access";
import {
  iconForNavHref,
  NavIconLogout,
} from "@/components/sidebar-nav-icons";
import { IconChevronSidebar } from "@/components/icons";
import { useEffect, useState, type ReactNode } from "react";

function NavLink({
  href,
  label,
  matchPrefix,
  membersSection,
  onNavigate,
  collapsed,
  icon,
}: {
  href: string;
  label: string;
  matchPrefix?: boolean;
  membersSection?: boolean;
  onNavigate?: () => void;
  collapsed: boolean;
  icon: ReactNode;
}) {
  const pathname = usePathname();
  let active = false;
  if (href === "/projects") {
    active = pathname === "/projects";
  } else if (membersSection) {
    active =
      pathname === href ||
      (pathname.startsWith(`${href}/`) && !pathname.endsWith("/activity"));
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
      onClick={() => onNavigate?.()}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-md text-sm ${
        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2"
      } ${
        active
          ? "ams-nav-active"
          : "text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900"
      }`}
    >
      <span className="shrink-0 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function AppSidebar({
  mobileOpen = false,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/projects\/([a-f\d]{24})/i);
    setProjectId(match?.[1] ?? null);
  }, [pathname]);

  const access = useProjectAccess(projectId);
  const initials = user?.name
    ?.split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      id="app-sidebar"
      className={`fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-emerald-200/60 bg-white shadow-xl transition-[width,transform] duration-200 ease-out lg:relative lg:z-auto lg:shrink-0 lg:translate-x-0 lg:shadow-none ${
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${
        collapsed
          ? "w-[min(17rem,calc(100vw-2rem))] lg:w-16"
          : "w-[min(17rem,calc(100vw-2rem))] lg:w-60"
      }`}
    >
      <div
        className={`flex shrink-0 items-center border-b border-emerald-200/60 ${
          collapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-4"
        }`}
      >
        <Link
          href="/projects"
          onClick={() => onNavigate?.()}
          className={`font-semibold text-emerald-900 ${collapsed ? "text-sm" : "text-lg"}`}
          title={collapsed ? "AMS" : undefined}
        >
          {collapsed ? "A" : "AMS"}
        </Link>
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-md p-1.5 text-emerald-800/80 hover:bg-emerald-50 lg:inline-flex"
            aria-label="Collapse sidebar"
          >
            <IconChevronSidebar collapsed={false} />
          </button>
        )}
      </div>

      {collapsed && onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="mx-auto mb-1 hidden shrink-0 rounded-md p-1.5 text-emerald-800/80 hover:bg-emerald-50 lg:flex"
          aria-label="Expand sidebar"
        >
          <IconChevronSidebar collapsed />
        </button>
      )}

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto p-2 lg:p-3">
        <div>
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-emerald-800/45">
              Workspace
            </p>
          )}
          <div className="space-y-0.5">
            {mainNav.map((item) => {
              const Icon = iconForNavHref(item.href);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  icon={<Icon />}
                />
              );
            })}
          </div>
        </div>

        {projectId && access.projectName && (
          <div>
            {!collapsed && (
              <p
                className="mb-2 truncate px-3 text-xs font-medium uppercase tracking-wide text-emerald-800/45"
                title={access.projectName}
              >
                {access.projectName}
              </p>
            )}
            <div className="space-y-0.5">
              <NavLink
                href={projectPath(projectId)}
                label="Files & folders"
                matchPrefix
                collapsed={collapsed}
                onNavigate={onNavigate}
                icon={(() => {
                  const I = iconForNavHref(projectPath(projectId));
                  return <I />;
                })()}
              />
              {access.canManageMembers && (
                <>
                  <NavLink
                    href={`/projects/${projectId}/members`}
                    label="Members"
                    membersSection
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                    icon={(() => {
                      const I = iconForNavHref(
                        `/projects/${projectId}/members`
                      );
                      return <I />;
                    })()}
                  />
                  {access.canViewActivity && (
                    <NavLink
                      href={`/projects/${projectId}/members/activity`}
                      label="Member activity"
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                      icon={(() => {
                        const I = iconForNavHref(
                          `/projects/${projectId}/members/activity`
                        );
                        return <I />;
                      })()}
                    />
                  )}
                </>
              )}
              {access.canViewActivity && (
                <NavLink
                  href={`/projects/${projectId}/activity`}
                  label="File activity"
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                  icon={(() => {
                    const I = iconForNavHref(
                      `/projects/${projectId}/activity`
                    );
                    return <I />;
                  })()}
                />
              )}
            </div>
          </div>
        )}

        {user?.isSuperAdmin && (
          <div>
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-emerald-800/45">
                Super admin
              </p>
            )}
            <div className="space-y-0.5">
              {adminNav.map((item) => {
                const Icon = iconForNavHref(item.href);
                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                    icon={<Icon />}
                  />
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {user && (
        <div
          className={`shrink-0 border-t border-emerald-200/60 ${
            collapsed ? "p-2" : "p-4"
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900"
                title={user.name}
              >
                {initials || "?"}
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-md p-2 text-emerald-800/80 hover:bg-emerald-50"
                title="Log out"
                aria-label="Log out"
              >
                <NavIconLogout className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
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
                className="mt-3 w-full rounded-md border border-emerald-200/80 px-3 py-1.5 text-sm text-emerald-900 hover:bg-emerald-50"
              >
                Log out
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
