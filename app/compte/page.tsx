"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";

const CONFIRM_WORD = "SUPPRIMER";
const UNIQUE_VIOLATION = "23505";

export default function AccountPage() {
  const router = useRouter();
  const { user, session, loading, signOut } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [usernameLoaded, setUsernameLoaded] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled && data) {
          setUsername(data.username);
          setUsernameLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSaveUsername() {
    if (!user) return;
    setUsernameError(null);
    setUsernameSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: username.trim() })
        .eq("id", user.id);
      if (error) throw error;
      showToast("Pseudo mis à jour");
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === UNIQUE_VIOLATION) {
        setUsernameError("Ce pseudo est déjà pris.");
      } else {
        setUsernameError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleSavePassword() {
    if (!user?.email) return;
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      });
      if (error) {
        throw new Error(
          error.message.includes("Invalid login credentials") ||
            error.message.toLowerCase().includes("current password")
            ? "Mot de passe actuel incorrect."
            : error.message,
        );
      }
      showToast("Mot de passe mis à jour");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!session) return;
    setDeleteError(null);
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
      setDeleteError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setDeleting(false);
    }
  }

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center text-zinc-500">Chargement...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-2 p-4 py-3 sm:p-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Mon compte</h1>
        <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <h2 className="font-display text-lg tracking-wide text-white">Pseudo</h2>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={!usernameLoaded}
          minLength={2}
          maxLength={24}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-ember disabled:opacity-50"
        />
        {usernameError && <p className="text-sm text-red-400">{usernameError}</p>}
        <button
          onClick={handleSaveUsername}
          disabled={!usernameLoaded || usernameSaving || !username.trim()}
          className="self-start rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
        >
          {usernameSaving ? "..." : "Enregistrer le pseudo"}
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <h2 className="font-display text-lg tracking-wide text-white">Mot de passe</h2>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Mot de passe actuel"
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          minLength={8}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirme le nouveau mot de passe"
          minLength={8}
          className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
        />
        {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
        <button
          onClick={handleSavePassword}
          disabled={passwordSaving || !currentPassword || newPassword.length < 8}
          className="self-start rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-40"
        >
          {passwordSaving ? "..." : "Enregistrer le mot de passe"}
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-red-900/60 bg-red-950/20 p-3">
        <h2 className="font-display text-lg tracking-wide text-red-400">Supprimer mon compte</h2>
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
        {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
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
