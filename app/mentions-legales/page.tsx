import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Rankster",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-10 sm:p-8">
      <h1 className="font-display text-3xl tracking-wide text-white">Mentions légales</h1>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Éditeur du site</h2>
        <p>
          Rankster est édité à titre non professionnel par une personne physique. Conformément à
          l&apos;article 6-III de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
          numérique, l&apos;éditeur, agissant à titre non professionnel, est autorisé à ne pas rendre
          publiques ses coordonnées, sous réserve de les avoir communiquées à l&apos;hébergeur du site.
        </p>
        <p>
          Contact :{" "}
          <a href="mailto:contact@rankster.fr" className="text-ember hover:underline">
            contact@rankster.fr
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Hébergement</h2>
        <p>
          Hébergement du site : Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{" "}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ember hover:underline"
          >
            vercel.com
          </a>
        </p>
        <p>
          Nom de domaine réservé auprès de : OVH SAS — 2 rue Kellermann, 59100 Roubaix, France —{" "}
          <a
            href="https://www.ovh.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ember hover:underline"
          >
            ovh.com
          </a>
        </p>
        <p>
          Hébergement des données (comptes, tier lists, images) : Supabase Inc. Voir la{" "}
          <a href="/confidentialite" className="text-ember hover:underline">
            politique de confidentialité
          </a>{" "}
          pour plus de détails.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Propriété intellectuelle</h2>
        <p>
          La structure du site, sa charte graphique et son code sont la propriété de l&apos;éditeur. Le
          contenu ajouté par les utilisateurs (images, sélection de vidéos) reste la propriété de leurs
          auteurs ou ayants droit respectifs ; l&apos;éditeur ne revendique aucun droit dessus.
        </p>
      </section>

      <section className="flex flex-col gap-2 text-sm text-zinc-300">
        <h2 className="font-display text-xl tracking-wide text-white">Responsabilité</h2>
        <p>
          Rankster est un outil permettant à ses utilisateurs de classer des contenus dans des tier
          lists. L&apos;éditeur ne peut être tenu responsable du contenu ajouté par les utilisateurs.
          Tout signalement de contenu inapproprié peut être adressé à l&apos;email de contact ci-dessus.
        </p>
      </section>
    </div>
  );
}
