"use client";

import { useRef, useState } from "react";
import { getAnimeCharacters, searchAnime, type AnimeResult } from "@/lib/anilist";
import type { GalleryImage } from "@/lib/gallery";
import {
  getAlbumTracks,
  getArtistAlbums,
  getArtistAllTracks,
  searchArtists,
  type ItunesAlbum,
  type ItunesArtist,
  type ItunesTrack,
} from "@/lib/itunes";
import {
  extractYoutubePlaylistId,
  fetchYoutubeMeta,
  fetchYoutubePlaylistItems,
  guessOpeningEndingLabel,
  type YoutubeMeta,
} from "@/lib/youtube";
import { searchWikimediaImages } from "@/lib/wikimedia";
import { CloseIcon, PlayIcon } from "./icons";

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
  onAddYoutubePlaylist: (items: YoutubeMeta[]) => void;
  onAddGalleryImages: (items: GalleryImage[]) => void;
  onAddMusicItems: (items: ItunesTrack[]) => void;
}

type Tab = "image" | "youtube" | "gallery" | "music";
type GalleryMode = "anime" | "wikimedia";

export function AddItemModal({
  open,
  onClose,
  onAddImages,
  onAddYoutube,
  onAddYoutubePlaylist,
  onAddGalleryImages,
  onAddMusicItems,
}: AddItemModalProps) {
  const [tab, setTab] = useState<Tab>("image");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [preview, setPreview] = useState<YoutubeMeta | null>(null);
  const [pendingPlaylist, setPendingPlaylist] = useState<YoutubeMeta[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [galleryMode, setGalleryMode] = useState<GalleryMode>("anime");
  const [galleryQuery, setGalleryQuery] = useState("");
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [animeResults, setAnimeResults] = useState<AnimeResult[] | null>(null);
  const [selectedAnime, setSelectedAnime] = useState<AnimeResult | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[] | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set());

  const [musicQuery, setMusicQuery] = useState("");
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [artistResults, setArtistResults] = useState<ItunesArtist[] | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<ItunesArtist | null>(null);
  const [albumResults, setAlbumResults] = useState<ItunesAlbum[] | null>(null);
  const [musicTracks, setMusicTracks] = useState<ItunesTrack[] | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());
  const [playingPreview, setPlayingPreview] = useState<number | null>(null);

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
    setPendingPlaylist(null);
    try {
      if (extractYoutubePlaylistId(youtubeUrl)) {
        const items = await fetchYoutubePlaylistItems(youtubeUrl);
        setPendingPlaylist(
          items.map((item) => ({ ...item, title: guessOpeningEndingLabel(item.title) ?? item.title })),
        );
      } else {
        const meta = await fetchYoutubeMeta(youtubeUrl);
        setPreview({ ...meta, title: guessOpeningEndingLabel(meta.title) ?? meta.title });
      }
    } catch (err) {
      setYoutubeError(err instanceof Error ? err.message : "Impossible de charger ce lien YouTube.");
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

  function updatePlaylistItemTitle(videoId: string, title: string) {
    setPendingPlaylist((prev) =>
      prev ? prev.map((item) => (item.videoId === videoId ? { ...item, title } : item)) : prev,
    );
  }

  function removePlaylistItem(videoId: string) {
    setPendingPlaylist((prev) => (prev ? prev.filter((item) => item.videoId !== videoId) : prev));
  }

  function handleConfirmAddPlaylist() {
    if (!pendingPlaylist || pendingPlaylist.length === 0) return;
    onAddYoutubePlaylist(
      pendingPlaylist.map((item) => ({ ...item, title: item.title.trim() || item.title })),
    );
    setPendingPlaylist(null);
    setYoutubeUrl("");
  }

  function resetGallery() {
    setGalleryQuery("");
    setAnimeResults(null);
    setSelectedAnime(null);
    setGalleryImages(null);
    setSelectedImages(new Set());
    setGalleryError(null);
  }

  function switchGalleryMode(mode: GalleryMode) {
    setGalleryMode(mode);
    resetGallery();
  }

  async function handleGallerySearch() {
    if (!galleryQuery.trim()) return;
    setGalleryLoading(true);
    setGalleryError(null);
    setSelectedImages(new Set());
    try {
      if (galleryMode === "anime") {
        setGalleryImages(null);
        setSelectedAnime(null);
        setAnimeResults(await searchAnime(galleryQuery));
      } else {
        setAnimeResults(null);
        setGalleryImages(await searchWikimediaImages(galleryQuery));
      }
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function handleSelectAnime(anime: AnimeResult) {
    setSelectedAnime(anime);
    setAnimeResults(null);
    setGalleryLoading(true);
    setGalleryError(null);
    setSelectedImages(new Set());
    try {
      setGalleryImages(await getAnimeCharacters(anime.id));
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setGalleryLoading(false);
    }
  }

  function handleBackToAnimeSearch() {
    setSelectedAnime(null);
    setGalleryImages(null);
    setSelectedImages(new Set());
  }

  function toggleImageSelection(index: number) {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleConfirmGallery() {
    if (!galleryImages) return;
    const chosen = galleryImages.filter((_, i) => selectedImages.has(i));
    if (chosen.length === 0) return;
    onAddGalleryImages(chosen);
    resetGallery();
  }

  function resetMusic() {
    setMusicQuery("");
    setArtistResults(null);
    setSelectedArtist(null);
    setAlbumResults(null);
    setMusicTracks(null);
    setSelectedTracks(new Set());
    setMusicError(null);
    setPlayingPreview(null);
  }

  async function handleMusicSearch() {
    if (!musicQuery.trim()) return;
    setMusicLoading(true);
    setMusicError(null);
    try {
      setArtistResults(await searchArtists(musicQuery));
    } catch (err) {
      setMusicError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setMusicLoading(false);
    }
  }

  function handleSelectArtist(artist: ItunesArtist) {
    setSelectedArtist(artist);
    setArtistResults(null);
  }

  async function handleChooseAllTracks() {
    if (!selectedArtist) return;
    setMusicLoading(true);
    setMusicError(null);
    try {
      setMusicTracks(await getArtistAllTracks(selectedArtist.id, selectedArtist.name));
    } catch (err) {
      setMusicError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setMusicLoading(false);
    }
  }

  async function handleChooseAlbumMode() {
    if (!selectedArtist) return;
    setMusicLoading(true);
    setMusicError(null);
    try {
      setAlbumResults(await getArtistAlbums(selectedArtist.id, selectedArtist.name));
    } catch (err) {
      setMusicError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setMusicLoading(false);
    }
  }

  async function handleSelectAlbum(album: ItunesAlbum) {
    setAlbumResults(null);
    setMusicLoading(true);
    setMusicError(null);
    setSelectedTracks(new Set());
    try {
      setMusicTracks(await getAlbumTracks(album.id));
    } catch (err) {
      setMusicError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setMusicLoading(false);
    }
  }

  function handleBackFromTracks() {
    setAlbumResults(null);
    setMusicTracks(null);
    setSelectedTracks(new Set());
    setPlayingPreview(null);
  }

  function handleBackToArtistSearch() {
    setSelectedArtist(null);
    setAlbumResults(null);
    setMusicTracks(null);
    setSelectedTracks(new Set());
    setPlayingPreview(null);
  }

  function toggleTrackSelection(index: number) {
    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleConfirmMusic() {
    if (!musicTracks) return;
    const chosen = musicTracks.filter((_, i) => selectedTracks.has(i));
    if (chosen.length === 0) return;
    onAddMusicItems(chosen);
    resetMusic();
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
          {/* "Galerie" tab hidden for now — catalogue too thin per-anime to be worth surfacing yet.
              Re-enable by adding this button back; the tab body and lib code are untouched. */}
          <button
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
              tab === "music" ? "bg-zinc-700 text-white shadow" : "text-zinc-400"
            }`}
            onClick={() => setTab("music")}
          >
            Musique
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
                Selon la visibilité de la tier list, tes images pourront être visibles par d&apos;autres personnes.
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
        ) : tab === "youtube" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePreview();
                }}
                placeholder="Lien d'une vidéo ou d'une playlist YouTube..."
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
            {pendingPlaylist && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-zinc-400">
                  {pendingPlaylist.length} vidéo{pendingPlaylist.length > 1 ? "s" : ""} trouvée
                  {pendingPlaylist.length > 1 ? "s" : ""} — modifie les noms si besoin, puis confirme :
                </p>
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                  {pendingPlaylist.map((item) => (
                    <div
                      key={item.videoId}
                      className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-10 w-16 shrink-0 rounded object-cover"
                      />
                      <input
                        value={item.title}
                        onChange={(e) => updatePlaylistItemTitle(item.videoId, e.target.value)}
                        className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white outline-none focus:border-ember"
                      />
                      <button
                        onClick={() => removePlaylistItem(item.videoId)}
                        className="shrink-0 rounded p-1 text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
                        aria-label="Retirer cette vidéo"
                        title="Retirer cette vidéo"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleConfirmAddPlaylist}
                  disabled={pendingPlaylist.length === 0}
                  className="rounded-md bg-ember px-4 py-2 text-sm font-medium text-white transition hover:bg-ember-hover disabled:opacity-50"
                >
                  Ajouter {pendingPlaylist.length} vidéo{pendingPlaylist.length > 1 ? "s" : ""}
                </button>
              </div>
            )}
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
        ) : tab === "gallery" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 rounded-lg bg-zinc-800 p-1">
              <button
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
                  galleryMode === "anime" ? "bg-zinc-700 text-white" : "text-zinc-400"
                }`}
                onClick={() => switchGalleryMode("anime")}
              >
                Anime / Manga
              </button>
              <button
                className={`flex-1 rounded-md py-1 text-xs font-medium transition ${
                  galleryMode === "wikimedia" ? "bg-zinc-700 text-white" : "text-zinc-400"
                }`}
                onClick={() => switchGalleryMode("wikimedia")}
              >
                Wikimedia (photos libres)
              </button>
            </div>

            {selectedAnime && (
              <button
                onClick={handleBackToAnimeSearch}
                className="self-start text-xs text-zinc-400 hover:text-white"
              >
                ← {selectedAnime.title}
              </button>
            )}

            {!selectedAnime && (
              <div className="flex gap-2">
                <input
                  value={galleryQuery}
                  onChange={(e) => setGalleryQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGallerySearch();
                  }}
                  placeholder={
                    galleryMode === "anime" ? "Nom d'un anime/manga..." : "Rechercher une image..."
                  }
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
                />
                <button
                  onClick={handleGallerySearch}
                  disabled={galleryLoading || !galleryQuery.trim()}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {galleryLoading ? "..." : "Chercher"}
                </button>
              </div>
            )}

            {galleryError && <p className="text-sm text-red-400">{galleryError}</p>}

            {animeResults && (
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
                {animeResults.length === 0 && (
                  <p className="text-sm text-zinc-500">Aucun résultat.</p>
                )}
                {animeResults.map((anime) => (
                  <button
                    key={anime.id}
                    onClick={() => handleSelectAnime(anime)}
                    className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-2 text-left transition hover:border-ember"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={anime.coverImage} alt="" className="h-12 w-9 shrink-0 rounded object-cover" />
                    <span className="truncate text-sm text-white">{anime.title}</span>
                  </button>
                ))}
              </div>
            )}

            {galleryImages && (
              <>
                <p className="text-xs font-medium text-zinc-400">
                  {galleryImages.length === 0
                    ? "Aucun résultat."
                    : "Clique pour sélectionner les images à ajouter :"}
                </p>
                <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => toggleImageSelection(index)}
                      className={`flex flex-col overflow-hidden rounded-md border-2 text-left transition ${
                        selectedImages.has(index)
                          ? "border-ember"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.thumbnailUrl} alt="" className="aspect-square w-full object-cover" />
                      <span
                        className="truncate bg-zinc-900 px-1 py-0.5 text-[10px] text-zinc-300"
                        title={img.label}
                      >
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
                {galleryImages.length > 0 && (
                  <button
                    onClick={handleConfirmGallery}
                    disabled={selectedImages.size === 0}
                    className="rounded-md bg-ember px-4 py-2 text-sm font-medium text-white transition hover:bg-ember-hover disabled:opacity-50"
                  >
                    Ajouter {selectedImages.size} image{selectedImages.size > 1 ? "s" : ""}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedArtist && (
              <button
                onClick={handleBackToArtistSearch}
                className="self-start text-xs text-zinc-400 hover:text-white"
              >
                ← {selectedArtist.name}
              </button>
            )}

            {!selectedArtist && (
              <div className="flex gap-2">
                <input
                  value={musicQuery}
                  onChange={(e) => setMusicQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleMusicSearch();
                  }}
                  placeholder="Nom d'un artiste..."
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
                />
                <button
                  onClick={handleMusicSearch}
                  disabled={musicLoading || !musicQuery.trim()}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {musicLoading ? "..." : "Chercher"}
                </button>
              </div>
            )}

            {musicError && <p className="text-sm text-red-400">{musicError}</p>}

            {artistResults && (
              <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
                {artistResults.length === 0 && <p className="text-sm text-zinc-500">Aucun résultat.</p>}
                {artistResults.map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => handleSelectArtist(artist)}
                    className="rounded-md border border-zinc-700 bg-zinc-800/50 p-2 text-left text-sm text-white transition hover:border-ember"
                  >
                    {artist.name}
                  </button>
                ))}
              </div>
            )}

            {selectedArtist && !albumResults && !musicTracks && (
              <div className="flex gap-2">
                <button
                  onClick={handleChooseAlbumMode}
                  disabled={musicLoading}
                  className="flex-1 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {musicLoading ? "..." : "Un album"}
                </button>
                <button
                  onClick={handleChooseAllTracks}
                  disabled={musicLoading}
                  className="flex-1 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
                >
                  {musicLoading ? "..." : "Toutes ses musiques"}
                </button>
              </div>
            )}

            {albumResults && (
              <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
                {albumResults.length === 0 && (
                  <p className="col-span-4 text-sm text-zinc-500">Aucun album trouvé.</p>
                )}
                {albumResults.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => handleSelectAlbum(album)}
                    className="flex flex-col overflow-hidden rounded-md border-2 border-zinc-700 text-left transition hover:border-ember"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={album.artworkUrl} alt="" className="aspect-square w-full object-cover" />
                    <span
                      className="truncate bg-zinc-900 px-1 py-0.5 text-[10px] text-zinc-300"
                      title={album.name}
                    >
                      {album.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {musicTracks && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-400">
                    {musicTracks.length === 0
                      ? "Aucun résultat."
                      : "Clique pour sélectionner les musiques à ajouter :"}
                  </p>
                  {albumResults === null && musicTracks.length > 0 && (
                    <button
                      onClick={handleBackFromTracks}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      ← retour
                    </button>
                  )}
                </div>
                <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto pr-1">
                  {musicTracks.map((track, index) => (
                    <button
                      key={index}
                      onClick={() => toggleTrackSelection(index)}
                      className={`relative flex flex-col overflow-hidden rounded-md border-2 text-left transition ${
                        selectedTracks.has(index)
                          ? "border-ember"
                          : "border-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={track.thumbnailUrl} alt="" className="aspect-square w-full object-cover" />
                      {track.previewUrl && (
                        <span
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingPreview(playingPreview === index ? null : index);
                          }}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <PlayIcon className="h-3 w-3" />
                        </span>
                      )}
                      <span
                        className="truncate bg-zinc-900 px-1 py-0.5 text-[10px] text-zinc-300"
                        title={track.label}
                      >
                        {track.label}
                      </span>
                    </button>
                  ))}
                </div>
                {playingPreview !== null && musicTracks[playingPreview]?.previewUrl && (
                  <audio
                    key={playingPreview}
                    src={musicTracks[playingPreview].previewUrl}
                    autoPlay
                    controls
                    onEnded={() => setPlayingPreview(null)}
                    className="h-8 w-full"
                  />
                )}
                {musicTracks.length > 0 && (
                  <button
                    onClick={handleConfirmMusic}
                    disabled={selectedTracks.size === 0}
                    className="rounded-md bg-ember px-4 py-2 text-sm font-medium text-white transition hover:bg-ember-hover disabled:opacity-50"
                  >
                    Ajouter {selectedTracks.size} musique{selectedTracks.size > 1 ? "s" : ""}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
