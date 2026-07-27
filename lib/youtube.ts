export interface YoutubeMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  sourceUrl: string;
}

const YOUTUBE_ID_PATTERNS = [
  /youtube\.com\/watch\?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
];

export function extractYoutubeId(url: string): string | null {
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Uses YouTube's public oEmbed endpoint (no API key needed) to grab a title
 * and thumbnail. Falls back to the predictable img.youtube.com thumbnail URL
 * and a generic title if oEmbed is unreachable.
 */
export async function fetchYoutubeMeta(url: string): Promise<YoutubeMeta> {
  const videoId = extractYoutubeId(url.trim());
  if (!videoId) {
    throw new Error("Lien YouTube invalide.");
  }
  const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(sourceUrl)}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = (await res.json()) as { title?: string; thumbnail_url?: string };
      return {
        videoId,
        title: data.title ?? "Vidéo YouTube",
        thumbnailUrl: data.thumbnail_url ?? fallbackThumbnail,
        sourceUrl,
      };
    }
  } catch {
    // Network/CORS failure — fall back to the defaults below.
  }

  return { videoId, title: "Vidéo YouTube", thumbnailUrl: fallbackThumbnail, sourceUrl };
}

export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

export function extractYoutubePlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.searchParams.get("list");
  } catch {
    return null;
  }
}

interface YoutubePlaylistItemsResponse {
  nextPageToken?: string;
  items?: Array<{
    snippet?: {
      title?: string;
      resourceId?: { videoId?: string };
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
  error?: { message?: string };
}

/**
 * Fetches every video in a public YouTube playlist via the YouTube Data API v3
 * (requires NEXT_PUBLIC_YOUTUBE_API_KEY — playlist contents aren't available
 * through the key-less oEmbed endpoint used for single videos).
 */
export async function fetchYoutubePlaylistItems(url: string): Promise<YoutubeMeta[]> {
  const playlistId = extractYoutubePlaylistId(url);
  if (!playlistId) {
    throw new Error("Lien de playlist YouTube invalide.");
  }
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Import de playlist indisponible : clé API YouTube non configurée.");
  }

  const items: YoutubeMeta[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: "snippet",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    const data = (await res.json()) as YoutubePlaylistItemsResponse;
    if (!res.ok) {
      throw new Error(data.error?.message ?? "Impossible de charger cette playlist.");
    }

    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      const title = item.snippet?.title;
      if (!videoId || !title || title === "Deleted video" || title === "Private video") continue;
      const thumbnailUrl =
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      items.push({
        videoId,
        title,
        thumbnailUrl,
        sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  if (items.length === 0) {
    throw new Error("Cette playlist est vide, privée ou introuvable.");
  }
  return items;
}
