"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { AuthGate } from "@/components/auth-gate";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen bg-zinc-50">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-5xl flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthGate>
  );
}
