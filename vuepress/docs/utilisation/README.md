---
title: Utilisation de l'application
---

# Utilisation de l'application


> Cette page présente les principales fonctionnalités de MathQuest.

## Fonctionnalités principales

MathQuest propose trois modes de jeu principaux :

- **Quiz (mode enseignant)** : Quiz en temps réel piloté par l’enseignant. L’enseignant contrôle l’enchaînement des questions, le timer, et la diffusion des réponses/corrections. Les élèves répondent en direct, sans feedback automatique (feedback oral ou à la fin).
- **Tournoi (mode compétition)** : Tournoi synchrone ou différé. Tous les participants reçoivent les questions en même temps (synchrone) ou peuvent rejouer la partie en différé (asynchrone). Le backend gère le timer, la progression, le classement et la diffusion des bonnes réponses et des feedbacks (si présents) à la fin de chaque question.
- **Entraînement (mode libre)** : Mode individuel, sans timer. L’utilisateur choisit d’enchaîner les questions à son rythme, reçoit un feedback immédiat après chaque réponse, et peut recommencer autant de fois qu’il le souhaite. Aucun score n’est enregistré.

## Prise en main rapide

1. **Connexion à l’application**
   - Choisissez votre profil (élève, enseignant, invité) à la connexion. En mode invité, pas besoin de créer un compte: choisissez simplement un pseudo et un avatar et vous êtes prêt à jouer. Vos résultats ne seront pas sauvegardés mais vous pourrez mettre à jour votre profil plus tard si vous le souhaitez.
   - Si vous êtes enseignant, vous pouvez créer un compte vous permettant de gérer vos activités: regroupez des questions et créez des quiz pour une utilisation en classe, ou des tournois voire des sessions d’entraînement pour vos élèves.


2. **Déroulement selon le mode**
   - **Quiz** : L’enseignant crée ou sélectionne un quiz, invite les élèves à rejoindre, puis contrôle le déroulement.
   - **Tournoi** : Un utilisateur (élève ou enseignant) lance un tournoi (synchrone ou différé), les participants rejoignent via un code, le backend gère la progression.
   - **Entraînement** : L’utilisateur démarre une session d’entraînement libre, répond à des questions à son rythme, et obtient un feedback immédiat.

## Guides détaillés

### Quiz (enseignant)
- L’enseignant crée ou sélectionne un quiz dans la section dédiée.
- Il affiche alors sur vidéoprojecteur une page dédiée avec qrcode et lien pour rejoindre le quiz. La page est rafraîchie automatiquement pour afficher les questions, le chrono, des stats (optionnel) et un podium.
- Les élèves rejoignent via un code ou un lien.
- L’enseignant contrôle l’enchaînement des questions, le timer, et la diffusion des réponses.
- Le feedback est donné oralement ou à la fin du quiz.

### Tournoi
- Un organisateur (enseignant ou élève) crée un tournoi.
- Les participants rejoignent via un code.
- L'organisateur démarre son tournoi quand il le souhaite
- Le backend gère alors le timer, la progression, le classement et la diffusion des corrections à la fin de chaque question.
- Les résultats sont affichés à la fin du tournoi.

### Entraînement (libre)
- L’utilisateur démarre une session d’entraînement depuis le menu principal.
- Il répond à des questions à son rythme, sans limite de temps.
- Le feedback (bonne/mauvaise réponse, explication) est affiché immédiatement après chaque réponse.
- Il peut recommencer autant de fois qu’il le souhaite.

## Architecture de l'application (aperçu)

- **Frontend** : Application React/Next.js (interface utilisateur, navigation, gestion d'état, communication temps réel via Socket.IO).
- **Backend** : API Node.js/Express (gestion des utilisateurs, parties, questions, statistiques, WebSocket).
- **Base de données** : PostgreSQL, schéma géré par Prisma.