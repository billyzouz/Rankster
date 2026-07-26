"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { POOL_ID } from "@/lib/constants";
import type { TierItem } from "@/lib/types";
import { ItemCard } from "./ItemCard";

interface PoolAreaProps {
  items: TierItem[];
  onItemClick: (item: TierItem) => void;
}

export function PoolArea({ items, onItemClick }: PoolAreaProps) {
  const { setNodeRef } = useDroppable({ id: POOL_ID });

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
      <div className="border-b border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700">
        Items non classés
      </div>
      <div ref={setNodeRef} className="flex min-h-24 flex-wrap gap-2 p-3">
        <SortableContext id={POOL_ID} items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-400">
              Ajoute des images ou des vidéos YouTube avec le bouton ci-dessus.
            </p>
          ) : (
            items.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
