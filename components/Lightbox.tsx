"use client";

import { useState } from "react";
import { extractYoutubeId, getYoutubeEmbedUrl } from "@/lib/youtube";
import type { TierItem } from "@/lib/types";
import { CloseIcon } from "./icons";

interface LightboxProps {
  item: TierItem | null;
  onClose: () => void;
  onRename: (itemId: string, label: string) => void;
  readOnly?: boolean;
}

export function Lightbox({ item, onClose, onRename, readOnly = false }: LightboxProps) {
  const [draftLabel, setDraftLabel] = useState(item?.label ?? "");
  const [lastItemId, setLastItemId] = useState(item?.id ?? null);

  if (item && item.id !== lastItemId) {
    setLastItemId(item.id);
    setDraftLabel(item.label);
  }

  if (!item) return null;

  const videoId = item.type === "youtube" && item.sourceUrl ? extractYoutubeId(item.sourceUrl) : null;
  const isMusic = item.type === "music";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center gap-2 text-white">
          <input
            value={draftLabel}
            onChange={(e) => {
              setDraftLabel(e.target.value);
              onRename(item.id, e.target.value);
            }}
            readOnly={readOnly}
            placeholder="Nom de l'item"
            className="min-w-0 flex-1 truncate bg-transparent font-medium outline-none placeholder:text-white/40"
          />
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10" aria-label="Fermer">
            <CloseIcon className="h-5 w-5" />
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
        {isMusic && (
          <div className="mt-3 flex flex-col gap-2">
            {item.previewUrl ? (
              <audio src={item.previewUrl} controls autoPlay className="w-full" />
            ) : (
              <p className="text-sm text-white/60">Aucun extrait audio disponible pour ce titre.</p>
            )}
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-sm text-ember hover:underline"
              >
                Écouter en entier sur Apple Music →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
