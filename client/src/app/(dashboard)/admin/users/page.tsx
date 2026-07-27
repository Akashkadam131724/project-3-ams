"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { User } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === "active" && u.isDisabled) return false;
      if (statusFilter === "inactive" && !u.isDisabled) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, statusFilter]);

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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Status:</span>
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["inactive", "Inactive"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                statusFilter === value
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : filteredUsers.length === 0 ? (
        <p className="mt-8 text-zinc-500">
          {users.length === 0
            ? "No users yet."
            : "No users match your search or filter."}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-zinc-500">
            Showing {filteredUsers.length} of {users.length} users
          </p>
          <ul className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {filteredUsers.map((u) => (
              <li
                key={u._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {u.name}
                    {u.isDisabled ? (
                      <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-normal text-zinc-700">
                        Inactive
                      </span>
                    ) : (
                      <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs font-normal text-green-800">
                        Active
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
        </>
      )}
    </>
  );
}
