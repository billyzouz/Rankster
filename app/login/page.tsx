"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() } },
        });
        if (error) throw error;
        if (!data.session) setConfirmationSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-4">
      <div className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" className="mx-auto h-14 w-auto" />
        <h1 className="mt-3 font-display text-3xl tracking-wide text-white">Rankster</h1>
      </div>

      <div className="flex gap-2 rounded-lg bg-zinc-800 p-1">
        <button
          onClick={() => {
            setMode("login");
            setError(null);
            setConfirmationSent(false);
          }}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
            mode === "login" ? "bg-zinc-700 text-white shadow" : "text-zinc-400"
          }`}
        >
          Connexion
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setError(null);
            setConfirmationSent(false);
          }}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
            mode === "signup" ? "bg-zinc-700 text-white shadow" : "text-zinc-400"
          }`}
        >
          Créer un compte
        </button>
      </div>

      {confirmationSent ? (
        <p className="rounded-md border border-zinc-700 bg-zinc-900 p-4 text-center text-sm text-zinc-300">
          Compte créé ! Vérifie ta boîte mail ({email}) pour confirmer ton adresse, puis connecte-toi.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pseudo"
              required
              minLength={2}
              maxLength={24}
              className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            minLength={6}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-ember"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-ember px-4 py-2 text-sm font-semibold text-white transition hover:bg-ember-hover disabled:opacity-50"
          >
            {submitting ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      )}
    </div>
  );
}
