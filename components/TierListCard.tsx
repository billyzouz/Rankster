"use client";

import Link from "next/link";
import type { TierListDoc } from "@/lib/types";
import { CopyIcon, TrashIcon } from "./icons";

interface TierListCardProps {
  doc: TierListDoc;
  isOwner: boolean;
  canDelete: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
}

const VISIBILITY_LABEL: Record<TierListDoc["visibility"], string> = {
  private: "Privée",
  unlisted: "Non répertoriée",
  public: "Publique",
};

export function TierListCard({ doc, isOwner, canDelete, onDuplicate, onDelete }: TierListCardProps) {
  const thumbs = doc.items.slice(0, 4).map((item) => item.thumbnailUrl);
  const sortedTiers = [...doc.tiers].sort((a, b) => a.order - b.order);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 transition hover:border-ember/60 hover:shadow-lg hover:shadow-black/40">
      <Link href={`/editor/${doc.id}`} className="block">
        <div className="grid h-36 grid-cols-2 grid-rows-2 gap-px overflow-hidden bg-zinc-950">
          {thumbs.length > 0 ? (
            Array.from({ length: 4 }).map((_, i) =>
              thumbs[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={thumbs[i]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div key={i} className="h-full w-full bg-zinc-800" />
              ),
            )
          ) : (
            <div className="col-span-2 row-span-2 flex h-full w-full flex-col">
              {sortedTiers.slice(0, 6).map((tier) => (
                <div key={tier.id} className="flex-1" style={{ backgroundColor: tier.color }} />
              ))}
            </div>
          )}
        </div>
        <div className="px-3 py-2">
          <p className="truncate font-semibold text-white">{doc.title || "Sans titre"}</p>
          <p className="font-mono text-xs text-zinc-500">
            {doc.items.length} item{doc.items.length > 1 ? "s" : ""} · {doc.tiers.length} tiers
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {isOwner ? VISIBILITY_LABEL[doc.visibility] : `par ${doc.ownerUsername ?? "?"}`}
          </p>
        </div>
      </Link>

      {(isOwner || canDelete) && (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          {isOwner && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDuplicate();
              }}
              className="rounded-md bg-black/70 p-1.5 text-zinc-200 hover:bg-black hover:text-white"
              title="Dupliquer"
            >
              <CopyIcon className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="rounded-md bg-black/70 p-1.5 text-red-400 hover:bg-black hover:text-red-300"
              title={isOwner ? "Supprimer" : "Supprimer (admin)"}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
