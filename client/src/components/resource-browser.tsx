"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, resourcesApi } from "@/lib/api";
import { projectAssetPath, projectFolderPath, projectPath } from "@/lib/paths";
import type { Resource } from "@/lib/types";

type Crumb = { id: string | null; name: string };

function formatBytes(n?: number) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function buildBreadcrumbs(
  projectId: string,
  projectName: string,
  folderId: string | null
): Promise<Crumb[]> {
  const crumbs: Crumb[] = [{ id: null, name: projectName }];
  if (!folderId) return crumbs;

  const chain: Crumb[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { resource } = await resourcesApi.get(projectId, currentId);
    if (resource.type !== "folder") break;
    chain.unshift({ id: resource._id, name: resource.name });
    currentId = resource.parentId;
  }

  return [...crumbs, ...chain];
}

export function ResourceBrowser({
  projectId,
  projectName,
  folderId = null,
}: {
  projectId: string;
  projectName: string;
  folderId?: string | null;
}) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([
    { id: null, name: projectName },
  ]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    let cancelled = false;
    buildBreadcrumbs(projectId, projectName, folderId)
      .then((c) => {
        if (!cancelled) setCrumbs(c);
      })
      .catch(() => {
        if (!cancelled) {
          setCrumbs([{ id: null, name: projectName }]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, projectName, folderId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { resources: list } = await resourcesApi.list(projectId, folderId);
      setResources(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [projectId, folderId]);

  useEffect(() => {
    load();
  }, [load]);

  const onCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await resourcesApi.createFolder(
        projectId,
        newFolderName.trim(),
        folderId
      );
      setNewFolderName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create folder");
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await resourcesApi.uploadFile(projectId, file, folderId);
      e.target.value = "";
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    }
  };

  const onDelete = async (resource: Resource) => {
    if (!confirm(`Delete "${resource.name}"?`)) return;
    try {
      await resourcesApi.delete(projectId, resource._id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const crumbHref = (crumb: Crumb) =>
    crumb.id ? projectFolderPath(projectId, crumb.id) : projectPath(projectId);

  const parentCrumb =
    crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
  const backHref = parentCrumb ? crumbHref(parentCrumb) : "/projects";
  const backLabel = parentCrumb ? parentCrumb.name : "Projects";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900"
        >
          <span aria-hidden>←</span>
          Back to {backLabel}
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
        <Link href="/projects" className="hover:text-zinc-900">
          Projects
        </Link>
        <span>/</span>
        {crumbs.map((c, i) => (
          <span key={c.id ?? "root"} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-zinc-900">{c.name}</span>
            ) : (
              <Link href={crumbHref(c)} className="hover:text-zinc-900">
                {c.name}
              </Link>
            )}
          </span>
        ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={onCreateFolder} className="flex gap-2">
          <input
            type="text"
            placeholder="New folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Add folder
          </button>
        </form>
        <label className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Upload file
          <input type="file" className="hidden" onChange={onUpload} />
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading resources…</p>
      ) : resources.length === 0 ? (
        <p className="text-zinc-500">This folder is empty.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {resources.map((r) => (
            <li
              key={r._id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                {r.type === "folder" ? (
                  <Link
                    href={projectFolderPath(projectId, r._id)}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    📁 {r.name}
                  </Link>
                ) : (
                  <div>
                    <Link
                      href={projectAssetPath(projectId, r._id)}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      📄 {r.name}
                    </Link>
                    <p className="truncate text-xs text-zinc-500">
                      {r.mimeType} · {formatBytes(r.sizeBytes)}
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDelete(r)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
