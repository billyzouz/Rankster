import { loadBlob } from "./db";
import type { TierItem, TierListDoc } from "./types";

/** Regenerates object URLs for image items from the blob store (object URLs don't survive reloads). */
export async function hydrateItems(doc: TierListDoc): Promise<TierListDoc> {
  const items = await Promise.all(doc.items.map(hydrateItem));
  return { ...doc, items };
}

export async function hydrateItem(item: TierItem): Promise<TierItem> {
  if (item.type === "image" && item.blobId) {
    const blob = await loadBlob(item.blobId);
    if (blob) return { ...item, thumbnailUrl: URL.createObjectURL(blob) };
  }
  return item;
}

/** Hydrates just enough items (image blobs) to render a card preview collage. */
export async function hydratePreviewThumbnails(items: TierItem[], limit = 4): Promise<string[]> {
  const preview = items.slice(0, limit);
  const urls = await Promise.all(
    preview.map(async (item) => {
      if (item.type === "youtube") return item.thumbnailUrl;
      if (item.blobId) {
        const blob = await loadBlob(item.blobId);
        return blob ? URL.createObjectURL(blob) : null;
      }
      return null;
    }),
  );
  return urls.filter((url): url is string => Boolean(url));
}
