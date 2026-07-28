"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Header } from "./Header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (user && isAuthPage) router.replace("/");
  }, [user, loading, isAuthPage, router]);

  // Only the login page needs to wait on auth (to avoid flashing the form right before
  // redirecting an already-logged-in user away) — every other page should render its
  // real content immediately, both for a fast first paint and so it's there server-side
  // for crawlers instead of being replaced by a client-only loading placeholder.
  if (isAuthPage && (loading || user)) {
    return <div className="flex flex-1 items-center justify-center text-zinc-500">Chargement...</div>;
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-zinc-800 px-4 py-4 text-xs text-zinc-500">
        <a href="/mentions-legales" className="hover:text-zinc-300 hover:underline">
          Mentions légales
        </a>
        <a href="/confidentialite" className="hover:text-zinc-300 hover:underline">
          Confidentialité
        </a>
      </footer>
    </>
  );
}
