"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MainScrollMode = "page" | "locked";

type DashboardLayoutContextValue = {
  mainScroll: MainScrollMode;
  setMainScroll: (mode: MainScrollMode) => void;
};

const DashboardLayoutContext =
  createContext<DashboardLayoutContextValue | null>(null);

export function DashboardLayoutProvider({ children }: { children: ReactNode }) {
  const [mainScroll, setMainScroll] = useState<MainScrollMode>("page");

  const value = useMemo(
    () => ({ mainScroll, setMainScroll }),
    [mainScroll]
  );

  return (
    <DashboardLayoutContext.Provider value={value}>
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  const ctx = useContext(DashboardLayoutContext);
  if (!ctx) {
    throw new Error("useDashboardLayout must be used within DashboardLayoutProvider");
  }
  return ctx;
}

/** Only the resource list scrolls; chrome stays fixed inside the main panel. */
export function useResourceBrowserScrollLock() {
  const { setMainScroll } = useDashboardLayout();
  useEffect(() => {
    setMainScroll("locked");
    return () => setMainScroll("page");
  }, [setMainScroll]);
}
