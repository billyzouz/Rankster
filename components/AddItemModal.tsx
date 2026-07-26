"use client";

import { useRef, useState } from "react";
import { fetchYoutubeMeta, type YoutubeMeta } from "@/lib/youtube";

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAddImages: (files: File[]) => void;
  onAddYoutube: (meta: YoutubeMeta) => void;
}

type Tab = "image" | "youtube";

export function AddItemModal({ open, onClose, onAddImages, onAddYoutube }: AddItemModalProps) {
  const [tab, setTab] = useState<Tab>("image");
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [preview, setPreview] = useState<YoutubeMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) onAddImages(files);
  }

  async function handlePreview() {
    if (!youtubeUrl.trim()) return;
    setYoutubeLoading(true);
    setYoutubeError(null);
    setPreview(null);
    try {
      const meta = await fetchYoutubeMeta(youtubeUrl);
      setPreview(meta);
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : "Impossible de charger cette vidéo.");
    } finally {
      setYoutubeLoading(false);
    }
  }

  function handleConfirmAdd() {
    if (!preview) return;
    onAddYoutube(preview);
    setPreview(null);
    setYoutubeUrl("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ajouter un item</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              tab === "image" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500"
            }`}
            onClick={() => setTab("image")}
          >
            Image
          </button>
          <button
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              tab === "youtube" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500"
            }`}
            onClick={() => setTab("youtube")}
          >
            YouTube
          </button>
        </div>

        {tab === "image" ? (
          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm transition ${
              isDragging
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
            }}
          >
            <p className="text-zinc-500">Glisse des images ici, ou</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Choisir des fichiers
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePreview();
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                onClick={handlePreview}
                disabled={youtubeLoading || !youtubeUrl.trim()}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
              >
                {youtubeLoading ? "..." : "Aperçu"}
              </button>
            </div>
            {youtubeError && <p className="text-sm text-red-500">{youtubeError}</p>}
            {preview && (
              <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.thumbnailUrl}
                  alt={preview.title}
                  className="h-16 w-28 shrink-0 rounded object-cover"
                />
                <p className="line-clamp-2 flex-1 text-sm font-medium">{preview.title}</p>
                <button
                  onClick={handleConfirmAdd}
                  className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
                >
                  Ajouter
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
