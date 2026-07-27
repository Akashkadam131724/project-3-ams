"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, resourcesApi } from "@/lib/api";
import { projectFolderPath, projectPath } from "@/lib/paths";
import { RESOURCE_LIST_PAGE_SIZE } from "@/lib/resource-list";
import {
  readResourceViewMode,
  ResourceSortControl,
  ResourceViewToggle,
  writeResourceViewMode,
  type ResourceViewMode,
} from "@/components/resource-views";
import {
  ResourceVirtualGridView,
  ResourceVirtualTableView,
} from "@/components/resource-virtual-scroll";
import {
  defaultDirectionForField,
  readResourceSort,
  writeResourceSort,
  type ResourceSortDirection,
  type ResourceSortField,
} from "@/lib/resource-sort";
import { useResourceBrowserScrollLock } from "@/contexts/dashboard-layout-context";
import type { Resource, ResourceListPagination } from "@/lib/types";

type ResourceTypeFilter = "all" | "folder" | "file";
type Crumb = { id: string | null; name: string };

function FolderPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 10v6M9 13h6" />
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
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

function mergeResourcePages(
  prev: Resource[],
  next: Resource[],
  append: boolean
): Resource[] {
  if (!append) return next;
  const seen = new Set(prev.map((r) => r._id));
  const merged = [...prev];
  for (const r of next) {
    if (!seen.has(r._id)) {
      seen.add(r._id);
      merged.push(r);
    }
  }
  return merged;
}

export function ResourceBrowser({
  projectId,
  projectName,
  folderId = null,
  canUpload = true,
  canDelete = true,
}: {
  projectId: string;
  projectName: string;
  folderId?: string | null;
  canUpload?: boolean;
  canDelete?: boolean;
}) {
  useResourceBrowserScrollLock();
  const [crumbs, setCrumbs] = useState<Crumb[]>([
    { id: null, name: projectName },
  ]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ResourceViewMode>("list");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceTypeFilter>("all");
  const [sortField, setSortField] = useState<ResourceSortField>("name");
  const [sortDirection, setSortDirection] =
    useState<ResourceSortDirection>("asc");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ResourceListPagination | null>(
    null
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const listRequestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadMoreInFlightRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setViewMode(readResourceViewMode());
    const saved = readResourceSort();
    setSortField(saved.field);
    setSortDirection(saved.direction);
  }, []);

  const onViewModeChange = (mode: ResourceViewMode) => {
    setViewMode(mode);
    writeResourceViewMode(mode);
  };

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

  const load = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (!append) {
        listRequestIdRef.current += 1;
        pageRef.current = 1;
        setPage(1);
        setResources([]);
        setPagination(null);
        setLoading(true);
        setLoadingMore(false);
        loadMoreInFlightRef.current = false;
      } else {
        if (loadMoreInFlightRef.current) return;
        loadMoreInFlightRef.current = true;
        setLoadingMore(true);
      }

      const requestId = listRequestIdRef.current;
      setError(null);
      try {
        const res = await resourcesApi.list(projectId, {
          folderId,
          q: debouncedSearch || undefined,
          type: typeFilter,
          sortBy: sortField,
          sortOrder: sortDirection,
          page: pageToLoad,
          pageSize: RESOURCE_LIST_PAGE_SIZE,
        });
        if (requestId !== listRequestIdRef.current) return;

        setResources((prev) =>
          mergeResourcePages(prev, res.resources, append)
        );
        setPagination(res.pagination);
        pageRef.current = pageToLoad;
        setPage(pageToLoad);
      } catch (e) {
        if (requestId !== listRequestIdRef.current) return;
        setError(
          e instanceof ApiError ? e.message : "Failed to load resources"
        );
      } finally {
        if (requestId !== listRequestIdRef.current) return;
        setLoading(false);
        setLoadingMore(false);
        loadMoreInFlightRef.current = false;
      }
    },
    [
      projectId,
      folderId,
      debouncedSearch,
      typeFilter,
      sortField,
      sortDirection,
    ]
  );

  useEffect(() => {
    void load(1, false);
  }, [load]);

  const loadMore = useCallback(() => {
    if (loadMoreInFlightRef.current) return;
    if (!pagination?.hasMore || loadingMore || loading) return;
    const nextPage = pageRef.current + 1;
    void load(nextPage, true);
  }, [pagination?.hasMore, loadingMore, loading, load]);

  const listScrollResetKey = [
    projectId,
    folderId ?? "",
    debouncedSearch,
    typeFilter,
    sortField,
    sortDirection,
    viewMode,
  ].join("|");

  const cancelFolderForm = () => {
    setNewFolderName("");
    setFolderFormOpen(false);
  };

  useEffect(() => {
    if (folderFormOpen) {
      folderInputRef.current?.focus();
    }
  }, [folderFormOpen]);

  useEffect(() => {
    if (!folderFormOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelFolderForm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [folderFormOpen]);

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
      setFolderFormOpen(false);
      await load(1, false);
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
      await load(1, false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    }
  };

  const onDelete = async (resource: Resource) => {
    if (!confirm(`Delete "${resource.name}"?`)) return;
    try {
      await resourcesApi.delete(projectId, resource._id);
      await load(1, false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  };

  const currentFolderName =
    crumbs.length > 0 ? crumbs[crumbs.length - 1].name : projectName;

  const persistSort = (field: ResourceSortField, direction: ResourceSortDirection) => {
    setSortField(field);
    setSortDirection(direction);
    writeResourceSort({ field, direction });
  };

  const onSortField = (field: ResourceSortField) => {
    if (field === sortField) {
      persistSort(field, sortDirection === "asc" ? "desc" : "asc");
    } else {
      persistSort(field, defaultDirectionForField(field));
    }
  };

  const onSortFieldSelect = (field: ResourceSortField) => {
    const direction =
      field === sortField ? sortDirection : defaultDirectionForField(field);
    persistSort(field, direction);
  };

  const onSortDirectionToggle = () => {
    persistSort(sortField, sortDirection === "asc" ? "desc" : "asc");
  };

  const crumbHref = (crumb: Crumb) =>
    crumb.id ? projectFolderPath(projectId, crumb.id) : projectPath(projectId);

  const parentCrumb =
    crumbs.length > 1 ? crumbs[crumbs.length - 2] : null;
  const backHref = parentCrumb ? crumbHref(parentCrumb) : "/projects";
  const backLabel = parentCrumb ? parentCrumb.name : "Projects";

  const typeFilterButtons = [
    ["all", "All"],
    ["folder", "Folders"],
    ["file", "Files"],
  ] as const;

  const filterPills = (compact: boolean) =>
    typeFilterButtons.map(([value, label]) => (
      <button
        key={value}
        type="button"
        onClick={() => setTypeFilter(value)}
        className={`shrink-0 rounded-full ${
          compact ? "px-2.5 py-1 text-xs" : "px-4 py-1.5 text-sm"
        } ${
          typeFilter === value
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        {compact && value !== "all" ? label.replace(/s$/, "") : label}
      </button>
    ));

  const uploadControls = (compact: boolean) => {
    if (!canUpload) return null;
    if (folderFormOpen) {
      return (
        <form
          onSubmit={onCreateFolder}
          className={`flex min-w-0 items-center gap-1.5 ${
            compact ? "w-full" : "min-w-0 flex-1 flex-col gap-2 pl-2 sm:flex-row sm:items-center sm:pl-3"
          }`}
        >
          <input
            ref={folderInputRef}
            type="text"
            name="folderName"
            placeholder="Folder name"
            aria-label="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-400 sm:border-0 sm:bg-transparent sm:py-2"
          />
          <button
            type="submit"
            disabled={!newFolderName.trim()}
            className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
          >
            Create
          </button>
          <button
            type="button"
            onClick={cancelFolderForm}
            className="shrink-0 rounded-full px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 sm:px-4 sm:py-2 sm:text-sm"
          >
            Cancel
          </button>
        </form>
      );
    }
    return (
      <>
        <button
          type="button"
          onClick={() => setFolderFormOpen(true)}
          className={`inline-flex items-center justify-center gap-1 rounded-full font-medium text-zinc-800 hover:bg-zinc-50 ${
            compact
              ? "flex-1 border border-zinc-300 bg-white py-2 text-xs"
              : "px-3 py-2 text-sm"
          }`}
        >
          <FolderPlusIcon className="h-4 w-4 shrink-0" />
          {compact ? "Folder" : "Create new folder"}
        </button>
        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-1 rounded-full font-medium text-zinc-700 hover:bg-zinc-50 ${
            compact
              ? "flex-1 border border-zinc-300 bg-white py-2 text-xs"
              : "px-3 py-2 text-sm"
          }`}
        >
          <UploadIcon className="h-4 w-4 shrink-0" />
          {compact ? "Upload" : "Upload file"}
          <input
            type="file"
            className="hidden"
            onChange={onUpload}
            aria-label="Choose file to upload"
          />
        </label>
      </>
    );
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Compact chrome: phone & tablet */}
      <div className="shrink-0 space-y-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 lg:hidden">
        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-200/80"
            aria-label={`Back to ${backLabel}`}
          >
            <span aria-hidden className="text-lg leading-none">
              ←
            </span>
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-zinc-900">
            {currentFolderName}
          </h1>
          <ResourceViewToggle
            compact
            mode={viewMode}
            onChange={onViewModeChange}
          />
        </div>

        <label className="relative block">
          <span className="sr-only">Search files and folders</span>
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pl-8 pr-2 text-sm outline-none focus:border-zinc-500"
          />
        </label>

        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {filterPills(true)}
          </div>
          <ResourceSortControl
            compact
            sortField={sortField}
            sortDirection={sortDirection}
            onFieldChange={onSortFieldSelect}
            onDirectionToggle={onSortDirectionToggle}
          />
        </div>

        {canUpload && (
          <div className="flex gap-2">{uploadControls(true)}</div>
        )}
      </div>

      {/* Desktop chrome — fixed within panel */}
      <div className="mx-auto hidden w-full max-w-4xl shrink-0 space-y-4 px-4 pt-4 sm:px-6 sm:pt-6 lg:block">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-zinc-600 hover:text-zinc-900"
            >
              <span aria-hidden>←</span>
              Back to {backLabel}
            </Link>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-zinc-900">
              {currentFolderName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              <Link href="/projects" className="hover:text-zinc-800">
                Projects
              </Link>
              {crumbs.slice(0, -1).map((c) => (
                <span key={c.id ?? "root"} className="flex items-center gap-2">
                  <span>/</span>
                  <Link href={crumbHref(c)} className="hover:text-zinc-800">
                    {c.name}
                  </Link>
                </span>
              ))}
            </div>
          </div>
          <div className="flex w-full min-w-0 flex-col gap-2 lg:w-auto lg:items-end">
            <label className="relative block w-full min-w-0 lg:w-56">
              <span className="sr-only">Search files and folders</span>
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Search in folder"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-zinc-500"
              />
            </label>
            <ResourceViewToggle mode={viewMode} onChange={onViewModeChange} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">{filterPills(false)}</div>
          <ResourceSortControl
            sortField={sortField}
            sortDirection={sortDirection}
            onFieldChange={onSortFieldSelect}
            onDirectionToggle={onSortDirectionToggle}
          />
        </div>

        {canUpload && (
          <div className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white p-1.5">
            {folderFormOpen ? (
              uploadControls(false)
            ) : (
              <div className="flex w-full items-center justify-between gap-2 pl-1 pr-1">
                {uploadControls(false)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mx-auto flex w-full min-h-0 max-w-4xl flex-1 flex-col px-4 pb-4 pt-3 sm:px-6 lg:pt-4">
      {error && (
        <p className="shrink-0 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading resources…</p>
      ) : resources.length === 0 ? (
        <p className="text-zinc-500">
          {!debouncedSearch && typeFilter === "all"
            ? "This folder is empty."
            : "No items match your search or filter."}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {viewMode === "grid" ? (
            <ResourceVirtualGridView
              scrollResetKey={listScrollResetKey}
              projectId={projectId}
              resources={resources}
              canDelete={canDelete}
              onDelete={onDelete}
              hasMore={pagination?.hasMore ?? false}
              loading={loading}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          ) : (
            <ResourceVirtualTableView
              scrollResetKey={listScrollResetKey}
              projectId={projectId}
              resources={resources}
              canDelete={canDelete}
              onDelete={onDelete}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSortField}
              hasMore={pagination?.hasMore ?? false}
              loading={loading}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
          {pagination && pagination.total > 0 && (
            <p className="shrink-0 text-center text-sm text-zinc-500">
              Showing {Math.min(resources.length, pagination.total)} of{" "}
              {pagination.total}
            </p>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
