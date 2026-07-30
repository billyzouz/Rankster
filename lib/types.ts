export type ItemType = "image" | "youtube" | "music";

export type Visibility = "private" | "unlisted" | "public";

export interface TierItem {
  id: string;
  type: ItemType;
  label: string;
  /** Public URL (Supabase Storage image, YouTube thumbnail, or album art) — always safe to render directly. */
  thumbnailUrl: string;
  /** Original YouTube URL, or the Apple Music track page, used to open/play the item. */
  sourceUrl?: string;
  /** 30-second audio preview, music items only. */
  previewUrl?: string;
  /** Storage object path, set for image items so the file can be deleted from the bucket. */
  storagePath?: string;
  /** null means the item sits in the unranked pool. */
  tierId: string | null;
  order: number;
  /** Last score (out of 10) given during a guided rating pass — used to sort within a tier and to re-derive placements. */
  score?: number;
}

export interface Tier {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface TierListDoc {
  id: string;
  ownerId: string;
  /** Owner's display name, joined in for lists that aren't the current user's own. */
  ownerUsername?: string;
  title: string;
  tiers: Tier[];
  items: TierItem[];
  /** Background color of the tier rows / pool; falls back to the app default when unset. */
  backgroundColor?: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}
