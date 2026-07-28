"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

const CONFIRM_WORD = "SUPPRIMER";

export default function AccountPage() {
  const router = useRouter();
  const { user, session, loading, signOut } = useAuth();
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  async function handleDeleteAccount() {
    if (!session) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Une erreur est survenue.");
      // Deliberately no router.push here: signOut() flips `user` to null, and the
      // redirect effect above already sends us to /login once that happens.
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setDeleting(false);
    }
  }

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center text-zinc-500">Chargement...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 p-4 py-10 sm:p-8">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-white">Mon compte</h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-red-900/60 bg-red-950/20 p-4">
        <h2 className="font-display text-xl tracking-wide text-red-400">Supprimer mon compte</h2>
        <p className="text-sm text-zinc-300">
          Cette action est définitive : ton compte, toutes tes tier lists et les images que tu as
          ajoutées seront supprimés immédiatement et ne pourront pas être récupérés.
        </p>
        <p className="text-sm text-zinc-400">
          Pour confirmer, tape <span className="font-mono text-zinc-200">{CONFIRM_WORD}</span> ci-dessous :
        </p>
        <input
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-red-500"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={handleDeleteAccount}
          disabled={confirmInput !== CONFIRM_WORD || deleting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40"
        >
          {deleting ? "Suppression..." : "Supprimer définitivement mon compte"}
        </button>
      </div>
    </div>
  );
}
