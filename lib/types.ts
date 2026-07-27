export type ItemType = "image" | "youtube";

export interface TierItem {
  id: string;
  type: ItemType;
  label: string;
  /** Object URL (image) or YouTube thumbnail URL — always safe to render directly. */
  thumbnailUrl: string;
  /** Original YouTube URL, used to play the video in the lightbox. */
  sourceUrl?: string;
  /** Key into the blob store, set for image items so the file survives reloads. */
  blobId?: string;
  /** null means the item sits in the unranked pool. */
  tierId: string | null;
  order: number;
}

export interface Tier {
  id: string;
  label: string;
  color: string;
  order: number;
}

export interface TierListDoc {
  id: string;
  title: string;
  tiers: Tier[];
  items: TierItem[];
  /** Background color of the tier rows / pool; falls back to the app default when unset. */
  backgroundColor?: string;
  createdAt: string;
  updatedAt: string;
}
