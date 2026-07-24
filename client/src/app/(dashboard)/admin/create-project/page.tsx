"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiError, projectsApi } from "@/lib/api";

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setCreatedId(null);
    try {
      const res = await projectsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setMessage(`Project "${res.project.name}" created.`);
      setCreatedId(res.project._id);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Create failed");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Create project</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Step 1 — add a new project. Assign a project owner after users exist.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <div className="mt-4 space-y-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          <p>{message}</p>
          {createdId && (
            <Link
              href="/admin/assign-owner"
              className="inline-block font-medium text-green-900 underline"
            >
              Continue to assign owner →
            </Link>
          )}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="mt-8 max-w-md space-y-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Project name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
        >
          Create project
        </button>
      </form>
    </>
  );
}
