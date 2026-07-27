import { supabase } from "./supabase";
import type { Tier, TierItem, TierListDoc, Visibility } from "./types";

const BUCKET = "tier-list-images";

interface TierListRow {
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

function rowToDoc(row: TierListRow): TierListDoc {
  return {
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
  };
}

export async function saveTierList(doc: TierListDoc): Promise<void> {
  const { error } = await supabase.from("tier_lists").upsert({
    id: doc.id,
    owner_id: doc.ownerId,
    title: doc.title,
    tiers: doc.tiers,
    items: doc.items,
    background_color: doc.backgroundColor ?? null,
    visibility: doc.visibility,
  });
  if (error) throw error;
}

export async function loadTierList(id: string): Promise<TierListDoc | undefined> {
  const { data, error } = await supabase
    .from("tier_lists")
    .select("*, profiles(username)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDoc(data as TierListRow) : undefined;
}

export async function deleteTierList(id: string): Promise<void> {
  const { error } = await supabase.from("tier_lists").delete().eq("id", id);
  if (error) throw error;
}

/** Every tier list visible to the current user: their own (any visibility) plus others' public/unlisted ones. */
export async function listTierLists(): Promise<TierListDoc[]> {
  const { data, error } = await supabase
    .from("tier_lists")
    .select("*, profiles(username)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as TierListRow[]).map(rowToDoc);
}

export async function uploadImage(file: File, ownerId: string): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function deleteImage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
}
