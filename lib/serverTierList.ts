import { cache } from "react";
import type { Tier, TierItem, Visibility } from "./types";

export interface PublicTierListSummary {
  title: string;
  ownerUsername: string | null;
  visibility: Visibility;
  tiers: Tier[];
  items: TierItem[];
}

interface TierListRow {
  title: string;
  tiers: Tier[];
  items: TierItem[];
  visibility: Visibility;
  profiles: { username: string } | null;
}

/**
 * Server-side read for metadata/OG image generation, used with no user session —
 * RLS only returns public/unlisted lists here, so private ones naturally resolve
 * to null and fall back to the site's generic metadata instead of leaking a title.
 */
export const getPublicTierList = cache(async (id: string): Promise<PublicTierListSummary | null> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tier_lists?id=eq.${id}&select=title,tiers,items,visibility,profiles(username)`,
      {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as TierListRow[];
    const row = rows[0];
    if (!row) return null;
    return {
      title: row.title,
      ownerUsername: row.profiles?.username ?? null,
      visibility: row.visibility,
      tiers: row.tiers,
      items: row.items,
    };
  } catch {
    return null;
  }
});
