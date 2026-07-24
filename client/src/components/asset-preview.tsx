import type { Resource } from "@/lib/types";

function formatBytes(n?: number) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

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
  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
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
