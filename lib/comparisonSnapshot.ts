import { supabase } from "./supabase";
import type { Tier, TierItem } from "./types";
import type { RankedList } from "./compare";

// Excludes visually-ambiguous characters (0/O, 1/I/L) so codes are easy to read and retype.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const UNIQUE_VIOLATION = "23505";

function randomCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
}

/**
 * Saves a snapshot of the current tiers/items under a fresh random code — no account
 * needed on either side. The code is the only thing that grants access to it later.
 */
export async function generateComparisonCode(listId: string, list: RankedList): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const { error } = await supabase.from("comparison_snapshots").insert({
      code,
      list_id: listId,
      tiers: list.tiers,
      items: list.items,
    });
    if (!error) return code;
    if (error.code !== UNIQUE_VIOLATION) throw error;
  }
  throw new Error("Impossible de générer un code unique, réessaie.");
}

export async function loadComparisonSnapshot(code: string): Promise<RankedList | null> {
  const { data, error } = await supabase
    .from("comparison_snapshots")
    .select("tiers, items")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { tiers: data.tiers as Tier[], items: data.items as TierItem[] };
}
