import type { Tier, TierListDoc } from "./types";

export const DEFAULT_TIER_PRESET: Array<Pick<Tier, "label" | "color">> = [
  { label: "S", color: "#e63946" },
  { label: "A", color: "#f4a259" },
  { label: "B", color: "#f6d55c" },
  { label: "C", color: "#7bc950" },
  { label: "D", color: "#4d96ff" },
  { label: "F", color: "#8d99ae" },
];

export const TIER_COLOR_SWATCHES: string[] = [
  "#e63946",
  "#f4a259",
  "#f6d55c",
  "#7bc950",
  "#2ec4b6",
  "#4d96ff",
  "#7b61ff",
  "#e559c9",
  "#ff6b9d",
  "#8d99ae",
];

export const DEFAULT_BACKGROUND_COLOR = "#18181b";

export const BACKGROUND_COLOR_SWATCHES: string[] = [
  "#18181b",
  "#000000",
  "#0c0c0f",
  "#1e293b",
  "#3f2d1e",
  "#1e2d24",
  "#f4f4f5",
  "#ffffff",
];

export function createTierList(title: string, ownerId: string): TierListDoc {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    ownerId,
    title,
    tiers: DEFAULT_TIER_PRESET.map((preset, index) => ({
      id: crypto.randomUUID(),
      label: preset.label,
      color: preset.color,
      order: index,
    })),
    items: [],
    visibility: "private",
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneTierList(doc: TierListDoc, title: string, ownerId: string): TierListDoc {
  const now = new Date().toISOString();
  const tierIdMap = new Map<string, string>();
  const tiers = doc.tiers.map((tier) => {
    const newId = crypto.randomUUID();
    tierIdMap.set(tier.id, newId);
    return { ...tier, id: newId };
  });
  const items = doc.items.map((item) => ({
    ...item,
    id: crypto.randomUUID(),
    tierId: item.tierId ? (tierIdMap.get(item.tierId) ?? null) : null,
  }));
  return {
    ...doc,
    id: crypto.randomUUID(),
    ownerId,
    ownerUsername: undefined,
    title,
    tiers,
    items,
    visibility: "private",
    createdAt: now,
    updatedAt: now,
  };
}
