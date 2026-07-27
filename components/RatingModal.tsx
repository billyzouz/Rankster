"use client";

import { useEffect, useState } from "react";
import type { TierItem } from "@/lib/types";
import { extractYoutubeId, getYoutubeEmbedUrl } from "@/lib/youtube";
import { CloseIcon, PlayIcon } from "./icons";

interface RatingModalProps {
  items: TierItem[];
  onClose: () => void;
  onComplete: (scores: Map<string, number>) => void;
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function RatingModal({ items, onClose, onComplete }: RatingModalProps) {
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);

  const current = items[index];
  const isLast = index >= items.length - 1;
  const videoId =
    current?.type === "youtube" && current.sourceUrl ? extractYoutubeId(current.sourceUrl) : null;
  const playing = current ? playingItemId === current.id : false;

  function applyScore(value: number) {
    if (!current) return;
    const next = new Map(scores);
    next.set(current.id, value);
    setScores(next);
    if (isLast) {
      onComplete(next);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function skip() {
    if (isLast) {
      onComplete(scores);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function goBack() {
    setIndex((i) => Math.max(0, i - 1));
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goBack();
      } else if (e.key >= "1" && e.key <= "9") {
        applyScore(Number(e.key));
      } else if (e.key === "0") {
        applyScore(10);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-subscribes each render, which is fine for a human-paced modal
  }, [index, scores, current]);

  if (items.length === 0 || !current) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-300"
          onClick={(e) => e.stopPropagation()}
        >
          <p>Aucun item à noter — tout est déjà classé.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-md bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-hover"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            {index + 1} / {items.length}
          </p>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Fermer"
            title="Fermer sans classer"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-ember transition-all"
            style={{ width: `${(index / items.length) * 100}%` }}
          />
        </div>

        <div className="relative overflow-hidden rounded-lg bg-black">
          {videoId && playing ? (
            <iframe
              src={getYoutubeEmbedUrl(videoId)}
              title={current.label}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="aspect-video w-full"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.thumbnailUrl}
                alt={current.label}
                className="aspect-video w-full object-cover"
              />
              {videoId && (
                <button
                  onClick={() => setPlayingItemId(current.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition hover:bg-black/50"
                  aria-label="Regarder la vidéo"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70">
                    <PlayIcon className="h-6 w-6" />
                  </span>
                </button>
              )}
            </>
          )}
        </div>

        <p className="truncate text-center font-medium text-white" title={current.label}>
          {current.label || "Sans titre"}
        </p>

        <div className="grid grid-cols-5 gap-2">
          {SCORES.map((value) => (
            <button
              key={value}
              onClick={() => applyScore(value)}
              className="rounded-md border border-zinc-700 py-2 text-sm font-semibold text-zinc-200 transition hover:border-ember hover:bg-ember/10 hover:text-white"
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <button
            onClick={goBack}
            disabled={index === 0}
            className="text-zinc-400 transition hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
          >
            ← Précédent
          </button>
          <div className="flex items-center gap-4">
            <button onClick={skip} className="text-zinc-400 transition hover:text-white">
              Passer
            </button>
            {scores.size > 0 && (
              <button
                onClick={() => onComplete(scores)}
                className="font-medium text-ember transition hover:text-ember-hover"
              >
                Terminer et classer ({scores.size})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
