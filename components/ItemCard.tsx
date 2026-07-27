"use client";

import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TierItem } from "@/lib/types";
import { CloseIcon } from "./icons";
import { ItemHoverPreview } from "./ItemHoverPreview";
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function handleMouseEnter() {
    hoverTimeout.current = setTimeout(() => {
      if (cardRef.current) setAnchorRect(cardRef.current.getBoundingClientRect());
    }, 250);
  }

  function handleMouseLeave() {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setAnchorRect(null);
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
          className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950 text-white opacity-0 shadow ring-1 ring-zinc-700 transition hover:bg-red-500 hover:ring-red-500 group-hover:opacity-100"
          aria-label="Supprimer cet item"
          title="Supprimer cet item"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      )}
      {anchorRect && !isDragging && <ItemHoverPreview item={item} anchorRect={anchorRect} />}
    </div>
  );
}
