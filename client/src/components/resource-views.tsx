"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResourceFileIcon } from "@/lib/file-type-icons";
import { formatModifiedShort } from "@/lib/format-date";
import { resourceUserLabel } from "@/lib/resource-meta";
import { projectAssetPath, projectFolderPath } from "@/lib/paths";
import { RowActionsMenu } from "@/components/row-actions-menu";
import {
  RESOURCE_SORT_FIELDS,
  type ResourceSortDirection,
  type ResourceSortField,
} from "@/lib/resource-sort";
import type { Resource } from "@/lib/types";

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: ResourceSortDirection;
}) {
  if (!active) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover/sort:opacity-40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M8 9h8M8 15h8" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      {direction === "asc" ? (
        <path d="M12 5v14M5 12l7-7 7 7" />
      ) : (
        <path d="M12 19V5M5 12l7 7 7-7" />
      )}
    </svg>
  );
}

export function SortableColumnHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className = "",
}: {
  label: string;
  field: ResourceSortField;
  sortField: ResourceSortField;
  sortDirection: ResourceSortDirection;
  onSort: (field: ResourceSortField) => void;
  className?: string;
}) {
  const active = sortField === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`group/sort inline-flex items-center gap-1 text-xs font-medium hover:text-emerald-800 ${active ? "text-emerald-900" : "text-zinc-500"} ${className}`}
      aria-sort={
        active
          ? sortDirection === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      {label}
      <SortIndicator active={active} direction={sortDirection} />
    </button>
  );
}

export function ResourceSortControl({
  sortField,
  sortDirection,
  onFieldChange,
  onDirectionToggle,
  compact = false,
}: {
  sortField: ResourceSortField;
  sortDirection: ResourceSortDirection;
  onFieldChange: (field: ResourceSortField) => void;
  onDirectionToggle: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-1 ${compact ? "shrink-0" : "w-full sm:w-auto sm:flex-nowrap"}`}
    >
      <label className="sr-only" htmlFor="resource-sort-field">
        Sort by
      </label>
      <select
        id="resource-sort-field"
        value={sortField}
        onChange={(e) => onFieldChange(e.target.value as ResourceSortField)}
        className={`min-w-0 rounded-full border border-zinc-300 bg-white text-zinc-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 ${
          compact
            ? "max-w-[7.5rem] py-1 pl-2 pr-6 text-xs"
            : "flex-1 py-1.5 pl-3 pr-8 text-sm sm:flex-none sm:min-w-[9rem]"
        }`}
      >
        {RESOURCE_SORT_FIELDS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onDirectionToggle}
        className={`rounded-full border border-zinc-300 text-zinc-700 hover:bg-emerald-50 ${
          compact ? "p-1.5" : "p-2"
        }`}
        aria-label={
          sortDirection === "asc" ? "Sort ascending" : "Sort descending"
        }
        title={sortDirection === "asc" ? "Ascending" : "Descending"}
      >
        <SortIndicator active direction={sortDirection} />
      </button>
    </div>
  );
}

function resourceHref(projectId: string, resource: Resource) {
  return resource.type === "folder"
    ? projectFolderPath(projectId, resource._id)
    : projectAssetPath(projectId, resource._id);
}

export function ResourceListRow({
  projectId,
  resource: r,
  canDelete,
  onDelete,
}: {
  projectId: string;
  resource: Resource;
  canDelete: boolean;
  onDelete: (r: Resource) => void;
}) {
  const router = useRouter();
  const modified = formatModifiedShort(r.updatedAt || r.createdAt);
  const href = resourceHref(projectId, r);
  const creator = resourceUserLabel(r.createdBy).split(" (")[0];
  const menuItems = [
    {
      id: "open",
      label: r.type === "folder" ? "Open folder" : "Open file",
      onClick: () => router.push(href),
    },
    ...(canDelete
      ? [
          {
            id: "delete",
            label: "Delete",
            variant: "danger" as const,
            onClick: () => onDelete(r),
          },
        ]
      : []),
  ];

  return (
    <div
      role="listitem"
      data-row-actions
      className="border-b border-zinc-200 ams-row-hover"
    >
      <div className="flex h-14 items-center gap-3 px-0 lg:hidden">
        <ResourceFileIcon
          type={r.type}
          mimeType={r.mimeType}
          name={r.name}
          className="h-9 w-9 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            className="block truncate font-medium text-zinc-900 hover:underline"
          >
            {r.name}
          </Link>
          <p className="truncate text-xs text-zinc-500">
            {modified} · {creator}
          </p>
        </div>
        <RowActionsMenu items={menuItems} />
      </div>
      <div className="group hidden h-12 grid-cols-[1fr_8rem_6rem_2.5rem] items-center gap-4 px-4 lg:grid">
        <div className="flex min-w-0 items-center gap-3">
          <ResourceFileIcon
            type={r.type}
            mimeType={r.mimeType}
            name={r.name}
            className="h-8 w-8"
          />
          <Link
            href={href}
            className="min-w-0 truncate font-medium text-zinc-900 hover:underline"
          >
            {r.name}
          </Link>
        </div>
        <span className="truncate text-sm text-zinc-500">{creator}</span>
        <span className="text-right text-sm text-zinc-500">{modified}</span>
        <div className="flex justify-end">
          <RowActionsMenu items={menuItems} />
        </div>
      </div>
    </div>
  );
}

export function ResourceTableView({
  projectId,
  resources,
  canDelete,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: {
  projectId: string;
  resources: Resource[];
  canDelete: boolean;
  onDelete: (r: Resource) => void;
  sortField: ResourceSortField;
  sortDirection: ResourceSortDirection;
  onSort: (field: ResourceSortField) => void;
}) {
  return (
    <div className="overflow-hidden bg-transparent lg:rounded-xl lg:border lg:border-zinc-200/80 lg:bg-white">
      <div className="hidden border-b border-zinc-200 px-4 py-2.5 lg:grid lg:grid-cols-[1fr_8rem_6rem_2.5rem] lg:gap-4">
        <SortableColumnHeader
          label="Name"
          field="name"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <SortableColumnHeader
          label="Created by"
          field="creator"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <SortableColumnHeader
          label="Modified"
          field="modified"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="ml-auto justify-end"
        />
        <span className="sr-only">Actions</span>
      </div>
      <div role="list">
        {resources.map((r) => (
          <ResourceListRow
            key={r._id}
            projectId={projectId}
            resource={r}
            canDelete={canDelete}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export function ResourceGridView({
  projectId,
  resources,
  canDelete,
  onDelete,
}: {
  projectId: string;
  resources: Resource[];
  canDelete: boolean;
  onDelete: (r: Resource) => void;
}) {
  const router = useRouter();

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {resources.map((r) => {
        const href = resourceHref(projectId, r);
        const modified = formatModifiedShort(r.updatedAt || r.createdAt);
        return (
          <li
            key={r._id}
            className="group flex flex-col rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <ResourceFileIcon
                type={r.type}
                mimeType={r.mimeType}
                name={r.name}
                className="h-11 w-11"
              />
              <RowActionsMenu
                items={[
                  {
                    id: "open",
                    label: "Open",
                    onClick: () => router.push(href),
                  },
                  ...(canDelete
                    ? [
                        {
                          id: "delete",
                          label: "Delete",
                          variant: "danger" as const,
                          onClick: () => onDelete(r),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
            <Link
              href={href}
              className="mt-3 block truncate font-medium text-zinc-900 hover:underline"
            >
              {r.name}
            </Link>
            <p className="mt-1 text-xs text-zinc-500">
              {modified} · {resourceUserLabel(r.createdBy).split(" (")[0]}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export type ResourceViewMode = "list" | "grid";

const STORAGE_KEY = "ams-resource-view";

export function readResourceViewMode(): ResourceViewMode {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "grid" ? "grid" : "list";
}

export function writeResourceViewMode(mode: ResourceViewMode) {
  localStorage.setItem(STORAGE_KEY, mode);
}

function ListViewIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function GridViewIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function ResourceViewToggle({
  mode,
  onChange,
  compact = false,
}: {
  mode: ResourceViewMode;
  onChange: (mode: ResourceViewMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`inline-flex shrink-0 rounded-full border border-zinc-300 p-0.5 ${
        compact ? "" : "w-full max-w-full sm:w-auto"
      }`}
      role="group"
      aria-label="View layout"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`inline-flex items-center justify-center rounded-full ${
          compact ? "p-1.5" : "flex-1 gap-1.5 px-3 py-1.5 text-sm sm:flex-none"
        } ${
          mode === "list"
            ? "ams-segment-active"
            : "text-zinc-600 hover:bg-emerald-50"
        }`}
        aria-pressed={mode === "list"}
        title="List view"
      >
        <ListViewIcon className={compact ? "h-4 w-4" : "h-4 w-4"} />
        {!compact && <span>List</span>}
        {compact && <span className="sr-only">List</span>}
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`inline-flex items-center justify-center rounded-full ${
          compact ? "p-1.5" : "flex-1 gap-1.5 px-3 py-1.5 text-sm sm:flex-none"
        } ${
          mode === "grid"
            ? "ams-segment-active"
            : "text-zinc-600 hover:bg-emerald-50"
        }`}
        aria-pressed={mode === "grid"}
        title="Card view"
      >
        <GridViewIcon className="h-4 w-4" />
        {!compact && <span>Cards</span>}
        {compact && <span className="sr-only">Cards</span>}
      </button>
    </div>
  );
}
