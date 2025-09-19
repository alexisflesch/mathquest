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