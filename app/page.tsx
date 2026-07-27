"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSearch } from "@/components/SearchProvider";
import { TierListCard } from "@/components/TierListCard";
import { deleteTierList, listTierLists, saveTierList } from "@/lib/db";
import { cloneTierList } from "@/lib/tierlist";
import type { TierListDoc } from "@/lib/types";

export default function Home() {
  const { user, isAdmin } = useAuth();
  const { query } = useSearch();
  const [lists, setLists] = useState<TierListDoc[]>([]);
  const [loading, setLoading] = useState(true);

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
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette tier list ?")) return;
    await deleteTierList(id);
    refresh();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [lists, query]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-8">
      <div>
        <h1 className="font-display text-4xl tracking-wide text-white">
          {user ? "Mes tier lists" : "Tier lists publiques"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {user
            ? "Classe des images et des vidéos YouTube dans des tiers, à ta façon."
            : "Connecte-toi pour créer et sauvegarder tes propres tier lists."}
        </p>
      </div>

      {loading ? (
        <p className="text-zinc-500">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-zinc-500">
          {query
            ? "Aucune tier list ne correspond à ta recherche."
            : user
              ? "Aucune tier list pour l'instant. Crée-en une avec le bouton en haut à droite."
              : "Aucune tier list publique pour l'instant."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((doc) => (
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
      )}
    </div>
  );
}
