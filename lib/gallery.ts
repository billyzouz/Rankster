/** A pickable image from an external gallery source — always hotlinked, never uploaded to our own storage. */
export interface GalleryImage {
  label: string;
  thumbnailUrl: string;
  /** Page to credit/visit for this image's source, shown for attribution. */
  sourceUrl?: string;
}
