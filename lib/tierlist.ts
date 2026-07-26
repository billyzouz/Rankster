import type { Tier, TierListDoc } from "./types";

export const DEFAULT_TIER_PRESET: Array<Pick<Tier, "label" | "color">> = [
  { label: "S", color: "#e63946" },
  { label: "A", color: "#f4a259" },
  { label: "B", color: "#f6d55c" },
  { label: "C", color: "#7bc950" },
  { label: "D", color: "#4d96ff" },
  { label: "F", color: "#8d99ae" },
];

export function createTierList(title: string): TierListDoc {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    tiers: DEFAULT_TIER_PRESET.map((preset, index) => ({
      id: crypto.randomUUID(),
      label: preset.label,
      color: preset.color,
      order: index,
    })),
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function cloneTierList(doc: TierListDoc, title: string): TierListDoc {
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
    title,
    tiers,
    items,
    createdAt: now,
    updatedAt: now,
  };
}
