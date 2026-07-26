import type { TierItem } from "@/lib/types";

export function ItemThumbnail({ item }: { item: TierItem }) {
  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnailUrl}
        alt={item.label}
        className="h-full w-full object-cover"
        draggable={false}
      />
      {item.type === "youtube" && (
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
          ▶
        </span>
      )}
    </div>
  );
}
