"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { POOL_ID } from "@/lib/constants";
import type { TierItem } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { SearchIcon } from "./icons";

interface PoolAreaProps {
  items: TierItem[];
  onItemClick: (item: TierItem) => void;
  onItemDelete: (itemId: string) => void;
  backgroundColor: string;
}

export function PoolArea({ items, onItemClick, onItemDelete, backgroundColor }: PoolAreaProps) {
  const { setNodeRef } = useDroppable({ id: POOL_ID });
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div ref={setNodeRef} className="rounded-lg border border-dashed border-zinc-700">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-zinc-700 px-3 py-2">
        <span className="text-sm font-medium text-zinc-400">
          Items non classés {items.length > 0 && `(${items.length})`}
        </span>
        {items.length > 0 && (
          <div className="flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1">
            <SearchIcon className="h-3.5 w-3.5 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-28 bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none sm:w-40"
            />
          </div>
        )}
      </div>
      <div className="flex min-h-20 flex-wrap content-start gap-2 p-3" style={{ backgroundColor }}>
        <SortableContext id={POOL_ID} items={filtered.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Ajoute des images ou des vidéos YouTube avec le bouton ci-dessus.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">{`Aucun item ne correspond à "${query}".`}</p>
          ) : (
            filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                onDelete={() => onItemDelete(item.id)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
