import type { GalleryImage } from "./gallery";

const ANILIST_URL = "https://graphql.anilist.co";

export interface AnimeResult {
  id: number;
  title: string;
  coverImage: string;
}

async function anilistQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message ?? "Impossible de contacter AniList.");
  }
  return json.data as T;
}

export async function searchAnime(query: string): Promise<AnimeResult[]> {
  if (!query.trim()) return [];
  const data = await anilistQuery<{
    Page: { media: Array<{ id: number; title: { romaji: string; english: string | null }; coverImage: { medium: string } }> };
  }>(
    `query ($search: String) {
      Page(page: 1, perPage: 10) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { medium }
        }
      }
    }`,
    { search: query.trim() },
  );
  return data.Page.media.map((m) => ({
    id: m.id,
    title: m.title.english ?? m.title.romaji,
    coverImage: m.coverImage.medium,
  }));
}

export async function getAnimeCharacters(animeId: number): Promise<GalleryImage[]> {
  const data = await anilistQuery<{
    Media: { characters: { nodes: Array<{ name: { full: string }; image: { medium: string } }> } };
  }>(
    `query ($id: Int) {
      Media(id: $id) {
        characters(page: 1, perPage: 50, sort: ROLE) {
          nodes {
            name { full }
            image { medium }
          }
        }
      }
    }`,
    { id: animeId },
  );
  return data.Media.characters.nodes.map((c) => ({
    label: c.name.full,
    thumbnailUrl: c.image.medium,
    sourceUrl: "https://anilist.co",
  }));
}
