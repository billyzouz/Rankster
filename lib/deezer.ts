export interface DeezerArtist {
  id: number;
  name: string;
}

export interface DeezerAlbum {
  id: number;
  name: string;
  artworkUrl: string;
}

export interface DeezerTrack {
  label: string;
  thumbnailUrl: string;
  sourceUrl?: string;
  previewUrl?: string;
}

interface DeezerTrackObject {
  title: string;
  link?: string;
  preview?: string;
  md5_image?: string;
}

async function deezerProxy<T>(action: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ action, ...params });
  const res = await fetch(`/api/deezer?${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Impossible de contacter Deezer.");
  return data as T;
}

function coverUrl(md5: string): string {
  return `https://cdn-images.dzcdn.net/images/cover/${md5}/250x250-000000-80-0-0.jpg`;
}

function toTrack(t: DeezerTrackObject): DeezerTrack {
  return {
    label: t.title,
    thumbnailUrl: t.md5_image ? coverUrl(t.md5_image) : "",
    sourceUrl: t.link,
    previewUrl: t.preview || undefined,
  };
}

export async function searchArtists(query: string): Promise<DeezerArtist[]> {
  if (!query.trim()) return [];
  const data = await deezerProxy<{ data: Array<{ id: number; name: string; nb_fan: number }> }>(
    "search-artist",
    { q: query.trim() },
  );
  // Deezer returns lots of homonym/fan-account matches — rank by fan count so
  // the real artist surfaces first, then dedupe by name.
  const sorted = [...data.data].sort((a, b) => b.nb_fan - a.nb_fan);
  const seen = new Set<string>();
  return sorted
    .filter((a) => {
      const key = a.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((a) => ({ id: a.id, name: a.name }));
}

export async function getArtistAlbums(artistId: number): Promise<DeezerAlbum[]> {
  const data = await deezerProxy<{ data: Array<{ id: number; title: string; cover_medium: string }> }>(
    "artist-albums",
    { id: String(artistId) },
  );
  // Deezer lists deluxe/regional re-releases of the same album as separate
  // entries — dedupe by name so the picker isn't cluttered with near-duplicates.
  const seen = new Set<string>();
  return data.data
    .filter((a) => {
      const key = a.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((a) => ({ id: a.id, name: a.title, artworkUrl: a.cover_medium }));
}

export async function getAlbumTracks(albumId: number): Promise<DeezerTrack[]> {
  const data = await deezerProxy<{ data: DeezerTrackObject[] }>("album-tracks", { id: String(albumId) });
  return data.data.map(toTrack);
}

export async function getArtistAllTracks(artistId: number): Promise<DeezerTrack[]> {
  const data = await deezerProxy<{ data: DeezerTrackObject[] }>("artist-tracks", { id: String(artistId) });
  const seen = new Set<string>();
  return data.data
    .filter((t) => {
      const key = t.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(toTrack);
}
