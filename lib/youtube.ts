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
