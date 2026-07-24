import type {
  ApiErrorBody,
  MemberActivity,
  Project,
  ProjectMemberRow,
  ProjectRole,
  Resource,
  ResourceActivity,
  User,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3004";

export class ApiError extends Error {
  status: number;
  errorType?: ApiErrorBody["errorType"];
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody
  ) {
    super(message);
    this.status = status;
    this.errorType = body?.errorType;
    this.fieldErrors = body?.errors;
  }
}

async function parseJson<T>(res: Response): Promise<T | undefined> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const data = await parseJson<T & ApiErrorBody>(res);

  if (!res.ok) {
    const message =
      (data && "message" in data && data.message) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data as ApiErrorBody);
  }

  return data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ message: string; user: User }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<{ message: string }>("/api/v1/auth/logout", {
      method: "POST",
    }),

  me: () => apiFetch<{ user: User }>("/api/v1/auth/me"),
};

export const usersApi = {
  list: () => apiFetch<User[]>("/api/v1/users"),

  create: (payload: { name: string; email: string; password: string }) =>
    apiFetch<User>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  setDisabled: (userId: string, isDisabled: boolean) =>
    apiFetch<{ message: string; user: User }>(
      `/api/v1/users/${userId}/disabled`,
      {
        method: "PATCH",
        body: JSON.stringify({ isDisabled }),
      }
    ),
};

export const projectsApi = {
  list: () => apiFetch<{ projects: Project[] }>("/api/v1/projects"),

  get: (projectId: string) =>
    apiFetch<{
      project: Project;
      role?: ProjectRole;
      permissions?: string[];
    }>(`/api/v1/projects/${projectId}`),

  create: (payload: {
    name: string;
    description?: string;
    ownerId?: string;
  }) =>
    apiFetch<{ message: string; project: Project }>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  assignOwner: (projectId: string, userId: string) =>
    apiFetch<{ message: string; member: unknown }>(
      `/api/v1/projects/${projectId}/owner`,
      {
        method: "POST",
        body: JSON.stringify({ userId }),
      }
    ),

  removeOwner: (projectId: string) =>
    apiFetch<{ message: string; id: string }>(
      `/api/v1/projects/${projectId}/owner`,
      { method: "DELETE" }
    ),
};

export const membersApi = {
  list: (projectId: string) =>
    apiFetch<{
      project: { _id: string; name: string };
      members: ProjectMemberRow[];
    }>(`/api/v1/projects/${projectId}/members`),

  candidates: (projectId: string, search?: string) => {
    const qs = search
      ? `?search=${encodeURIComponent(search)}`
      : "";
    return apiFetch<{ users: Pick<User, "_id" | "name" | "email">[] }>(
      `/api/v1/projects/${projectId}/members/candidates${qs}`
    );
  },

  add: (
    projectId: string,
    payload: { email?: string; userId?: string; role: ProjectRole }
  ) =>
    apiFetch<{ message: string; member: unknown }>(
      `/api/v1/projects/${projectId}/members`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  updateRole: (projectId: string, memberId: string, role: ProjectRole) =>
    apiFetch<{ message: string; member: unknown }>(
      `/api/v1/projects/${projectId}/members/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }
    ),

  remove: (projectId: string, memberId: string) =>
    apiFetch<{ message: string; id: string }>(
      `/api/v1/projects/${projectId}/members/${memberId}`,
      { method: "DELETE" }
    ),
};

export const resourceActivityApi = {
  list: (projectId: string, page = 1, limit = 50) =>
    apiFetch<{
      activities: ResourceActivity[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(
      `/api/v1/projects/${projectId}/activity?page=${page}&limit=${limit}`
    ),
};

export const memberActivityApi = {
  list: (projectId: string, page = 1, limit = 50) =>
    apiFetch<{
      activities: MemberActivity[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(
      `/api/v1/projects/${projectId}/members/activity?page=${page}&limit=${limit}`
    ),
};

export const resourcesApi = {
  list: (projectId: string, folderId?: string | null) => {
    const qs = folderId
      ? `?resourceId=${encodeURIComponent(folderId)}`
      : "";
    return apiFetch<{ resources: Resource[] }>(
      `/api/v1/projects/${projectId}/resources${qs}`
    );
  },

  get: (projectId: string, resourceId: string) =>
    apiFetch<{ resource: Resource }>(
      `/api/v1/projects/${projectId}/resources/${resourceId}`
    ),

  createFolder: (
    projectId: string,
    name: string,
    resourceId?: string | null
  ) =>
    apiFetch<{ message: string; resource: Resource }>(
      `/api/v1/projects/${projectId}/resources/folder`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          ...(resourceId ? { resourceId } : {}),
        }),
      }
    ),

  uploadFile: (
    projectId: string,
    file: File,
    folderId?: string | null
  ) => {
    const form = new FormData();
    form.append("file", file);
    if (folderId) form.append("resourceId", folderId);
    return apiFetch<{ message: string; resource: Resource }>(
      `/api/v1/projects/${projectId}/resources/file`,
      { method: "POST", body: form }
    );
  },

  rename: (projectId: string, resourceId: string, name: string) =>
    apiFetch<{ message: string; resource: Resource }>(
      `/api/v1/projects/${projectId}/resources/${resourceId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }
    ),

  delete: (projectId: string, resourceId: string) =>
    apiFetch<{ message: string; id: string }>(
      `/api/v1/projects/${projectId}/resources/${resourceId}`,
      { method: "DELETE" }
    ),
};

export { API_BASE };
