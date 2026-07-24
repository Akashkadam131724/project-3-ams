"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function SuperAdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.isSuperAdmin) {
      router.replace("/projects");
    }
  }, [user, loading, router]);

  if (loading || !user?.isSuperAdmin) {
    return (
      <p className="text-sm text-zinc-500">
        {loading ? "Loading…" : "Super admin access only."}
      </p>
    );
  }

  return <>{children}</>;
}
