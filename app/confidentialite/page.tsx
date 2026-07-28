import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Rankster",
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-10 sm:p-8">
      <h1 className="font-display text-3xl tracking-wide text-white">Politique de confidentialité</h1>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Responsable du traitement</h2>
        <p>
          Rankster, site personnel non professionnel. Contact :{" "}
          <a href="mailto:contact@rankster.fr" className="text-ember hover:underline">
            contact@rankster.fr
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Données collectées</h2>
        <ul className="list-inside list-disc">
          <li>Adresse email et mot de passe (haché, jamais stocké en clair), via Supabase Auth.</li>
          <li>Pseudo, affiché publiquement sur les tier lists que tu partages.</li>
          <li>Les images que tu uploades pour tes tier lists.</li>
          <li>Le contenu de tes tier lists (titres, organisation, liens YouTube).</li>
          <li>
            Les codes de comparaison que tu génères — un instantané anonyme de ton classement, sans
            lien avec ton identité, supprimé automatiquement au bout de 14 jours.
          </li>
        </ul>
        <p>Aucune autre donnée personnelle n&apos;est collectée (pas de téléphone, pas d&apos;adresse postale).</p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Pourquoi ces données</h2>
        <p>
          Uniquement pour faire fonctionner le service que tu as demandé : créer un compte, sauvegarder
          tes tier lists, les partager si tu le souhaites, et comparer tes classements avec tes amis.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Sous-traitants</h2>
        <ul className="list-inside list-disc">
          <li>Supabase — base de données, authentification, stockage des images.</li>
          <li>Vercel — hébergement du site.</li>
          <li>Google / YouTube Data API — uniquement si tu importes des vidéos ou playlists YouTube.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Durée de conservation</h2>
        <p>
          Tes données sont conservées tant que ton compte existe. Tu peux le supprimer à tout moment
          depuis la page{" "}
          <a href="/compte" className="text-ember hover:underline">
            Mon compte
          </a>
          , ce qui efface définitivement ton compte, tes tier lists et tes images.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Tes droits</h2>
        <p>Conformément au RGPD, tu peux à tout moment :</p>
        <ul className="list-inside list-disc">
          <li>Accéder à tes données — elles sont déjà toutes visibles directement dans l&apos;app.</li>
          <li>Les rectifier.</li>
          <li>
            Les supprimer intégralement, depuis la page{" "}
            <a href="/compte" className="text-ember hover:underline">
              Mon compte
            </a>
            .
          </li>
          <li>T&apos;opposer à leur traitement en supprimant ton compte.</li>
        </ul>
        <p>
          Pour toute question, écris à{" "}
          <a href="mailto:contact@rankster.fr" className="text-ember hover:underline">
            contact@rankster.fr
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Cookies et stockage local</h2>
        <p>
          Rankster n&apos;utilise aucun cookie de suivi publicitaire. Le site utilise le stockage local
          de ton navigateur (localStorage) uniquement pour garder ta session de connexion active et,
          si tu n&apos;as pas de compte, pour te souvenir localement de ton propre classement d&apos;une
          tier list. Ces données ne quittent jamais ton navigateur et sont strictement nécessaires au
          fonctionnement du service.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Sécurité</h2>
        <p>
          Les données sont protégées par des règles d&apos;accès strictes au niveau de la base de
          données, et toutes les communications transitent en HTTPS.
        </p>
      </section>
    </div>
  );
}
