# Rankster

Rankster est un créateur de tier list en ligne : classe des images et des vidéos YouTube dans des tiers personnalisés, glisse-dépose à ta façon, exporte le résultat, et partage tes classements avec d'autres.

## Fonctionnalités

- **Éditeur de tier list** — glisser-déposer entre tiers via [dnd-kit](https://dndkit.com/), tiers personnalisables (nom, couleur, ordre), couleur de fond, export en PNG.
- **Items** — ajoute des images (uploadées) ou des vidéos YouTube, une par une ou par playlist entière (import en un clic via l'API YouTube Data v3).
- **Comptes** — inscription / connexion par email, gérées par Supabase Auth.
- **Visibilité** — chaque tier list est privée, non répertoriée (accessible par lien) ou publique.
- **Navigation invité** — pas besoin de compte pour parcourir et classer les tier lists publiques ; un compte n'est requis que pour créer ou sauvegarder.
- **Classement partagé** — ouvrir la tier list de quelqu'un d'autre permet de la classer soi-même à partir d'un pool vierge (jamais le classement du créateur), puis de sauvegarder sa propre version en copie privée.
- **Rôle admin** — le propriétaire du site peut supprimer n'importe quelle tier list.

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [dnd-kit](https://dndkit.com/) pour le glisser-déposer
- [Supabase](https://supabase.com/) — base de données Postgres, authentification et stockage des images
- [YouTube Data API v3](https://developers.google.com/youtube/v3) pour l'import de playlists
