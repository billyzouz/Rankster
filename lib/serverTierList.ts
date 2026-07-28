import { cache } from "react";
import type { Tier, TierItem, TierListDoc, Visibility } from "./types";

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
export interface PublicTierListId {
  id: string;
  updatedAt: string;
}

/** Every publicly-listed tier list id, for the sitemap — unlisted lists are deliberately excluded. */
export const listPublicTierListIds = cache(async (): Promise<PublicTierListId[]> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/tier_lists?visibility=eq.public&select=id,updated_at`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as Array<{ id: string; updated_at: string }>;
    return rows.map((row) => ({ id: row.id, updatedAt: row.updated_at }));
  } catch {
    return [];
  }
});

interface HomeTierListRow {
  id: string;
  owner_id: string;
  title: string;
  tiers: Tier[];
  items: TierItem[];
  background_color: string | null;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  profiles: { username: string } | null;
}

/**
 * Server-rendered seed for the home page so crawlers (and first paint) see real
 * tier lists without waiting on a client-side fetch — anon access, so only ever
 * the public ones, same as what a logged-out visitor would see anyway.
 */
export const listPublicTierListsForHome = cache(async (): Promise<TierListDoc[]> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tier_lists?visibility=eq.public&select=*,profiles(username)&order=updated_at.desc`,
      {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as HomeTierListRow[];
    return rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      ownerUsername: row.profiles?.username,
      title: row.title,
      tiers: row.tiers,
      items: row.items,
      backgroundColor: row.background_color ?? undefined,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
});

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
