"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type HomeView = "all" | "mine";

interface ViewContextValue {
  view: HomeView;
  setView: (view: HomeView) => void;
}

const ViewContext = createContext<ViewContextValue | null>(null);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<HomeView>("all");
  const value = useMemo(() => ({ view, setView }), [view]);
  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useView(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within a ViewProvider");
  return ctx;
}
