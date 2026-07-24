"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/lib/types";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    usersApi
      .list()
      .then(setUsers)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load users")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDisabled = async (target: User) => {
    const next = !target.isDisabled;
    const action = next ? "disable" : "enable";
    if (
      !confirm(
        `${next ? "Disable" : "Enable"} ${target.email}? ${
          next
            ? "They will not be able to sign in until re-enabled."
            : "They will be able to sign in again."
        }`
      )
    ) {
      return;
    }
    setError(null);
    setUpdatingId(target._id);
    try {
      const res = await usersApi.setDisabled(target._id, next);
      setUsers((list) =>
        list.map((u) => (u._id === target._id ? res.user : u))
      );
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : `Could not ${action} user`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const canToggle = (u: User) =>
    !u.isSuperAdmin && u._id !== currentUser?._id;

  return (
    <>
      <h1 className="text-2xl font-semibold">Users</h1>
      <p className="mt-1 text-sm text-zinc-500">
        All accounts in the system. Disabled users cannot log in.{" "}
        <Link href="/admin/create-user" className="text-zinc-900 underline">
          Create a user
        </Link>
        .
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : (
        <ul className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {users.map((u) => (
            <li
              key={u._id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-900">
                  {u.name}
                  {u.isDisabled && (
                    <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-normal text-zinc-700">
                      Disabled
                    </span>
                  )}
                </p>
                <p className="text-zinc-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {u.isSuperAdmin && (
                  <span className="text-xs text-zinc-500">Super admin</span>
                )}
                {canToggle(u) && (
                  <button
                    type="button"
                    disabled={updatingId === u._id}
                    onClick={() => toggleDisabled(u)}
                    className={
                      u.isDisabled
                        ? "text-sm text-zinc-900 underline hover:no-underline disabled:opacity-50"
                        : "text-sm text-red-600 hover:underline disabled:opacity-50"
                    }
                  >
                    {updatingId === u._id
                      ? "Saving…"
                      : u.isDisabled
                        ? "Enable"
                        : "Disable"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
