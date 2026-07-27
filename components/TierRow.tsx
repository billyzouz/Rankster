"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TIER_COLOR_SWATCHES } from "@/lib/tierlist";
import type { Tier, TierItem } from "@/lib/types";
import { ItemCard } from "./ItemCard";
import { ChevronDownIcon, ChevronUpIcon, GearIcon, TrashIcon } from "./icons";

const POPOVER_WIDTH = 208; // matches w-52
const POPOVER_ESTIMATED_HEIGHT = 340;

interface TierRowProps {
  tier: Tier;
  items: TierItem[];
  backgroundColor: string;
  onRename: (label: string) => void;
  onRecolor: (color: string) => void;
  onDelete: () => void;
  onClearItems: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onItemClick: (item: TierItem) => void;
  onItemDelete: (itemId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function TierRow({
  tier,
  items,
  backgroundColor,
  onRename,
  onRecolor,
  onDelete,
  onClearItems,
  onInsertAbove,
  onInsertBelow,
  onItemClick,
  onItemDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: TierRowProps) {
  const { setNodeRef } = useDroppable({ id: tier.id });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gearButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !gearButtonRef.current?.contains(target)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [settingsOpen]);

  function toggleSettings() {
    if (!settingsOpen && gearButtonRef.current) {
      const rect = gearButtonRef.current.getBoundingClientRect();
      const top = Math.min(Math.max(rect.top, 8), window.innerHeight - POPOVER_ESTIMATED_HEIGHT - 8);
      const left = rect.left - 8 - POPOVER_WIDTH;
      setPopoverPos({ top, left });
    }
    setSettingsOpen((open) => !open);
  }

  return (
    <div ref={setNodeRef} className="flex border-b border-zinc-800 last:border-b-0">
      <div
        className="flex w-24 shrink-0 items-center justify-center p-1.5 sm:w-28"
        style={{ backgroundColor: tier.color }}
      >
        <input
          value={tier.label}
          onChange={(e) => onRename(e.target.value)}
          className="w-full bg-transparent text-center font-display text-2xl tracking-wide text-white outline-none placeholder:text-white/70"
          maxLength={12}
        />
      </div>

      <div
        className="flex min-h-20 flex-1 flex-wrap content-start gap-2 p-2"
        style={{ backgroundColor }}
      >
        <SortableContext id={tier.id} items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
              onDelete={() => onItemDelete(item.id)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="relative flex w-11 shrink-0 flex-col items-center justify-center gap-1 border-l border-zinc-800 bg-black py-1.5">
        <button
          ref={gearButtonRef}
          onClick={toggleSettings}
          title="Réglages du tier"
          className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <GearIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          title="Monter ce tier"
          className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronUpIcon className="h-4 w-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          title="Descendre ce tier"
          className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {settingsOpen &&
          popoverPos &&
          createPortal(
            <div
              ref={popoverRef}
              style={{ top: popoverPos.top, left: popoverPos.left, width: POPOVER_WIDTH }}
              className="fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
            >
              <p className="mb-2 text-xs font-medium text-zinc-400">Couleur du tier</p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {TIER_COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    onClick={() => onRecolor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-zinc-900 transition ${
                      tier.color === color ? "ring-2 ring-white" : "hover:scale-110"
                    }`}
                    aria-label={`Couleur ${color}`}
                  />
                ))}
                <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-zinc-600 text-[10px] text-zinc-400 hover:border-zinc-400">
                  +
                  <input
                    type="color"
                    value={tier.color}
                    onChange={(e) => onRecolor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
              </div>

              <div className="mb-2 border-t border-zinc-800 pt-2">
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onInsertAbove();
                  }}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800"
                >
                  Insérer un tier au-dessus
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onInsertBelow();
                  }}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800"
                >
                  Insérer un tier en dessous
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    onClearItems();
                  }}
                  disabled={items.length === 0}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Vider ce tier
                </button>
              </div>

              <button
                onClick={() => {
                  setSettingsOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <TrashIcon className="h-4 w-4" />
                Supprimer ce tier
              </button>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}
