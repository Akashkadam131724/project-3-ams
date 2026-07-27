"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError, usersApi } from "@/lib/api";
import { PasswordInput } from "@/components/password-input";

export default function CreateUserPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setMessage(null);
    try {
      const user = await usersApi.create({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setMessage(`User ${user.email} created.`);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not create user");
      }
    }
  };

  const fieldHint = (key: string) =>
    fieldErrors[key]?.[0] ? (
      <p className="mt-1 text-xs text-red-600">{fieldErrors[key][0]}</p>
    ) : null;

  return (
    <>
      <h1 className="text-2xl font-semibold">Create user</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Super admins create accounts. Users can then be assigned as project
        owners or members.
      </p>

      {error && !Object.keys(fieldErrors).length && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <div className="mt-4 space-y-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          <p>{message}</p>
          <Link href="/admin/users" className="font-medium text-green-900 underline">
            View all users →
          </Link>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="ams-input mt-1"
          />
          {fieldHint("name")}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ams-input mt-1"
          />
          {fieldHint("email")}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <div className="mt-1">
            <PasswordInput
              id="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Min 8 chars, upper & lower case, number, special character, no
            spaces.
          </p>
          {fieldHint("password")}
        </div>
        <button
          type="submit"
          className="ams-btn-primary"
        >
          Create user
        </button>
      </form>
    </>
  );
}
