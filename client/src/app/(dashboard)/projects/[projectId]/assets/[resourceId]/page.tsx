"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AssetMeta, AssetPreview } from "@/components/asset-preview";
import { ResourceFileIcon } from "@/lib/file-type-icons";
import { ApiError, resourcesApi } from "@/lib/api";
import { projectFolderPath, projectPath } from "@/lib/paths";
import type { Resource } from "@/lib/types";

export default function AssetPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const resourceId = params.resourceId as string;
  const [resource, setResource] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || !resourceId) return;
    resourcesApi
      .get(projectId, resourceId)
      .then((res) => {
        if (res.resource.type !== "file") {
          setError("This resource is not a file.");
          return;
        }
        setResource(res.resource);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Failed to load asset")
      )
      .finally(() => setLoading(false));
  }, [projectId, resourceId]);

  const backHref = resource?.parentId
    ? projectFolderPath(projectId, String(resource.parentId))
    : projectPath(projectId);

  if (loading) {
    return <p className="text-zinc-500">Loading asset…</p>;
  }

  if (error || !resource) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
        {error || "Asset not found"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="text-sm text-zinc-600 hover:text-emerald-900">
          ← Back to folder
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <ResourceFileIcon
            type="file"
            mimeType={resource.mimeType}
            name={resource.name}
          />
          <h1 className="text-2xl font-semibold">{resource.name}</h1>
        </div>
      </div>

      <AssetPreview resource={resource} />

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <AssetMeta resource={resource} />
        {resource.publicUrl && (
          <a
            href={resource.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
          >
            Open original in new tab
          </a>
        )}
      </div>
    </div>
  );
}
