"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cloneTierList, createTierList } from "@/lib/tierlist";
import { deleteTierList, listTierLists, saveTierList } from "@/lib/db";
import type { TierListDoc } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [lists, setLists] = useState<TierListDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLists(await listTierLists());
    setLoading(false);
  }

  async function handleCreate() {
    const doc = createTierList("Nouvelle tier list");
    await saveTierList(doc);
    router.push(`/editor/${doc.id}`);
  }

  async function handleDuplicate(doc: TierListDoc) {
    const copy = cloneTierList(doc, `${doc.title} (copie)`);
    await saveTierList(copy);
    refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette tier list ?")) return;
    await deleteTierList(id);
    refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mes tier lists</h1>
        <button
          onClick={handleCreate}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          + Créer une tier list
        </button>
      </header>

      {loading ? (
        <p className="text-zinc-500">Chargement...</p>
      ) : lists.length === 0 ? (
        <p className="text-zinc-500">
          Aucune tier list pour l&apos;instant. Crée-en une pour classer tes images et vidéos
          YouTube préférées.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {lists.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <button
                className="text-left text-lg font-semibold hover:underline"
                onClick={() => router.push(`/editor/${doc.id}`)}
              >
                {doc.title || "Sans titre"}
              </button>
              <p className="text-xs text-zinc-500">
                {doc.items.length} item{doc.items.length > 1 ? "s" : ""} · {doc.tiers.length} tiers
              </p>
              <div className="mt-2 flex gap-3 text-xs">
                <button onClick={() => handleDuplicate(doc)} className="text-zinc-500 hover:underline">
                  Dupliquer
                </button>
                <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:underline">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
