"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGate } from "@/components/auth-gate";
import { IconMenu } from "@/components/icons";
import { DashboardLayoutProvider, useDashboardLayout } from "@/contexts/dashboard-layout-context";
import { layout } from "@/lib/layout";
import {
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "@/lib/sidebar-prefs";

function MenuIcon({ className }: { className?: string }) {
  return <IconMenu className={className} />;
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

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src="/login-hero.png"
            alt=""
            fill
            className="object-cover object-center opacity-[0.85]"
            sizes="(max-width: 1024px) 100vw, 75vw"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#f0f5f2]/90 via-[#f0f5f2]/85 to-emerald-100/55" />
        </div>

        <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-emerald-200/50 bg-white/75 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            type="button"
            className="rounded-md p-2 text-emerald-900 hover:bg-emerald-50"
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
          className={`relative z-10 flex min-h-0 min-w-0 flex-1 flex-col ${
            scrollLocked ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`${layout.pageInner} ${
              scrollLocked ? "h-full min-h-0" : layout.page
            }`}
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
