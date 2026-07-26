"use client";

import { extractYoutubeId, getYoutubeEmbedUrl } from "@/lib/youtube";
import type { TierItem } from "@/lib/types";

interface LightboxProps {
  item: TierItem | null;
  onClose: () => void;
}

export function Lightbox({ item, onClose }: LightboxProps) {
  if (!item) return null;

  const videoId = item.type === "youtube" && item.sourceUrl ? extractYoutubeId(item.sourceUrl) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between text-white">
          <p className="truncate font-medium">{item.label}</p>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" aria-label="Fermer">
            ✕
          </button>
        </div>
        {videoId ? (
          <iframe
            src={getYoutubeEmbedUrl(videoId)}
            title={item.label}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="aspect-video w-full rounded-lg"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.label}
            className="max-h-[80vh] w-full rounded-lg object-contain"
          />
        )}
      </div>
    </div>
  );
}
