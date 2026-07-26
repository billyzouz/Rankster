"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AddItemModal } from "@/components/AddItemModal";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { Lightbox } from "@/components/Lightbox";
import { PoolArea } from "@/components/PoolArea";
import { TierRow } from "@/components/TierRow";
import { POOL_ID } from "@/lib/constants";
import { loadBlob, loadTierList, saveBlob, saveTierList } from "@/lib/db";
import { exportElementAsPng } from "@/lib/export";
import type { Tier, TierItem, TierListDoc } from "@/lib/types";
import type { YoutubeMeta } from "@/lib/youtube";

interface EditorClientProps {
  id: string;
}

async function hydrateItems(doc: TierListDoc): Promise<TierListDoc> {
  const items = await Promise.all(
    doc.items.map(async (item) => {
      if (item.type === "image" && item.blobId) {
        const blob = await loadBlob(item.blobId);
        if (blob) return { ...item, thumbnailUrl: URL.createObjectURL(blob) };
      }
      return item;
    }),
  );
  return { ...doc, items };
}

export function EditorClient({ id }: EditorClientProps) {
  const router = useRouter();
  const [doc, setDoc] = useState<TierListDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<TierItem | null>(null);
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await loadTierList(id);
      if (cancelled) return;
      if (existing) {
        setDoc(await hydrateItems(existing));
      } else {
        router.replace("/");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  useEffect(() => {
    if (!doc) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveTierList(doc);
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [doc]);

  const containers = useMemo(() => {
    const map: Record<string, TierItem[]> = { [POOL_ID]: [] };
    if (!doc) return map;
    for (const tier of doc.tiers) map[tier.id] = [];
    for (const item of doc.items) {
      const key = item.tierId ?? POOL_ID;
      (map[key] ??= []).push(item);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.order - b.order);
    }
    return map;
  }, [doc]);

  function updateDoc(mutator: (prev: TierListDoc) => TierListDoc) {
    setDoc((prev) => (prev ? { ...mutator(prev), updatedAt: new Date().toISOString() } : prev));
  }

  function isContainerId(value: string): boolean {
    return value === POOL_ID || (doc?.tiers.some((t) => t.id === value) ?? false);
  }

  function getItemContainerId(itemId: string): string | undefined {
    const item = doc?.items.find((i) => i.id === itemId);
    return item ? (item.tierId ?? POOL_ID) : undefined;
  }

  async function handleAddImages(files: File[]) {
    const newItems: TierItem[] = [];
    for (const file of files) {
      const blobId = crypto.randomUUID();
      await saveBlob(blobId, file);
      newItems.push({
        id: crypto.randomUUID(),
        type: "image",
        label: file.name.replace(/\.[^.]+$/, ""),
        thumbnailUrl: URL.createObjectURL(file),
        blobId,
        tierId: null,
        order: 0,
      });
    }
    updateDoc((prev) => {
      const poolCount = prev.items.filter((i) => i.tierId === null).length;
      const withOrder = newItems.map((item, index) => ({ ...item, order: poolCount + index }));
      return { ...prev, items: [...prev.items, ...withOrder] };
    });
  }

  function handleAddYoutube(meta: YoutubeMeta) {
    updateDoc((prev) => {
      const poolCount = prev.items.filter((i) => i.tierId === null).length;
      const newItem: TierItem = {
        id: crypto.randomUUID(),
        type: "youtube",
        label: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
        sourceUrl: meta.sourceUrl,
        tierId: null,
        order: poolCount,
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  }

  function handleAddTier() {
    updateDoc((prev) => {
      const maxOrder = prev.tiers.reduce((m, t) => Math.max(m, t.order), -1);
      const newTier: Tier = {
        id: crypto.randomUUID(),
        label: "Nouveau",
        color: "#a78bfa",
        order: maxOrder + 1,
      };
      return { ...prev, tiers: [...prev.tiers, newTier] };
    });
  }

  function handleRenameTier(tierId: string, label: string) {
    updateDoc((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === tierId ? { ...t, label } : t)),
    }));
  }

  function handleRecolorTier(tierId: string, color: string) {
    updateDoc((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.id === tierId ? { ...t, color } : t)),
    }));
  }

  function handleDeleteTier(tierId: string) {
    updateDoc((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== tierId),
      items: prev.items.map((item) => (item.tierId === tierId ? { ...item, tierId: null } : item)),
    }));
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    setActiveItem(doc?.items.find((i) => i.id === activeId) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over || !doc) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceContainer = getItemContainerId(activeId);
    const destContainer = isContainerId(overId) ? overId : getItemContainerId(overId);
    if (!sourceContainer || !destContainer) return;

    updateDoc((prev) => {
      const activeItemDoc = prev.items.find((i) => i.id === activeId);
      if (!activeItemDoc) return prev;

      const byContainer: Record<string, TierItem[]> = {};
      for (const item of prev.items) {
        if (item.id === activeId) continue;
        const key = item.tierId ?? POOL_ID;
        (byContainer[key] ??= []).push(item);
      }
      for (const key of Object.keys(byContainer)) {
        byContainer[key].sort((a, b) => a.order - b.order);
      }

      const destList = byContainer[destContainer] ?? [];
      let insertIndex = destList.length;
      if (!isContainerId(overId)) {
        const overIndex = destList.findIndex((i) => i.id === overId);
        if (overIndex !== -1) insertIndex = overIndex;
      }

      const movedItem: TierItem = {
        ...activeItemDoc,
        tierId: destContainer === POOL_ID ? null : destContainer,
      };
      destList.splice(insertIndex, 0, movedItem);
      byContainer[destContainer] = destList;

      const nextItems: TierItem[] = [];
      for (const key of Object.keys(byContainer)) {
        byContainer[key].forEach((item, index) => {
          nextItems.push({ ...item, order: index });
        });
      }
      return { ...prev, items: nextItems };
    });
  }

  async function handleExport() {
    if (!exportRef.current || !doc) return;
    await exportElementAsPng(exportRef.current, doc.title || "tier-list");
  }

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Chargement...</div>;
  }
  if (!doc) return null;

  const sortedTiers = [...doc.tiers].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => router.push("/")} className="text-sm text-zinc-500 hover:underline">
          ← Mes tier lists
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            + Ajouter un item
          </button>
          <button
            onClick={handleAddTier}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            + Ajouter un tier
          </button>
          <button
            onClick={handleExport}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Exporter en PNG
          </button>
        </div>
      </header>

      <input
        value={doc.title}
        onChange={(e) => updateDoc((prev) => ({ ...prev, title: e.target.value }))}
        className="w-full bg-transparent text-2xl font-bold outline-none"
        placeholder="Titre de la tier list"
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div ref={exportRef} className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800">
          {sortedTiers.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              items={containers[tier.id] ?? []}
              onRename={(label) => handleRenameTier(tier.id, label)}
              onRecolor={(color) => handleRecolorTier(tier.id, color)}
              onDelete={() => handleDeleteTier(tier.id)}
              onItemClick={setLightboxItem}
            />
          ))}
        </div>

        <PoolArea items={containers[POOL_ID] ?? []} onItemClick={setLightboxItem} />

        <DragOverlay>{activeItem ? <ItemThumbnail item={activeItem} /> : null}</DragOverlay>
      </DndContext>

      <AddItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddImages={handleAddImages}
        onAddYoutube={handleAddYoutube}
      />

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </div>
  );
}
