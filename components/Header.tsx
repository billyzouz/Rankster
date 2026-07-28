"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useSearch } from "./SearchProvider";
import { PlusIcon, SearchIcon } from "./icons";
import { saveTierList } from "@/lib/db";
import { createTierList } from "@/lib/tierlist";

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { query, setQuery } = useSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  async function handleCreate() {
    if (!user) {
      router.push("/login");
      return;
    }
    const doc = createTierList("Nouvelle tier list", user.id);
    await saveTierList(doc);
    router.push(`/editor/${doc.id}`);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-zinc-800 bg-black px-4 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="h-9 w-auto" />
        <span className="font-display text-2xl leading-none tracking-wide">Rankster</span>
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {searchOpen ? (
            <div className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 pl-2 pr-1">
              <SearchIcon className="h-4 w-4 text-zinc-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") closeSearch();
                }}
                placeholder="Rechercher une tier list..."
                className="w-40 bg-transparent py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none sm:w-56"
              />
              <button
                onClick={closeSearch}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                aria-label="Fermer la recherche"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={openSearch}
              className="rounded-md p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label="Rechercher"
              title="Rechercher une tier list"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <button
          onClick={handleCreate}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-ember px-3 py-2 text-sm font-semibold text-white transition hover:bg-ember-hover sm:px-4"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Créer une tier list</span>
        </button>

        {user ? (
          <>
            <Link
              href="/compte"
              title="Mon compte"
              className="hidden rounded-md p-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white sm:inline"
            >
              Mon compte
            </Link>
            <button
              onClick={handleSignOut}
              title="Se déconnecter"
              className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <span className="hidden text-sm sm:inline">Déconnexion</span>
              <span className="sm:hidden">⏻</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="flex shrink-0 items-center rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            Connexion
          </button>
        )}
      </div>
    </header>
  );
}
