import type { TierItem } from "@/lib/types";
import { PlayIcon } from "./icons";

export function ItemThumbnail({ item }: { item: TierItem }) {
  return (
    <div className="flex w-14 flex-col overflow-hidden rounded-md border border-zinc-700 bg-zinc-800 shadow-sm">
      <div className="relative aspect-square w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnailUrl}
          alt={item.label}
          className="h-full w-full object-cover"
          draggable={false}
        />
        {item.type === "youtube" && (
          <span className="absolute bottom-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-white">
            <PlayIcon className="h-2 w-2" />
          </span>
        )}
      </div>
      <div
        className="truncate border-t border-zinc-700 bg-zinc-900 px-1 py-0.5 text-center text-[9px] leading-tight text-zinc-200"
        title={item.label}
      >
        {item.label || "Sans titre"}
      </div>
    </div>
  );
}
