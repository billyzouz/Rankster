"use client";

import { useRef, useState } from "react";
import { fetchYoutubeMeta, type YoutubeMeta } from "@/lib/youtube";
import { CloseIcon } from "./icons";

export interface PendingImageItem {
  file: File;
  label: string;
}

interface PendingImage extends PendingImageItem {
  id: string;
  previewUrl: string;
}

interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAddImages: (items: PendingImageItem[]) => void;
  onAddYoutube: (meta: YoutubeMeta) => void;
}

type Tab = "image" | "youtube";

export function AddItemModal({ open, onClose, onAddImages, onAddYoutube }: AddItemModalProps) {
  const [tab, setTab] = useState<Tab>("image");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [preview, setPreview] = useState<YoutubeMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function stageFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    const staged: PendingImage[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      label: file.name.replace(/\.[^.]+$/, ""),
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...staged]);
  }

  function updatePendingLabel(id: string, label: string) {
    setPendingImages((prev) => prev.map((p) => (p.id === id ? { ...p, label } : p)));
  }

  function removePending(id: string) {
    setPendingImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function confirmAddImages() {
    if (pendingImages.length === 0) return;
    onAddImages(pendingImages.map((p) => ({ file: p.file, label: p.label.trim() || p.file.name })));
    pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPendingImages([]);
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
    onAddYoutube({ ...preview, title: preview.title.trim() || preview.title });
    setPreview(null);
    setYoutubeUrl("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Ajouter un item</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Fermer"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex gap-2 rounded-lg bg-zinc-800 p-1">
          <button
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              tab === "image" ? "bg-zinc-700 text-white shadow" : "text-zinc-400"
            }`}
            onClick={() => setTab("image")}
          >
            Image
          </button>
          <button
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              tab === "youtube" ? "bg-zinc-700 text-white shadow" : "text-zinc-400"
            }`}
            onClick={() => setTab("youtube")}
          >
            YouTube
          </button>
        </div>

        {tab === "image" ? (
          <div className="flex flex-col gap-3">
            <div
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center text-sm transition ${
                isDragging ? "border-ember bg-ember/10" : "border-zinc-700"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) stageFiles(e.dataTransfer.files);
              }}
            >
              <p className="text-zinc-400">Glisse des images ici, ou</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md bg-ember px-4 py-2 text-sm font-medium text-white transition hover:bg-ember-hover"
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
                  if (e.target.files) stageFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <p className="text-xs text-zinc-500">
                Tes images restent sur cet appareil — rien n&apos;est envoyé à un serveur.
              </p>
            </div>

            {pendingImages.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-400">
                  Modifie les noms si besoin, puis confirme :
                </p>
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                  {pendingImages.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.previewUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                      <input
                        value={p.label}
                        onChange={(e) => updatePendingLabel(p.id, e.target.value)}
                        className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white outline-none focus:border-ember"
                      />
                      <button
                        onClick={() => removePending(p.id)}
                        className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
                        aria-label="Retirer cette image"
                        title="Retirer cette image"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={confirmAddImages}
                  className="rounded-md bg-ember px-4 py-2 text-sm font-medium text-white transition hover:bg-ember-hover"
                >
                  Ajouter {pendingImages.length} image{pendingImages.length > 1 ? "s" : ""}
                </button>
              </div>
            )}
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
                className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
              />
              <button
                onClick={handlePreview}
                disabled={youtubeLoading || !youtubeUrl.trim()}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {youtubeLoading ? "..." : "Aperçu"}
              </button>
            </div>
            {youtubeError && <p className="text-sm text-red-400">{youtubeError}</p>}
            {preview && (
              <div className="flex items-center gap-3 rounded-md border border-zinc-700 bg-zinc-800/50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.thumbnailUrl}
                  alt={preview.title}
                  className="h-16 w-28 shrink-0 rounded object-cover"
                />
                <input
                  value={preview.title}
                  onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                  className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm font-medium text-white outline-none focus:border-ember"
                />
                <button
                  onClick={handleConfirmAdd}
                  className="shrink-0 rounded-md bg-ember px-3 py-1.5 text-sm font-medium text-white transition hover:bg-ember-hover"
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
