"use client";

import { createPortal } from "react-dom";
import type { TierItem } from "@/lib/types";

interface ItemHoverPreviewProps {
  item: TierItem;
  anchorRect: DOMRect;
}

const PREVIEW_WIDTH = 200;
const PREVIEW_HEIGHT = 250;

export function ItemHoverPreview({ item, anchorRect }: ItemHoverPreviewProps) {
  const top = Math.max(8, Math.min(anchorRect.top, window.innerHeight - PREVIEW_HEIGHT - 8));
  const spaceRight = window.innerWidth - anchorRect.right;
  const left =
    spaceRight > PREVIEW_WIDTH + 16
      ? anchorRect.right + 8
      : Math.max(8, anchorRect.left - PREVIEW_WIDTH - 8);

  return createPortal(
    <div
      style={{ top, left, width: PREVIEW_WIDTH }}
      className="pointer-events-none fixed z-40 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnailUrl}
        alt={item.label}
        className="aspect-square w-full object-cover"
      />
      <p className="p-2 text-xs leading-snug text-zinc-100">{item.label || "Sans titre"}</p>
    </div>,
    document.body,
  );
}
