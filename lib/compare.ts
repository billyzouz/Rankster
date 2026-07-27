import type { Tier, TierItem, TierListDoc } from "./types";

export type ComparisonMatch = "same" | "close" | "different" | "pending";

export interface ComparisonRow {
  /** Stable key items are matched on — sourceUrl for videos, storagePath for images. */
  key: string;
  label: string;
  thumbnailUrl: string;
  mine: { tierLabel: string | null; tierColor: string | null };
  theirs: { tierLabel: string | null; tierColor: string | null };
  match: ComparisonMatch;
}

export interface ComparisonSummary {
  rows: ComparisonRow[];
  same: number;
  close: number;
  different: number;
  pending: number;
}

/**
 * Items keep a stable identity across a duplicate (sourceUrl/storagePath survive
 * cloning even though item ids are regenerated), so that's what two independently
 * ranked copies of "the same list" can be matched on.
 */
function itemKey(item: TierItem): string {
  return item.sourceUrl ?? item.storagePath ?? item.thumbnailUrl;
}

function tierByItem(item: TierItem, tiers: Tier[]): Tier | null {
  if (!item.tierId) return null;
  return tiers.find((t) => t.id === item.tierId) ?? null;
}

/** Compares `mine`'s placements against `theirs` for every item the two lists have in common. */
export function compareTierLists(mine: TierListDoc, theirs: TierListDoc): ComparisonSummary {
  const theirsByKey = new Map(theirs.items.map((item) => [itemKey(item), item]));

  const rows: ComparisonRow[] = [];
  for (const item of mine.items) {
    const key = itemKey(item);
    const other = theirsByKey.get(key);
    if (!other) continue;

    const myTier = tierByItem(item, mine.tiers);
    const theirTier = tierByItem(other, theirs.tiers);

    let match: ComparisonMatch;
    if (!myTier || !theirTier) {
      match = "pending";
    } else if (myTier.order === theirTier.order) {
      match = "same";
    } else if (Math.abs(myTier.order - theirTier.order) === 1) {
      match = "close";
    } else {
      match = "different";
    }

    rows.push({
      key,
      label: item.label,
      thumbnailUrl: item.thumbnailUrl,
      mine: { tierLabel: myTier?.label ?? null, tierColor: myTier?.color ?? null },
      theirs: { tierLabel: theirTier?.label ?? null, tierColor: theirTier?.color ?? null },
      match,
    });
  }

  return {
    rows,
    same: rows.filter((r) => r.match === "same").length,
    close: rows.filter((r) => r.match === "close").length,
    different: rows.filter((r) => r.match === "different").length,
    pending: rows.filter((r) => r.match === "pending").length,
  };
}

/** Extracts a bare tier-list id from either a full Rankster URL or a raw id the user pasted. */
export function extractTierListId(input: string): string | null {
  const trimmed = input.trim();
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = trimmed.match(uuidPattern);
  return match ? match[0] : null;
}
