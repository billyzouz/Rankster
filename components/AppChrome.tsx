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

  if (loading || (user && isAuthPage)) {
    return <div className="flex flex-1 items-center justify-center text-zinc-500">Chargement...</div>;
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
    </>
  );
}
