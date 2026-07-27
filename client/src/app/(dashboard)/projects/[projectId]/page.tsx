"use client";

import { useParams } from "next/navigation";
import { ResourceBrowser } from "@/components/resource-browser";
import { useProjectAccess } from "@/hooks/use-project-access";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const access = useProjectAccess(projectId);

  if (access.error) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
        {access.error}
      </p>
    );
  }

  return (
    <ResourceBrowser
      projectId={projectId}
      projectName={access.projectName ?? "Project"}
      folderId={null}
      canUpload={access.canUpload}
      canDelete={access.canDeleteResources}
    />
  );
}
