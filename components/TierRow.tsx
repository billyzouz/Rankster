"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import type { Tier, TierItem } from "@/lib/types";
import { ItemCard } from "./ItemCard";

interface TierRowProps {
  tier: Tier;
  items: TierItem[];
  onRename: (label: string) => void;
  onRecolor: (color: string) => void;
  onDelete: () => void;
  onItemClick: (item: TierItem) => void;
}

export function TierRow({ tier, items, onRename, onRecolor, onDelete, onItemClick }: TierRowProps) {
  const { setNodeRef } = useDroppable({ id: tier.id });

  return (
    <div className="flex border-b border-zinc-200 last:border-b-0 dark:border-zinc-800">
      <div
        className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 p-2 text-center"
        style={{ backgroundColor: tier.color }}
      >
        <input
          value={tier.label}
          onChange={(e) => onRename(e.target.value)}
          className="w-full bg-transparent text-center text-lg font-bold text-white outline-none placeholder:text-white/70"
          maxLength={12}
        />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={tier.color}
            onChange={(e) => onRecolor(e.target.value)}
            className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
            title="Couleur du tier"
          />
          <button
            onClick={onDelete}
            className="text-xs text-white/80 hover:text-white"
            title="Supprimer ce tier"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="flex min-h-24 flex-1 flex-wrap gap-2 bg-white p-2 dark:bg-zinc-900"
      >
        <SortableContext id={tier.id} items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
