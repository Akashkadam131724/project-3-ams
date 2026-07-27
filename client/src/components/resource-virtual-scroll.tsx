"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ResourceFileIcon } from "@/lib/file-type-icons";
import { formatModifiedShort } from "@/lib/format-date";
import { projectAssetPath, projectFolderPath } from "@/lib/paths";
import { resourceUserLabel } from "@/lib/resource-meta";
import type { ResourceSortDirection, ResourceSortField } from "@/lib/resource-sort";
import type { Resource } from "@/lib/types";
import { RowActionsMenu } from "@/components/row-actions-menu";
import {
  ResourceListRow,
  SortableColumnHeader,
} from "@/components/resource-views";

const LIST_ROW_MOBILE = 56;
const LIST_ROW_DESKTOP = 48;
const GRID_ROW_HEIGHT = 148;

function useMediaMinLg() {
  const [minLg, setMinLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setMinLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return minLg;
}

function useGridColumnCount() {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCols(4);
      else if (w >= 1024) setCols(3);
      else if (w >= 640) setCols(2);
      else setCols(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

function useLoadMoreNearEnd(
  endIndex: number | undefined,
  dataLength: number,
  hasMore: boolean,
  loading: boolean,
  loadingMore: boolean,
  onLoadMore: () => void
) {
  useEffect(() => {
    if (loading || loadingMore || !hasMore || endIndex == null) return;
    if (endIndex >= dataLength - 2) {
      onLoadMore();
    }
  }, [endIndex, dataLength, hasMore, loading, loadingMore, onLoadMore]);
}

function resourceHref(projectId: string, resource: Resource) {
  return resource.type === "folder"
    ? projectFolderPath(projectId, resource._id)
    : projectAssetPath(projectId, resource._id);
}

function VirtualLoaderRow({ height }: { height: number }) {
  return (
    <div
      role="listitem"
      className="flex items-center justify-center border-b border-zinc-200 text-sm text-zinc-500"
      style={{ height }}
    >
      Loading more…
    </div>
  );
}

function useListScrollContainer(
  scrollResetKey: string,
  itemCount: number,
  hasMore: boolean,
  loading: boolean,
  loadingMore: boolean,
  onLoadMore: () => void
) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollResetKey]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading || loadingMore || !hasMore) return;
    const id = requestAnimationFrame(() => {
      if (el.scrollHeight <= el.clientHeight + 24) {
        onLoadMore();
      }
    });
    return () => cancelAnimationFrame(id);
  }, [itemCount, loading, loadingMore, hasMore, onLoadMore]);

  return scrollRef;
}

export function ResourceVirtualTableView({
  scrollResetKey,
  projectId,
  resources,
  canDelete,
  onDelete,
  sortField,
  sortDirection,
  onSort,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
}: {
  scrollResetKey: string;
  projectId: string;
  resources: Resource[];
  canDelete: boolean;
  onDelete: (r: Resource) => void;
  sortField: ResourceSortField;
  sortDirection: ResourceSortDirection;
  onSort: (field: ResourceSortField) => void;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const scrollRef = useListScrollContainer(
    scrollResetKey,
    resources.length,
    hasMore,
    loading,
    loadingMore,
    onLoadMore
  );
  const minLg = useMediaMinLg();
  const rowHeight = minLg ? LIST_ROW_DESKTOP : LIST_ROW_MOBILE;
  const extraRows = loadingMore ? 1 : 0;
  const count = resources.length + extraRows;

  const getScrollElement = useCallback(
    () => scrollRef.current,
    [scrollRef]
  );

  const virtualizer = useVirtualizer({
    count,
    getScrollElement,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  useLoadMoreNearEnd(
    virtualizer.range?.endIndex,
    resources.length,
    hasMore,
    loading,
    loadingMore,
    onLoadMore
  );

  const items = virtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent lg:rounded-xl lg:border lg:border-zinc-200/80 lg:bg-white">
      <div className="shrink-0 hidden border-b border-zinc-200 px-4 py-2.5 lg:grid lg:bg-white lg:grid-cols-[1fr_8rem_6rem_2.5rem] lg:gap-4">
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
      <div
        ref={scrollRef}
        className="ams-scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
      >
        <div
          role="list"
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {items.map((vi) => {
            const isLoader = vi.index >= resources.length;
            return (
              <div
                key={vi.key}
                className="absolute left-0 top-0 w-full"
                style={{
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                {isLoader ? (
                  <VirtualLoaderRow height={rowHeight} />
                ) : (
                  <ResourceListRow
                    projectId={projectId}
                    resource={resources[vi.index]}
                    canDelete={canDelete}
                    onDelete={onDelete}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GridCard({
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
  const href = resourceHref(projectId, r);
  const modified = formatModifiedShort(r.updatedAt || r.createdAt);

  return (
    <li className="group flex h-[132px] flex-col rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
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
      <p className="mt-1 truncate text-xs text-zinc-500">
        {modified} · {resourceUserLabel(r.createdBy).split(" (")[0]}
      </p>
    </li>
  );
}

export function ResourceVirtualGridView({
  scrollResetKey,
  projectId,
  resources,
  canDelete,
  onDelete,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
}: {
  scrollResetKey: string;
  projectId: string;
  resources: Resource[];
  canDelete: boolean;
  onDelete: (r: Resource) => void;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  const scrollRef = useListScrollContainer(
    scrollResetKey,
    resources.length,
    hasMore,
    loading,
    loadingMore,
    onLoadMore
  );
  const columnCount = useGridColumnCount();
  const rowCount =
    Math.ceil(resources.length / columnCount) + (loadingMore ? 1 : 0);

  const getScrollElement = useCallback(
    () => scrollRef.current,
    [scrollRef]
  );

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement,
    estimateSize: () => GRID_ROW_HEIGHT,
    overscan: 4,
  });

  useLoadMoreNearEnd(
    virtualizer.range?.endIndex,
    Math.ceil(resources.length / columnCount) || 0,
    hasMore,
    loading,
    loadingMore,
    onLoadMore
  );

  const items = virtualizer.getVirtualItems();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="ams-scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
      >
        <div
          role="list"
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {items.map((vi) => {
            const isLoaderRow =
              vi.index >= Math.ceil(resources.length / columnCount);
            const start = vi.index * columnCount;
            const rowResources = resources.slice(start, start + columnCount);

            return (
              <div
                key={vi.key}
                role="listitem"
                className="absolute left-0 top-0 w-full"
                style={{
                  height: vi.size,
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <p className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Loading more…
                  </p>
                ) : (
                  <ul
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {rowResources.map((r) => (
                      <GridCard
                        key={r._id}
                        projectId={projectId}
                        resource={r}
                        canDelete={canDelete}
                        onDelete={onDelete}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
