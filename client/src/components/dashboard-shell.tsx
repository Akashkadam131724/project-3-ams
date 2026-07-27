"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGate } from "@/components/auth-gate";
import { DashboardLayoutProvider, useDashboardLayout } from "@/contexts/dashboard-layout-context";
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/sidebar-prefs";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { mainScroll } = useDashboardLayout();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(readSidebarCollapsed());
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeSidebarCollapsed(next);
      return next;
    });
  };

  const scrollLocked = mainScroll === "locked";

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <AppSidebar
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100"
            aria-expanded={mobileNavOpen}
            aria-controls="app-sidebar"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </button>
          <span className="truncate text-base font-semibold text-emerald-900">
            AMS
          </span>
        </header>

        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col ${
            scrollLocked ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`mx-auto flex w-full min-w-0 max-w-5xl flex-1 flex-col ${
              scrollLocked ? "h-full min-h-0" : ""
            } ${scrollLocked ? "" : "p-4 sm:p-6 md:p-8"}`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardLayoutProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </DashboardLayoutProvider>
    </AuthGate>
  );
}
