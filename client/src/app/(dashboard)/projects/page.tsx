"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, projectsApi } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    projectsApi
      .list()
      .then((res) => setProjects(res.projects))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load projects")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Open a project to browse folders and files.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="mt-8 text-zinc-500">No projects yet.</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p._id}>
              <Link
                href={`/projects/${p._id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400"
              >
                <h2 className="font-medium">{p.name}</h2>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                    {p.description}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
