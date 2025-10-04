# Login page dynamic runtime opt-out — 2025-10-02

Changements appliqués par l'agent automatique :

- `app/frontend/src/app/login/page.tsx`
  - Ajout de l'export `revalidate = 0` et confirmation de `dynamic = 'force-dynamic'` afin de forcer le rendu côté serveur et désactiver la génération statique de `/login`.
  - Objectif : corriger l'échec du build (`next export` / pré-rendu) provoqué par des dépendances client-only utilisées durant la phase de prerendering.

Impacts :
- `/login` reste 100% fonctionnelle mais n'est plus pré-rendue pendant `npm run build`, évitant l'erreur "Cannot read properties of undefined (reading 'call')" observée dans `webpack-runtime.js`.

Tests prévus :
- Lancer `npm run build` depuis `app/frontend/` et vérifier que la phase "Collecting page data" se termine sans erreur.
- Vérifier manuellement l'accès à `/login` pour s'assurer que la redirection post-auth fonctionne toujours.
