"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AddItemModal, type PendingImageItem } from "@/components/AddItemModal";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { CompareModal } from "@/components/CompareModal";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { Lightbox } from "@/components/Lightbox";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import { PoolArea } from "@/components/PoolArea";
import { RatingModal } from "@/components/RatingModal";
import { TierRow } from "@/components/TierRow";
import { POOL_ID } from "@/lib/constants";
import { normalizeCode } from "@/lib/compare";
import { generateComparisonCode } from "@/lib/comparisonSnapshot";
import { deleteImage, deleteTierList, listTierLists, loadTierList, saveTierList, uploadImage } from "@/lib/db";
import { exportElementAsPng } from "@/lib/export";
import { BACKGROUND_COLOR_SWATCHES, cloneTierList, DEFAULT_BACKGROUND_COLOR } from "@/lib/tierlist";
import type { Tier, TierItem, TierListDoc, Visibility } from "@/lib/types";
import type { GalleryImage } from "@/lib/gallery";
import type { ItunesTrack } from "@/lib/itunes";
import type { YoutubeMeta } from "@/lib/youtube";

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string }> = [
  { value: "private", label: "Privée" },
  { value: "unlisted", label: "Non répertoriée" },
  { value: "public", label: "Publique" },
];

const NEW_TIER_COLOR = "#a78bfa";

interface EditorClientProps {
  id: string;
}

type LocalRankingEntry = { tierId: string | null; order: number };

interface LocalRankingState {
  items: Record<string, LocalRankingEntry>;
  /** Extra tiers a non-owner added for their own view; never merged into the shared list. */
  localTiers: Tier[];
}

const EMPTY_LOCAL_RANKING: LocalRankingState = { items: {}, localTiers: [] };

/**
 * A non-owner's arrangement (and any tiers they add for themselves) is never
 * written to the shared list, so without this it would vanish on every page
 * refresh. Keeping it in localStorage (keyed per list) lets it survive
 * refreshes while staying private to this browser.
 */
function localRankingKey(id: string): string {
  return `rankster:local-rank:${id}`;
}

function readLocalRanking(id: string): LocalRankingState {
  if (typeof window === "undefined") return EMPTY_LOCAL_RANKING;
  try {
    const raw = window.localStorage.getItem(localRankingKey(id));
    if (!raw) return EMPTY_LOCAL_RANKING;
    const parsed = JSON.parse(raw);
    return { items: parsed.items ?? {}, localTiers: parsed.localTiers ?? [] };
  } catch {
    return EMPTY_LOCAL_RANKING;
  }
}

function writeLocalRanking(id: string, ranking: LocalRankingState) {
  try {
    window.localStorage.setItem(localRankingKey(id), JSON.stringify(ranking));
  } catch {
    // ignore quota/private-mode errors
  }
}

/**
 * Prefer whatever droppable the pointer is literally over; closestCenter alone
 * can resolve to the wrong tier row once rows are short and irregularly shaped
 * (label chip + items + controls merged into one droppable per row).
 */
const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
};

/**
 * Must stay referentially stable: an inline object literal here would give
 * useSensors() a new array every render, and DndContext tears down (and
 * re-attaches) its sensor listeners whenever `sensors` changes identity —
 * including mid-drag, right after the re-render triggered by onDragStart.
 */
const POINTER_SENSOR_OPTIONS = { activationConstraint: { distance: 4 } };

/** Same reasoning as POINTER_SENSOR_OPTIONS: must not be a fresh object every render. */
const MEASURING_CONFIG = { droppable: { strategy: MeasuringStrategy.Always } };

export function EditorClient({ id }: EditorClientProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [doc, setDoc] = useState<TierListDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<TierItem | null>(null);
  const [activeItem, setActiveItem] = useState<TierItem | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [myCompareCode, setMyCompareCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [activeCompareCode, setActiveCompareCode] = useState<string | null>(null);
  const [siblings, setSiblings] = useState<Array<{ id: string; title: string }>>([]);
  const exportRef = useRef<HTMLDivElement>(null);
  const bgPopoverRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Ids of the owner's real tiers, captured on load — used to tell them apart from tiers a viewer added locally. */
  const [originalTierIds, setOriginalTierIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(useSensor(PointerSensor, POINTER_SENSOR_OPTIONS));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await loadTierList(id);
      if (cancelled) return;
      if (existing) {
        const owned = existing.ownerId === user?.id;
        if (owned) {
          setDoc(existing);
        } else {
          const originalIds = new Set(existing.tiers.map((t) => t.id));
          setOriginalTierIds(originalIds);
          const saved = readLocalRanking(id);
          const tiers = [...existing.tiers, ...saved.localTiers];
          const validTierIds = new Set(tiers.map((t) => t.id));
          setDoc({
            ...existing,
            tiers,
            items: existing.items.map((item, index) => {
              const savedItem = saved.items[item.id];
              const tierId =
                savedItem && (savedItem.tierId === null || validTierIds.has(savedItem.tierId))
                  ? savedItem.tierId
                  : null;
              const order = savedItem ? savedItem.order : index;
              return { ...item, tierId, order };
            }),
          });
        }
      } else {
        router.replace("/");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router, user?.id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const all = await listTierLists();
      if (cancelled) return;
      const mine = all.filter((d) => d.ownerId === user.id);
      const sorted = [...mine].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setSiblings(sorted.map((d) => ({ id: d.id, title: d.title })));
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const isOwner = doc?.ownerId === user?.id;

  useEffect(() => {
    if (!doc || !isOwner) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveTierList(doc);
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [doc, isOwner]);

  useEffect(() => {
    if (!doc || isOwner) return;
    const items: Record<string, LocalRankingEntry> = {};
    for (const item of doc.items) {
      items[item.id] = { tierId: item.tierId, order: item.order };
    }
    const localTiers = doc.tiers.filter((t) => !originalTierIds.has(t.id));
    writeLocalRanking(id, { items, localTiers });
  }, [doc, isOwner, id, originalTierIds]);

  useEffect(() => {
    if (!bgPickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (bgPopoverRef.current && !bgPopoverRef.current.contains(e.target as Node)) {
        setBgPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bgPickerOpen]);

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

  const poolItems = containers[POOL_ID] ?? [];

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

  async function handleAddImages(items: PendingImageItem[]) {
    if (!user) return;
    const newItems: TierItem[] = [];
    for (const { file, label } of items) {
      const { path, url } = await uploadImage(file, user.id);
      newItems.push({
        id: crypto.randomUUID(),
        type: "image",
        label,
        thumbnailUrl: url,
        storagePath: path,
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

  function handleAddYoutubePlaylist(items: YoutubeMeta[]) {
    updateDoc((prev) => {
      const poolCount = prev.items.filter((i) => i.tierId === null).length;
      const newItems: TierItem[] = items.map((meta, index) => ({
        id: crypto.randomUUID(),
        type: "youtube",
        label: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
        sourceUrl: meta.sourceUrl,
        tierId: null,
        order: poolCount + index,
      }));
      return { ...prev, items: [...prev.items, ...newItems] };
    });
  }

  function handleAddGalleryImages(items: GalleryImage[]) {
    updateDoc((prev) => {
      const poolCount = prev.items.filter((i) => i.tierId === null).length;
      const newItems: TierItem[] = items.map((image, index) => ({
        id: crypto.randomUUID(),
        type: "image",
        label: image.label,
        thumbnailUrl: image.thumbnailUrl,
        tierId: null,
        order: poolCount + index,
      }));
      return { ...prev, items: [...prev.items, ...newItems] };
    });
  }

  function handleAddMusicItems(items: ItunesTrack[]) {
    updateDoc((prev) => {
      const poolCount = prev.items.filter((i) => i.tierId === null).length;
      const newItems: TierItem[] = items.map((track, index) => ({
        id: crypto.randomUUID(),
        type: "music",
        label: track.label,
        thumbnailUrl: track.thumbnailUrl,
        sourceUrl: track.sourceUrl,
        previewUrl: track.previewUrl,
        tierId: null,
        order: poolCount + index,
      }));
      return { ...prev, items: [...prev.items, ...newItems] };
    });
  }

  async function handleDeleteItem(itemId: string) {
    const item = doc?.items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.tierId !== null) {
      // Classified item: the cross unclassifies it instead of deleting it outright.
      updateDoc((prev) => {
        const poolCount = prev.items.filter((i) => i.tierId === null).length;
        return {
          ...prev,
          items: prev.items.map((i) => (i.id === itemId ? { ...i, tierId: null, order: poolCount } : i)),
        };
      });
      return;
    }

    if (item.storagePath) {
      await deleteImage(item.storagePath);
    }
    if (lightboxItem?.id === itemId) {
      setLightboxItem(null);
    }
    updateDoc((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
  }

  function handleRenameItem(itemId: string, label: string) {
    updateDoc((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === itemId ? { ...i, label } : i)),
    }));
  }

  function handleAddTier() {
    updateDoc((prev) => {
      const maxOrder = prev.tiers.reduce((m, t) => Math.max(m, t.order), -1);
      const newTier: Tier = {
        id: crypto.randomUUID(),
        label: "Nouveau",
        color: NEW_TIER_COLOR,
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

  function handleClearTier(tierId: string) {
    updateDoc((prev) => {
      let nextOrder = prev.items.filter((i) => i.tierId === null).length;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.tierId === tierId ? { ...item, tierId: null, order: nextOrder++ } : item,
        ),
      };
    });
  }

  function handleInsertTier(referenceTierId: string, position: "above" | "below") {
    updateDoc((prev) => {
      const sorted = [...prev.tiers].sort((a, b) => a.order - b.order);
      const refIndex = sorted.findIndex((t) => t.id === referenceTierId);
      if (refIndex === -1) return prev;
      const insertIndex = position === "above" ? refIndex : refIndex + 1;
      const newTier: Tier = {
        id: crypto.randomUUID(),
        label: "Nouveau",
        color: NEW_TIER_COLOR,
        order: 0,
      };
      const nextSorted = [...sorted];
      nextSorted.splice(insertIndex, 0, newTier);
      return { ...prev, tiers: nextSorted.map((t, index) => ({ ...t, order: index })) };
    });
  }

  function handleResetAll() {
    if (!confirm("Renvoyer tous les items dans le pool ?")) return;
    updateDoc((prev) => ({
      ...prev,
      items: prev.items.map((item, index) => ({ ...item, tierId: null, order: index })),
    }));
  }

  function handleSetBackgroundColor(color: string) {
    updateDoc((prev) => ({ ...prev, backgroundColor: color }));
  }

  async function handleGenerateCompareCode() {
    if (!doc) return;
    setGeneratingCode(true);
    try {
      const code = await generateComparisonCode(doc.id, { tiers: doc.tiers, items: doc.items });
      setMyCompareCode(code);
    } finally {
      setGeneratingCode(false);
    }
  }

  function handleOpenCompare() {
    const code = normalizeCode(friendCodeInput);
    if (!code) return;
    setActiveCompareCode(code);
  }

  /** Splits the 1-10 scale into as many equal bands as there are tiers, best score first. */
  function handleRatingComplete(scores: Map<string, number>) {
    setRatingModalOpen(false);
    if (scores.size === 0) return;
    updateDoc((prev) => {
      const sortedTiers = [...prev.tiers].sort((a, b) => a.order - b.order);
      if (sortedTiers.length === 0) return prev;
      const bandWidth = 10 / sortedTiers.length;

      const nextOrder = new Map<string, number>();
      for (const tier of sortedTiers) {
        const maxOrder = prev.items
          .filter((item) => item.tierId === tier.id)
          .reduce((max, item) => Math.max(max, item.order), -1);
        nextOrder.set(tier.id, maxOrder + 1);
      }

      const rankedIds = [...scores.keys()].sort((a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0));
      const tierIdByItemId = new Map<string, string>();
      for (const itemId of rankedIds) {
        const score = scores.get(itemId) ?? 0;
        const tierIndex = Math.min(sortedTiers.length - 1, Math.max(0, Math.floor((10 - score) / bandWidth)));
        tierIdByItemId.set(itemId, sortedTiers[tierIndex].id);
      }

      return {
        ...prev,
        items: prev.items.map((item) => {
          const tierId = tierIdByItemId.get(item.id);
          if (!tierId) return item;
          const order = nextOrder.get(tierId) ?? 0;
          nextOrder.set(tierId, order + 1);
          return { ...item, tierId, order, score: scores.get(item.id) };
        }),
      };
    });
  }

  function handleSetVisibility(visibility: Visibility) {
    updateDoc((prev) => ({ ...prev, visibility }));
  }

  function handleMoveTier(tierId: string, direction: -1 | 1) {
    updateDoc((prev) => {
      const sorted = [...prev.tiers].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((t) => t.id === tierId);
      const swapIndex = index + direction;
      if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return prev;
      const a = sorted[index];
      const b = sorted[swapIndex];
      return {
        ...prev,
        tiers: prev.tiers.map((t) => {
          if (t.id === a.id) return { ...t, order: b.order };
          if (t.id === b.id) return { ...t, order: a.order };
          return t;
        }),
      };
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id);
    setActiveItem(doc?.items.find((i) => i.id === activeId) ?? null);
  }

  function handleDragCancel() {
    setActiveItem(null);
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

  async function handleDeleteAsAdmin() {
    if (!doc) return;
    if (!confirm(`Supprimer la tier list "${doc.title || "Sans titre"}" de ${doc.ownerUsername ?? "?"} ?`)) return;
    await deleteTierList(doc.id);
    router.push("/");
  }

  async function handleSaveAsCopy() {
    if (!doc) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const copy = cloneTierList(doc, `${doc.title} (ma version)`, user.id);
    await saveTierList(copy);
    router.push(`/editor/${copy.id}`);
  }

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Chargement...</div>;
  }
  if (!doc) return null;

  const sortedTiers = [...doc.tiers].sort((a, b) => a.order - b.order);
  const siblingIndex = siblings.findIndex((s) => s.id === id);
  const prevSibling = siblingIndex > 0 ? siblings[siblingIndex - 1] : null;
  const nextSibling =
    siblingIndex >= 0 && siblingIndex < siblings.length - 1 ? siblings[siblingIndex + 1] : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-8">
      {prevSibling && (
        <button
          onClick={() => router.push(`/editor/${prevSibling.id}`)}
          title={`Précédente : ${prevSibling.title || "Sans titre"}`}
          aria-label="Tier list précédente"
          className="fixed left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 shadow-lg backdrop-blur transition hover:bg-zinc-800 hover:text-white"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      {nextSibling && (
        <button
          onClick={() => router.push(`/editor/${nextSibling.id}`)}
          title={`Suivante : ${nextSibling.title || "Sans titre"}`}
          aria-label="Tier list suivante"
          className="fixed right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/90 text-zinc-300 shadow-lg backdrop-blur transition hover:bg-zinc-800 hover:text-white"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}

      <button
        onClick={() => router.push("/")}
        className="w-fit text-sm text-zinc-500 hover:text-zinc-300 hover:underline"
      >
        ← Mes tier lists
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={doc.title}
          onChange={(e) => updateDoc((prev) => ({ ...prev, title: e.target.value }))}
          readOnly={!isOwner}
          className="min-w-0 flex-1 bg-transparent font-display text-3xl tracking-wide text-white outline-none"
          placeholder="Titre de la tier list"
        />
        <div className="flex flex-wrap items-center gap-2">
          {!isOwner && (
            <span className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-400">
              Classe-la à ta façon · par {doc.ownerUsername ?? "?"}
            </span>
          )}
          {!isOwner && (
            <button
              onClick={handleSaveAsCopy}
              title="Enregistrer ton classement dans une copie privée"
              className="rounded-md bg-ember px-3 py-2 text-sm font-semibold text-white transition hover:bg-ember-hover"
            >
              {user ? "Sauvegarder ma version" : "Se connecter pour sauvegarder"}
            </button>
          )}
          {!isOwner && isAdmin && (
            <button
              onClick={handleDeleteAsAdmin}
              title="Supprimer cette tier list (admin)"
              className="rounded-md border border-red-900 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Supprimer (admin)
            </button>
          )}
          {isOwner && (
            <select
              value={doc.visibility}
              onChange={(e) => handleSetVisibility(e.target.value as Visibility)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 outline-none transition hover:bg-zinc-800"
              title="Qui peut voir cette tier list"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {isOwner && (
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-ember px-3 py-2 text-sm font-semibold text-white transition hover:bg-ember-hover"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter un item
            </button>
          )}
          <button
            onClick={handleAddTier}
            title={isOwner ? undefined : "Ajouter un tier pour ton propre classement"}
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            + Ajouter un tier
          </button>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setBgPickerOpen((open) => !open)}
                className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
              >
                Couleur de fond
              </button>
              {bgPickerOpen && (
                <div
                  ref={bgPopoverRef}
                  className="absolute right-0 top-full z-20 mt-2 w-52 rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
                >
                  <p className="mb-2 text-xs font-medium text-zinc-400">Couleur de fond</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BACKGROUND_COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleSetBackgroundColor(color)}
                        style={{ backgroundColor: color }}
                        className={`h-6 w-6 rounded-full border border-zinc-700 ring-offset-2 ring-offset-zinc-900 transition ${
                          (doc.backgroundColor ?? DEFAULT_BACKGROUND_COLOR) === color
                            ? "ring-2 ring-white"
                            : "hover:scale-110"
                        }`}
                        aria-label={`Fond ${color}`}
                      />
                    ))}
                    <label className="relative flex h-6 w-6 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-zinc-600 text-[10px] text-zinc-400 hover:border-zinc-400">
                      +
                      <input
                        type="color"
                        value={doc.backgroundColor ?? DEFAULT_BACKGROUND_COLOR}
                        onChange={(e) => handleSetBackgroundColor(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
          {isOwner && (
            <button
              onClick={handleResetAll}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              Réinitialiser
            </button>
          )}
          <button
            onClick={() => setRatingModalOpen(true)}
            disabled={poolItems.length === 0}
            title="Note chaque item non classé sur 10, puis classe-les automatiquement"
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Noter en rafale
          </button>
          <button
            onClick={handleExport}
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
          >
            Exporter en PNG
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        measuring={MEASURING_CONFIG}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div ref={exportRef} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {sortedTiers.map((tier, index) => (
            <TierRow
              key={tier.id}
              tier={tier}
              items={containers[tier.id] ?? []}
              backgroundColor={doc.backgroundColor ?? DEFAULT_BACKGROUND_COLOR}
              readOnly={!isOwner}
              canManage={isOwner || !originalTierIds.has(tier.id)}
              onRename={(label) => handleRenameTier(tier.id, label)}
              onRecolor={(color) => handleRecolorTier(tier.id, color)}
              onDelete={() => handleDeleteTier(tier.id)}
              onClearItems={() => handleClearTier(tier.id)}
              onInsertAbove={() => handleInsertTier(tier.id, "above")}
              onInsertBelow={() => handleInsertTier(tier.id, "below")}
              onItemClick={setLightboxItem}
              onItemDelete={handleDeleteItem}
              onMoveUp={() => handleMoveTier(tier.id, -1)}
              onMoveDown={() => handleMoveTier(tier.id, 1)}
              canMoveUp={index > 0}
              canMoveDown={index < sortedTiers.length - 1}
            />
          ))}
        </div>

        <PoolArea
          items={containers[POOL_ID] ?? []}
          onItemClick={setLightboxItem}
          onItemDelete={handleDeleteItem}
          backgroundColor={doc.backgroundColor ?? DEFAULT_BACKGROUND_COLOR}
          readOnly={!isOwner}
        />

        <DragOverlay>{activeItem ? <ItemThumbnail item={activeItem} /> : null}</DragOverlay>
      </DndContext>

      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
        <p className="text-sm font-medium text-zinc-300">Comparer avec un ami</p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateCompareCode}
            disabled={generatingCode}
            className="shrink-0 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {generatingCode ? "..." : "Générer un code pour mon classement"}
          </button>
          {myCompareCode && (
            <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2">
              <span className="font-mono text-sm tracking-widest text-white">{myCompareCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(myCompareCode);
                  showToast("Code copié !");
                }}
                className="text-xs text-zinc-400 transition hover:text-white"
                title="Copier le code"
              >
                Copier
              </button>
              <span className="text-xs text-zinc-500">valable 14 jours</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={friendCodeInput}
            onChange={(e) => setFriendCodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOpenCompare();
            }}
            placeholder="Code de ton ami..."
            maxLength={6}
            className="w-40 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm uppercase text-white placeholder:text-zinc-500 placeholder:normal-case outline-none focus:border-ember"
          />
          <button
            onClick={handleOpenCompare}
            disabled={!friendCodeInput.trim()}
            className="shrink-0 rounded-md bg-ember px-3 py-2 text-sm font-semibold text-white transition hover:bg-ember-hover disabled:opacity-50"
          >
            Comparer
          </button>
        </div>
      </div>

      <AddItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddImages={handleAddImages}
        onAddYoutube={handleAddYoutube}
        onAddYoutubePlaylist={handleAddYoutubePlaylist}
        onAddGalleryImages={handleAddGalleryImages}
        onAddMusicItems={handleAddMusicItems}
      />

      <Lightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
        onRename={handleRenameItem}
        readOnly={!isOwner}
      />

      {ratingModalOpen && (
        <RatingModal
          items={poolItems}
          onClose={() => setRatingModalOpen(false)}
          onComplete={handleRatingComplete}
        />
      )}

      {activeCompareCode && (
        <CompareModal
          mine={{ tiers: doc.tiers, items: doc.items }}
          code={activeCompareCode}
          onClose={() => setActiveCompareCode(null)}
        />
      )}
    </div>
  );
}
