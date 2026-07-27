"use client";

import { useEffect, useState } from "react";
import { compareTierLists, type ComparisonSummary, type RankedList } from "@/lib/compare";
import { loadComparisonSnapshot } from "@/lib/comparisonSnapshot";
import { CloseIcon } from "./icons";

interface CompareModalProps {
  mine: RankedList;
  code: string;
  onClose: () => void;
}

const MATCH_LABEL: Record<ComparisonSummary["rows"][number]["match"], string> = {
  same: "Même tier",
  close: "Tier voisin",
  different: "Avis opposés",
  pending: "Pas encore classé des deux côtés",
};

export function CompareModal({ mine, code, onClose }: CompareModalProps) {
  const [theirs, setTheirs] = useState<RankedList | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = await loadComparisonSnapshot(code);
      if (!cancelled) setTheirs(snapshot);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const summary = theirs ? compareTierLists(mine, theirs) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Comparaison — code {code}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Fermer"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {theirs === undefined && <p className="text-zinc-400">Chargement...</p>}

        {theirs === null && (
          <p className="text-zinc-400">
            Code introuvable ou expiré — les codes ne sont valables que 14 jours.
          </p>
        )}

        {summary && (
          <>
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-zinc-300">
                {summary.same} identiques
              </span>
              <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-zinc-300">
                {summary.close} proches
              </span>
              <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-zinc-300">
                {summary.different} différents
              </span>
              {summary.pending > 0 && (
                <span className="rounded-md border border-zinc-700 px-2.5 py-1 text-zinc-500">
                  {summary.pending} en attente
                </span>
              )}
            </div>

            {summary.rows.length === 0 ? (
              <p className="text-zinc-400">Aucun item en commun entre les deux listes.</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {summary.rows.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/60 p-2"
                    title={MATCH_LABEL[row.match]}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.thumbnailUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                    <p className="min-w-0 flex-1 truncate text-sm text-zinc-200" title={row.label}>
                      {row.label || "Sans titre"}
                    </p>
                    <span
                      className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: row.mine.tierColor ?? "#3f3f46" }}
                    >
                      {row.mine.tierLabel ?? "–"}
                    </span>
                    <span
                      className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: row.theirs.tierColor ?? "#3f3f46" }}
                    >
                      {row.theirs.tierLabel ?? "–"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
