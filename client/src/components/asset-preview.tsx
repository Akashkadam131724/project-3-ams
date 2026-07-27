import type { Resource } from "@/lib/types";
import {
  formatBytes,
  formatResourceDate,
  resourceUserLabel,
} from "@/lib/resource-meta";

export function AssetPreview({ resource }: { resource: Resource }) {
  const url = resource.publicUrl;
  const mime = resource.mimeType || "";

  if (!url) {
    return (
      <p className="text-sm text-zinc-500">No file URL available for preview.</p>
    );
  }

  if (mime.startsWith("image/")) {
    return (
      <div className="flex justify-center rounded-lg border border-zinc-200 bg-zinc-100 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={resource.name}
          className="max-h-[70vh] max-w-full object-contain"
        />
      </div>
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <video
        src={url}
        controls
        className="max-h-[70vh] w-full rounded-lg border border-zinc-200 bg-black"
      >
        <track kind="captions" />
      </video>
    );
  }

  if (mime.startsWith("audio/")) {
    return (
      <audio src={url} controls className="w-full">
        <track kind="captions" />
      </audio>
    );
  }

  if (mime === "application/pdf") {
    return (
      <iframe
        src={url}
        title={resource.name}
        className="h-[75vh] w-full rounded-lg border border-zinc-200 bg-white"
      />
    );
  }

  if (mime.startsWith("text/") || mime === "application/json") {
    return (
      <iframe
        src={url}
        title={resource.name}
        className="h-[60vh] w-full rounded-lg border border-zinc-200 bg-white"
      />
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center">
      <p className="text-sm text-zinc-600">
        Preview is not available for this file type ({mime || "unknown"}).
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        Open or download file
      </a>
    </div>
  );
}

export function AssetMeta({ resource }: { resource: Resource }) {
  const ownerLabel = resource.owner
    ? resourceUserLabel(resource.owner)
    : null;
  const createdByLabel = resourceUserLabel(resource.createdBy);
  const showUpdated =
    resource.updatedAt &&
    resource.createdAt &&
    resource.updatedAt !== resource.createdAt;

  return (
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-zinc-500">Created by</dt>
        <dd>{createdByLabel}</dd>
      </div>
      <div>
        <dt className="text-zinc-500">Created</dt>
        <dd>{formatResourceDate(resource.createdAt)}</dd>
      </div>
      {showUpdated && (
        <div>
          <dt className="text-zinc-500">Last updated</dt>
          <dd>{formatResourceDate(resource.updatedAt)}</dd>
        </div>
      )}
      {ownerLabel && ownerLabel !== createdByLabel && (
        <div>
          <dt className="text-zinc-500">File owner</dt>
          <dd>{ownerLabel}</dd>
        </div>
      )}
      <div>
        <dt className="text-zinc-500">MIME type</dt>
        <dd>{resource.mimeType || "—"}</dd>
      </div>
      <div>
        <dt className="text-zinc-500">Size</dt>
        <dd>{formatBytes(resource.sizeBytes) || "—"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-zinc-500">Original filename</dt>
        <dd>{resource.originalFilename || resource.name}</dd>
      </div>
    </dl>
  );
}
