export function projectPath(projectId: string) {
  return `/projects/${projectId}`;
}

export function projectFolderPath(projectId: string, folderId: string) {
  return `/projects/${projectId}/folders/${folderId}`;
}

export function projectAssetPath(projectId: string, resourceId: string) {
  return `/projects/${projectId}/assets/${resourceId}`;
}
