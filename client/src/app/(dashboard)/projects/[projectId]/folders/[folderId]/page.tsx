"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResourceBrowser } from "@/components/resource-browser";
import { ApiError, projectsApi } from "@/lib/api";

function useProjectName(projectId: string) {
  const [projectName, setProjectName] = useState("Project");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    projectsApi
      .get(projectId)
      .then((res) => setProjectName(res.project.name))
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Project not found")
      );
  }, [projectId]);

  return { projectName, error };
}

export default function ProjectFolderPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const folderId = params.folderId as string;
  const { projectName, error } = useProjectName(projectId);

  if (error) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </p>
    );
  }

  return (
    <ResourceBrowser
      projectId={projectId}
      projectName={projectName}
      folderId={folderId}
    />
  );
}
