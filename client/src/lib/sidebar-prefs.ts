const STORAGE_KEY = "ams-sidebar-collapsed";

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function writeSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
}
