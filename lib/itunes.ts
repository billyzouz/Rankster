export interface ItunesArtist {
  id: number;
  name: string;
}

export interface ItunesAlbum {
  id: number;
  name: string;
  artworkUrl: string;
}

export interface ItunesTrack {
  label: string;
  thumbnailUrl: string;
  sourceUrl?: string;
  previewUrl?: string;
}

/** Upsizes iTunes' default 100x100 artwork URL to a larger size when possible. */
function upsizeArtwork(url: string): string {
  return url.replace(/\/\d+x\d+bb\.jpg$/, "/300x300bb.jpg");
}

async function itunesProxy<T>(action: string, params: Record<string, string>): Promise<T> {
  const query = new URLSearchParams({ action, ...params });
  const res = await fetch(`/api/itunes?${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Impossible de contacter iTunes.");
  return data as T;
}

export async function searchArtists(query: string): Promise<ItunesArtist[]> {
  if (!query.trim()) return [];
  const data = await itunesProxy<{ results: Array<{ artistId: number; artistName: string }> }>(
    "search-artist",
    { term: query.trim() },
  );
  // Dedupe by name — iTunes often returns the same artist multiple times under different ids.
  const seen = new Set<string>();
  return data.results.filter((r) => {
    const key = r.artistName.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((r) => ({ id: r.artistId, name: r.artistName }));
}

export async function getArtistAlbums(artistId: number, artistName: string): Promise<ItunesAlbum[]> {
  const data = await itunesProxy<{
    results: Array<{
      wrapperType: string;
      collectionId: number;
      collectionName: string;
      artworkUrl100: string;
      artistName: string;
    }>;
  }>("artist-albums", { id: String(artistId) });
  const normalizedName = artistName.toLowerCase();
  return data.results
    // The lookup includes every release the artist appears on, including singles by other
    // artists where they're just a feature — only keep releases actually credited to them.
    .filter((r) => r.wrapperType === "collection" && r.artistName.toLowerCase().includes(normalizedName))
    .map((r) => ({ id: r.collectionId, name: r.collectionName, artworkUrl: upsizeArtwork(r.artworkUrl100) }));
}

export async function getAlbumTracks(albumId: number): Promise<ItunesTrack[]> {
  const data = await itunesProxy<{
    results: Array<{
      wrapperType: string;
      trackName?: string;
      artworkUrl100?: string;
      trackViewUrl?: string;
      previewUrl?: string;
    }>;
  }>("album-tracks", { id: String(albumId) });
  return data.results
    .filter((r) => r.wrapperType === "track" && r.trackName)
    .map((r) => ({
      label: r.trackName!,
      thumbnailUrl: r.artworkUrl100 ? upsizeArtwork(r.artworkUrl100) : "",
      sourceUrl: r.trackViewUrl,
      previewUrl: r.previewUrl,
    }));
}

export async function getArtistAllTracks(artistId: number, artistName: string): Promise<ItunesTrack[]> {
  const data = await itunesProxy<{
    results: Array<{
      wrapperType: string;
      trackName?: string;
      artworkUrl100?: string;
      trackViewUrl?: string;
      previewUrl?: string;
      artistName: string;
    }>;
  }>("artist-tracks", { id: String(artistId) });
  const normalizedName = artistName.toLowerCase();
  const seen = new Set<string>();
  return data.results
    // The lookup includes every track the artist appears on (features, other artists'
    // releases) — only keep tracks actually credited to them, then dedupe by title.
    .filter((r) => r.wrapperType === "track" && r.trackName && r.artistName.toLowerCase().includes(normalizedName))
    .filter((r) => {
      const key = r.trackName!.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r) => ({
      label: r.trackName!,
      thumbnailUrl: r.artworkUrl100 ? upsizeArtwork(r.artworkUrl100) : "",
      sourceUrl: r.trackViewUrl,
      previewUrl: r.previewUrl,
    }));
}
