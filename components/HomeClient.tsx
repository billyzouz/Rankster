"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSearch } from "@/components/SearchProvider";
import { useToast } from "@/components/ToastProvider";
import { useView } from "@/components/ViewProvider";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { TierListCard } from "@/components/TierListCard";
import { deleteTierList, listTierLists, saveTierList } from "@/lib/db";
import { cloneTierList } from "@/lib/tierlist";
import type { TierListDoc } from "@/lib/types";

const PAGE_SIZE = 12;

interface HomeClientProps {
  initialLists: TierListDoc[];
}

export function HomeClient({ initialLists }: HomeClientProps) {
  const { user, isAdmin } = useAuth();
  const { query } = useSearch();
  const { showToast } = useToast();
  const { view } = useView();
  const [lists, setLists] = useState<TierListDoc[]>(initialLists);
  const [loading, setLoading] = useState(initialLists.length === 0);
  const [page, setPage] = useState(1);
  const [lastQuery, setLastQuery] = useState(query);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLists(await listTierLists());
    setLoading(false);
  }

  async function handleDuplicate(doc: TierListDoc) {
    if (!user) return;
    const copy = cloneTierList(doc, `${doc.title} (copie)`, user.id);
    await saveTierList(copy);
    showToast("Copiée dans tes tier lists");
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette tier list ?")) return;
    await deleteTierList(id);
    refresh();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lists
      .filter((doc) =>
        view === "mine"
          ? doc.ownerId === user?.id
          // Others' unlisted lists stay reachable by direct link, but shouldn't show up here.
          : doc.visibility === "public",
      )
      .filter((doc) => !q || doc.title.toLowerCase().includes(q));
  }, [lists, query, user?.id, view]);

  if (query !== lastQuery) {
    setLastQuery(query);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-white">
          {view === "mine" ? "Mes tier lists" : "Toutes les tier lists"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {view === "mine"
            ? "Les tier lists que tu as créées, privées ou non."
            : "Toutes les tier lists publiques de la communauté."}
        </p>
      </div>

      {view === "mine" && !user ? (
        <p className="text-zinc-500">
          Connecte-toi pour voir et créer tes propres tier lists.
        </p>
      ) : loading ? (
        <p className="text-zinc-500">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500">
          {query
            ? "Aucune tier list ne correspond à ta recherche."
            : view === "mine"
              ? "Aucune tier list pour l'instant. Crée-en une avec le bouton en haut à droite."
              : "Aucune tier list publique pour l'instant."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginated.map((doc) => (
              <TierListCard
                key={doc.id}
                doc={doc}
                isOwner={doc.ownerId === user?.id}
                canDelete={doc.ownerId === user?.id || isAdmin}
                onDuplicate={() => handleDuplicate(doc)}
                onDelete={() => handleDelete(doc.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Page précédente"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? "page" : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition ${
                    n === currentPage
                      ? "bg-ember text-white"
                      : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Page suivante"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
