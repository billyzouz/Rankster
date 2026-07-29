import type { GalleryImage } from "./gallery";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

interface CommonsPage {
  title: string;
  imageinfo?: Array<{ thumburl: string; descriptionurl: string }>;
}

/** Searches Wikimedia Commons (freely-licensed images) for a given query. */
export async function searchWikimediaImages(query: string): Promise<GalleryImage[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query.trim()} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "30",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "300",
    format: "json",
    origin: "*",
  });

  const res = await fetch(`${COMMONS_API}?${params}`);
  if (!res.ok) throw new Error("Impossible de contacter Wikimedia Commons.");
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {}) as CommonsPage[];

  return pages
    .filter((page) => page.imageinfo?.[0]?.thumburl)
    .map((page) => ({
      label: page.title.replace(/^File:/, "").replace(/\.[a-zA-Z0-9]+$/, ""),
      thumbnailUrl: page.imageinfo![0].thumburl,
      sourceUrl: page.imageinfo![0].descriptionurl,
    }));
}
