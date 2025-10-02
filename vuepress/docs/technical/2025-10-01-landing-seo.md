# Landing page SEO/content update — 2025-10-01

Changements appliqués par l'agent automatique (modifications de contenu & styles) :

- pages/index.tsx
  - Déplacé le slogan de l'en-tête vers la section `value-prop` pour un meilleur placement SEO.
  - Modifié le titre de la section `Pourquoi Kutsum ?` en `kutsum` (demande explicite).
  - Ajout d'un court descriptif sous le titre `kutsum` expliquant rapidement l'offre (quiz, tournois, suivi).
  - Remplacé le lien/texte « Découvrir → » par « Documentation » et ajouté `target="_blank" rel="noopener noreferrer"`.

- styles/globals.css
  - Ajout de `.section-description` pour styler le nouveau paragraphe descriptif.
  - Ajout d'une règle @media (min-width: 769px) and (max-width: 1000px) pour forcer une grille 2x2 sur la section `.values` afin d'éviter le rendu 3+1 sur écrans moyens.

Notes :
- Lors d'un `npm run lint` exécuté initialement, ESLint a lancé une configuration interactive qui a ajouté `eslint` et `eslint-config-next` à `landing-page/package.json` et créé un fichier `.eslintrc.json`. J'ai annulé ces modifications dans `package.json` pour éviter d'introduire des dépendances non voulues. Le fichier `.eslintrc.json` reste présent et peut être supprimé si souhaité.

Tests rapides :
- Vérifier visuellement la landing page sur des largeurs de 800-1000px pour confirmer la grille 2x2.
- S'assurer que le bouton "Documentation" ouvre la doc dans un nouvel onglet.

Si vous voulez, j'ajoute une capture d'écran avant/après et un petit test playwright qui vérifie le texte et la structure DOM.
