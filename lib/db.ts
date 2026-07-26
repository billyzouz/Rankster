import { createStore, del, get, keys, set } from "idb-keyval";
import type { UseStore } from "idb-keyval";
import type { TierListDoc } from "./types";

let listStore: UseStore | undefined;
let blobStore: UseStore | undefined;

function getListStore(): UseStore {
  if (!listStore) listStore = createStore("tierlist-app", "tierlists");
  return listStore;
}

function getBlobStore(): UseStore {
  if (!blobStore) blobStore = createStore("tierlist-app-blobs", "blobs");
  return blobStore;
}

export async function saveTierList(doc: TierListDoc): Promise<void> {
  await set(doc.id, doc, getListStore());
}

export async function loadTierList(id: string): Promise<TierListDoc | undefined> {
  return get<TierListDoc>(id, getListStore());
}

export async function deleteTierList(id: string): Promise<void> {
  await del(id, getListStore());
}

export async function listTierLists(): Promise<TierListDoc[]> {
  const allKeys = await keys(getListStore());
  const docs = await Promise.all(
    allKeys.map((key) => get<TierListDoc>(key as string, getListStore())),
  );
  return docs
    .filter((doc): doc is TierListDoc => Boolean(doc))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  await set(id, blob, getBlobStore());
}

export async function loadBlob(id: string): Promise<Blob | undefined> {
  return get<Blob>(id, getBlobStore());
}

export async function deleteBlob(id: string): Promise<void> {
  await del(id, getBlobStore());
}
