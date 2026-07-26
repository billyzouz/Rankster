"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TierItem } from "@/lib/types";
import { CloseIcon } from "./icons";
import { ItemThumbnail } from "./ItemThumbnail";

interface ItemCardProps {
  item: TierItem;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ItemCard({ item, onClick, onDelete }: ItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="group relative shrink-0 cursor-grab touch-none active:cursor-grabbing"
    >
      <ItemThumbnail item={item} />
      {onDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-white opacity-0 shadow ring-1 ring-zinc-700 transition hover:bg-red-500 hover:ring-red-500 group-hover:opacity-100"
          aria-label="Supprimer cet item"
          title="Supprimer cet item"
        >
          <CloseIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
