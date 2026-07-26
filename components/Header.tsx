"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useSearch } from "./SearchProvider";
import { PlusIcon, SearchIcon } from "./icons";
import { saveTierList } from "@/lib/db";
import { createTierList } from "@/lib/tierlist";

export function Header() {
  const router = useRouter();
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
    const doc = createTierList("Nouvelle tier list");
    await saveTierList(doc);
    router.push(`/editor/${doc.id}`);
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-zinc-800 bg-black px-4 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2.5 text-white">
        <span className="flex h-8 w-8 -rotate-6 items-center justify-center rounded-md bg-ember font-display text-xl leading-none text-white shadow-sm shadow-ember/30">
          S
        </span>
        <span className="font-display text-2xl leading-none tracking-wide">TierList</span>
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
      </div>
    </header>
  );
}
