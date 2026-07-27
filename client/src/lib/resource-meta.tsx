import type { Resource } from "@/lib/types";

export function formatBytes(n?: number) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatResourceDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function resourceUserLabel(
  user?: Resource["createdBy"] | Resource["owner"]
) {
  if (!user) return "—";
  if (typeof user === "string") return user;
  const name = user.name?.trim();
  const email = user.email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || "—";
}

export function ResourceListMeta({ resource }: { resource: Resource }) {
  const createdBy = resourceUserLabel(resource.createdBy);
  const createdAt = formatResourceDate(resource.createdAt);
  const updatedAt = formatResourceDate(resource.updatedAt);
  const showUpdated =
    resource.updatedAt &&
    resource.createdAt &&
    resource.updatedAt !== resource.createdAt;

  return (
    <p className="mt-1 text-xs text-zinc-500">
      Created by {createdBy} · {createdAt}
      {showUpdated && <> · Updated {updatedAt}</>}
      {resource.type === "file" && (
        <>
          {" "}
          · {resource.mimeType || "file"}
          {resource.sizeBytes != null && ` · ${formatBytes(resource.sizeBytes)}`}
        </>
      )}
    </p>
  );
}
