"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/password-input";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
} from "@/lib/remember-login";

import { IconAmsLogo } from "@/components/icons";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = loadRememberedLogin();
    if (saved) {
      setEmail(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/projects");
  }, [user, loading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      if (rememberMe) {
        saveRememberedLogin(email, password);
      } else {
        clearRememberedLogin();
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Login failed. Check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative h-52 shrink-0 overflow-hidden lg:h-auto lg:min-h-screen lg:w-[min(48%,540px)] lg:max-w-xl xl:max-w-2xl">
        <Image
          src="/login-hero.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/55 to-emerald-800/30 lg:bg-gradient-to-br lg:from-emerald-950/85 lg:via-emerald-900/50 lg:to-transparent"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-end p-6 text-white lg:justify-between lg:p-10">
          <div className="hidden items-center gap-2.5 lg:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <IconAmsLogo className="h-6 w-6 text-emerald-100" />
            </span>
            <span className="text-lg font-semibold tracking-tight">AMS</span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-200/90 lg:text-sm">
              Asset Management
            </p>
            <h2 className="mt-2 max-w-sm text-2xl font-semibold leading-tight tracking-tight lg:text-3xl">
              Every file and folder, organized in one place
            </h2>
            <p className="mt-3 hidden max-w-md text-sm leading-relaxed text-emerald-100/85 lg:block">
              Secure project workspaces, role-based access, and fast previews for
              your team&apos;s media and documents.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col justify-center bg-zinc-50 px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
              <IconAmsLogo className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-zinc-900">AMS</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in with your AMS account to open projects and assets.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-shadow placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700"
              >
                Password
              </label>
              <div className="mt-1.5">
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={setPassword}
                  className="rounded-lg py-2.5 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded border-zinc-300 text-emerald-700 focus:ring-emerald-600/30"
              />
              Remember me on this device
            </label>
            {error && (
              <p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Asset Management System · Internal use
          </p>
        </div>
      </main>
    </div>
  );
}
