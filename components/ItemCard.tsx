"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TierItem } from "@/lib/types";
import { ItemThumbnail } from "./ItemThumbnail";

interface ItemCardProps {
  item: TierItem;
  onClick?: () => void;
}

export function ItemCard({ item, onClick }: ItemCardProps) {
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
      className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
    >
      <ItemThumbnail item={item} />
    </div>
  );
}
