"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/projects" : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex flex-1 items-center justify-center text-zinc-500">
      Loading......
    </div>
  );
}
