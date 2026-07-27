"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { projectsApi } from "@/lib/api";
import {
  canDeleteResources,
  canManageMembers,
  canUpload,
  canViewActivity,
} from "@/lib/permissions";
import type { ProjectRole } from "@/lib/types";

type ProjectAccessState = {
  projectName: string | null;
  role: ProjectRole | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  canViewActivity: boolean;
  canManageMembers: boolean;
  canUpload: boolean;
  canDeleteResources: boolean;
};

const empty: ProjectAccessState = {
  projectName: null,
  role: null,
  permissions: [],
  loading: false,
  error: null,
  canViewActivity: false,
  canManageMembers: false,
  canUpload: false,
  canDeleteResources: false,
};

export function useProjectAccess(projectId: string | null): ProjectAccessState {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const [state, setState] = useState<ProjectAccessState>({
    ...empty,
    loading: Boolean(projectId),
  });

  useEffect(() => {
    if (!projectId) {
      setState(empty);
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    projectsApi
      .get(projectId)
      .then((res) => {
        if (cancelled) return;
        const permissions = res.permissions ?? [];
        setState({
          projectName: res.project.name,
          role: res.role ?? null,
          permissions,
          loading: false,
          error: null,
          canViewActivity: canViewActivity(isSuperAdmin, permissions),
          canManageMembers: canManageMembers(isSuperAdmin, permissions),
          canUpload: canUpload(isSuperAdmin, permissions),
          canDeleteResources: canDeleteResources(isSuperAdmin, permissions),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ ...empty, loading: false, error: "Project not found" });
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, isSuperAdmin]);

  return state;
}
