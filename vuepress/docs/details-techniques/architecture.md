# Architecture générale

## Vue d'ensemble de l'architecture

MathQuest suit une architecture moderne full-stack avec séparation claire des responsabilités :

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - React/TSX     │    │ - Express       │    │ - Prisma ORM    │
│ - Socket.IO     │    │ - Socket.IO     │    │ - GameTemplate  │
│ - Responsive    │    │ - REST API      │    │ - GameInstance  │
│ - PWA ready     │    │ - Services      │    │ - User          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌─────────────────┐
                    │     Redis       │
                    │   (Cache)       │
                    │                 │
                    │ - Sessions      │
                    │ - Timers        │
                    │ - Game state    │
                    └─────────────────┘
```

## Architecture détaillée

### Frontend (Next.js)

Le frontend est organisé selon une structure modulaire :

```
frontend/src/
├── app/              # Pages Next.js 13+ (App Router)
├── components/       # Composants React réutilisables
├── hooks/           # Hooks personnalisés (Socket, Auth, etc.)
├── contexts/        # Contextes React (Auth, Game, etc.)
├── types/           # Types TypeScript
├── utils/           # Utilitaires
└── config/          # Configuration
```

**Technologies clés :**
- **Next.js 13+** avec App Router
- **React 18** avec hooks et Server Components
- **TypeScript** pour le typage strict
- **Tailwind CSS** pour le styling
- **Socket.IO Client** pour la communication temps réel
- **React Query** pour la gestion des données

### Catalogue des composants React

Le frontend utilise une bibliothèque de composants organisée par fonctionnalité :

#### Navigation & Layout
- **AppNav.tsx** : Barre de navigation principale, responsive, supporte tous les états d'authentification
- **AuthProvider.tsx** : Fournit le contexte d'authentification pour utilisateurs anonymes, invités, élèves et professeurs
- **TeacherDashboardLayout.tsx** : Layout du dashboard professeur
- **LobbyLayout.tsx** : Layout de la salle d'attente des tournois

#### Interfaces de jeu & quiz
- **Scoreboard.tsx** : Affiche le classement des joueurs en temps réel
- **ClassementPodium.tsx** : Podium pour les 3 meilleurs joueurs
- **QuestionDisplay.tsx** : Affiche une question de quiz/tournoi (format canonique)
- **QuestionCard.tsx** : Carte interactive pour les questions de quiz/tournoi
- **TournamentQuestionCard.tsx** : Carte spécialisée pour les questions de tournoi
- **DraggableQuestionsList.tsx** : Dashboard professeur, gestion drag-and-drop des questions
- **SortableQuestion.tsx** : Question individuelle draggable pour réordonnancement
- **QuestionSelector.tsx** : Sélection/filtrage des questions pour quiz/tournois
- **QuizList.tsx** : Liste des quiz disponibles
- **TournamentTimer.tsx** : Chronomètre pour les questions de tournoi
- **AnswerFeedbackOverlay.tsx** : Affiche le feedback après réponse
- **GoodAnswer.tsx / WrongAnswer.tsx** : Icônes animées de feedback correct/incorrect
- **TeacherDashboardClient.tsx** : Interface client du dashboard professeur
- **TeacherProjectionClient.tsx** : Interface de projection pour les enseignants

#### Composants UI & utilitaires
- **Snackbar.tsx** : Notifications toast pour le feedback utilisateur
- **ConfirmationModal.tsx / ConfirmDialog.tsx** : Dialogues modaux de confirmation et avertissement
- **CustomDropdown.tsx / MultiSelectDropdown.tsx / EnhancedMultiSelectDropdown.tsx** : Dropdowns personnalisés (multi-)sélection
- **AvatarSelector.tsx / ui/AvatarGrid.tsx** : Grilles de sélection d'avatar pour profils
- **MathJaxWrapper.tsx** : Rendu LaTeX/MathJax dans les questions et explications
- **ZoomControls.tsx** : Contrôles UI pour zoomer le contenu
- **Trophy.tsx** : Icône animée de trophée pour récompenses
- **InfinitySpin.tsx** : Spinner de chargement animé
- **CodeManager.tsx** : Gestion de génération et mise à jour des codes tournoi/quiz
- **LoadingScreen.tsx** : Écran de chargement
- **ErrorBoundary.tsx** : Gestionnaire d'erreurs React
- **StatisticsChart.tsx / StatisticsChartImpl.tsx** : Graphiques de statistiques
- **QrCodeWithLogo.tsx** : Génération de QR codes avec logo

#### Profil & authentification
- **profile/ProfileForm.tsx** : Formulaire d'édition de profil utilisateur
- **profile/AccountUpgradeForm.tsx / TeacherUpgradeForm.tsx** : Flux de mise à niveau de compte
- **auth/GuestForm.tsx / GuestUpgradeForm.tsx / StudentAuthForm.tsx** : Formulaires d'authentification et inscription
- **auth/AuthModeToggle.tsx** : Bascule entre modes d'authentification
- **AuthErrorBanner.tsx** : Bannière d'erreur d'authentification

#### Tests
- **__tests__/** : Tests unitaires des composants (ex: AppNav, BasicButton)

*Pour les props détaillées et l'utilisation, voir le code source dans `frontend/src/components/` et sous-dossiers.*

### Backend (Node.js)

Le backend suit une architecture en couches avec séparation des responsabilités :

```
backend/src/
├── api/             # Routes REST API
├── sockets/         # Gestionnaires Socket.IO
├── core/            # Services métier
│   ├── services/    # Services (Scoring, Timer, etc.)
│   └── models/      # Modèles de données
├── db/              # Accès base de données (Prisma)
├── middleware/      # Middlewares Express
└── utils/           # Utilitaires
```

**Technologies clés :**
- **Node.js** avec TypeScript
- **Express.js** pour l'API REST
- **Socket.IO** pour la communication temps réel
- **Prisma** comme ORM
- **Redis** pour le cache et les sessions
- **JWT** pour l'authentification

### Base de données (PostgreSQL)

La base de données utilise PostgreSQL avec Prisma comme ORM :

- **GameTemplate** : Modèles de quiz/tournois
- **GameInstance** : Instances de parties en cours
- **User** : Utilisateurs (élèves/professeurs)
- **Question** : Questions (QCM, numériques)
- **GameParticipant** : Participants aux parties

### Communication temps réel

MathQuest utilise Socket.IO pour la communication bidirectionnelle :

- **Événements client→serveur** : Réponses aux questions, rejoindre une partie
- **Événements serveur→client** : Mise à jour du leaderboard, nouvelle question
- **Rooms Socket.IO** : Isolation des parties par code d'accès

### Cache et sessions (Redis)

Redis est utilisé pour :
- **Sessions utilisateur** : Gestion des sessions authentifiées
- **État des parties** : Stockage temporaire de l'état des quiz
- **Timers** : Gestion des chronomètres côté serveur
- **Cache des questions** : Amélioration des performances

### Génération PDF des questions (`scripts/yaml2latex.py`)

Le script `scripts/yaml2latex.py` permet de transformer les fichiers YAML des dossiers `questions/` en PDF de relecture. Depuis la refonte 2025-09-27 :

- Chaque exercice affiche un lien cliquable sur son `uid` qui pointe directement vers le fichier YAML d'origine.
- Les liens utilisent des URI `file://` compatibles Windows. Sous WSL, le chemin est automatiquement converti en `file://wsl.localhost/<distro>/…`, ce qui évite tout recours à des scripts `.bat` intermédiaires.
- Le numéro de ligne du bloc YAML est indiqué après le titre afin de faciliter la navigation une fois le fichier ouvert.
- Lors de l'exécution, le script nettoie les anciens dossiers `open-in-vscode/` générés par les versions précédentes pour éviter les résidus.
- Les PDF ouverts avec un lecteur autorisant les liens de fichiers (SumatraPDF, Edge, etc.) ouvrent ainsi le YAML dans l'éditeur par défaut configuré côté Windows.

⚠️ Selon la politique de sécurité de votre lecteur PDF, vous devrez peut-être autoriser explicitement l'ouverture des liens `file://`.

## Flux de données typique

### Création d'un quiz

1. **Frontend** : Utilisateur crée un GameTemplate
2. **Backend** : Validation et sauvegarde en base
3. **Database** : Stockage du template avec questions associées

### Démarrage d'un quiz

1. **Frontend** : Professeur lance le quiz
2. **Backend** : Création d'une GameInstance
3. **Socket.IO** : Notification à tous les participants
4. **Redis** : Initialisation des timers et état de partie

### Réponse à une question

1. **Frontend** : Élève soumet sa réponse
2. **Socket.IO** : Transmission au backend
3. **Backend** : Validation et calcul du score
4. **Database** : Mise à jour du score du participant
5. **Socket.IO** : Diffusion du leaderboard mis à jour

## Sécurité

- **Authentification JWT** avec refresh tokens
- **Validation des entrées** avec Zod schemas
- **Rate limiting** sur les API
- **CORS** configuré pour les origines autorisées
- **HTTPS** obligatoire en production

## Performance

- **Cache Redis** pour les données fréquemment accédées
- **Lazy loading** des composants React
- **Optimisation des images** avec Next.js
- **Compression** des réponses HTTP
- **Pooling de connexions** base de données