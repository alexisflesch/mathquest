# Services backend

## Vue d'ensemble des services

Le backend de MathQuest est organisé autour de plusieurs services métier qui gèrent les différentes fonctionnalités de l'application. L'architecture suit le principe de responsabilité unique avec une séparation claire entre les couches.

## Architecture des services

```
backend/src/core/services/
├── scoringService.ts          # Calcul des scores et pénalités
├── canonicalTimerService.ts   # Gestion centralisée des timers
├── gameStateService.ts        # État des parties (Redis)
├── gameParticipantService.ts  # Gestion des participants
├── timerKeyUtil.ts           # Utilitaires pour les clés Redis
└── ...
```

## Gestion des événements quiz

### Flux d'un événement quiz typique

1. **Réception de la réponse** (`GAME_ANSWER`)
2. **Validation de la payload**
3. **Résolution du contexte** (gameInstance, participant, question)
4. **Calcul du score** via `ScoringService`
5. **Mise à jour de la base de données**
6. **Diffusion des mises à jour** via Socket.IO

### Gestionnaire principal (`game/index.ts`)

```typescript
// Extrait du gestionnaire GAME_ANSWER
socket.on(GAME_EVENTS.GAME_ANSWER, async (payload) => {
  // 1. Validation du payload avec Zod
  const parseResult = AnswerSubmissionPayloadSchema.safeParse(payload);

  // 2. Résolution du contexte
  const gameInstance = await prisma.gameInstance.findUnique({
    where: { accessCode: payload.accessCode }
  });

  // 3. Récupération du participant
  const participant = await prisma.gameParticipant.findFirst({
    where: {
      gameInstanceId: gameInstance.id,
      userId: payload.userId
    }
  });

  // 4. Calcul du score
  const scoreResult = await ScoringService.submitAnswerWithScoring(
    gameInstance.id,
    payload.userId,
    answerData
  );

  // 5. Diffusion des résultats
  io.to(accessCode).emit(GAME_EVENTS.LEADERBOARD_UPDATE, leaderboard);
});
```

## Service de scoring (`ScoringService`)

### Interface principale

```typescript
interface ScoreResult {
  scoreUpdated: boolean;
  scoreAdded: number;
  totalScore: number;
  answerChanged: boolean;
  previousAnswer?: any;
  message: string;
  timePenalty?: number;
}

class ScoringService {
  static async submitAnswerWithScoring(
    gameInstanceId: string,
    userId: string,
    answerData: AnswerSubmissionPayload
  ): Promise<ScoreResult> {
    // Logique complète de scoring
  }

  static async calculateAnswerScore(
    question: any,
    answer: any,
    serverTimeSpent: number,
    totalPresentationTime: number,
    accessCode?: string
  ): Promise<{ score: number, timePenalty: number }> {
    // Calcul détaillé du score
  }
}
```

### Fonctionnement interne

1. **Validation de l'intégrité** : Vérification que la réponse n'a pas été modifiée
2. **Calcul de la correction** : Selon le type de question (QCM/numérique)
3. **Application des pénalités** : Temporelles et selon les redémarrages
4. **Mise à jour atomique** : Score en base + cache Redis

## Service des timers (`CanonicalTimerService`)

### Rôle central

Le `CanonicalTimerService` gère tous les aspects temporels :

- **Démarrage des timers** pour chaque question
- **Suivi du temps serveur** vs temps client
- **Gestion des redémarrages** de timer
- **Calcul des pénalités** basées sur le temps

### Structure des données Redis

```javascript
// Clé : mathquest:timer:{accessCode}:{questionUid}
// Valeur :
{
  "durationMs": 60000,           // Durée totale en ms
  "startTime": 1640000000000,    // Timestamp de démarrage
  "restartCount": 0,             // Nombre de redémarrages
  "lastRestartTime": null,       // Dernier redémarrage
  "totalPausedTime": 0           // Temps total en pause
}
```

### Méthodes principales

```typescript
class CanonicalTimerService {
  async startTimer(accessCode: string, questionUid: string, durationMs: number)
  async getRemainingTime(accessCode: string, questionUid: string): Promise<number>
  async restartTimer(accessCode: string, questionUid: string): Promise<void>
  async getServerTimeSpent(accessCode: string, questionUid: string): Promise<number>
}
```

## Service d'état des parties (`GameStateService`)

### Stockage en Redis

L'état des parties est stocké dans Redis pour des accès rapides :

```javascript
// Clé : mathquest:game:{accessCode}
// Valeur :
{
  "gameState": {
    "questionUids": ["q1", "q2", "q3"],
    "currentQuestionIndex": 1,
    "startTime": 1640000000000
  },
  "participants": {
    "user123": {
      "score": 150,
      "answers": { "q1": "A", "q2": "B" }
    }
  }
}
```

### Méthodes clés

```typescript
class GameStateService {
  static async getFullGameState(sessionKey: string)
  static async updateParticipantScore(accessCode: string, userId: string, score: number)
  static async addParticipant(accessCode: string, userId: string, username: string)
  static async removeParticipant(accessCode: string, userId: string)
}
```

## Gestion des participants

### Service dédié (`GameParticipantService`)

```typescript
class GameParticipantService {
  static async joinGame(userId: string, accessCode: string): Promise<JoinResult>
  static async leaveGame(userId: string, gameInstanceId: string): Promise<void>
  static async updateScore(userId: string, gameInstanceId: string, score: number): Promise<void>
  static async getLeaderboard(gameInstanceId: string): Promise<LeaderboardEntry[]>
}
```

### Flux d'intégration d'un participant

1. **Validation du code d'accès**
2. **Vérification des droits** (place disponible, partie pas commencée)
3. **Création de l'entrée** en base de données
4. **Ajout au cache Redis**
5. **Notification Socket.IO** aux autres participants

## Communication Socket.IO

### Événements principaux

#### Côté client → serveur

```typescript
// Rejoindre une partie
socket.emit('JOIN_GAME', {
  accessCode: 'ABC123',
  userId: 'user123',
  username: 'Alice'
});

// Soumettre une réponse
socket.emit('GAME_ANSWER', {
  accessCode: 'ABC123',
  userId: 'user123',
  questionUid: 'q1',
  answer: ['A'],
  timeSpent: 25000  // millisecondes
});
```

#### Côté serveur → client

```typescript
// Nouvelle question
io.to(accessCode).emit('QUESTION_START', {
  question: questionData,
  timeLimit: 60000
});

// Mise à jour du leaderboard
io.to(accessCode).emit('LEADERBOARD_UPDATE', {
  leaderboard: sortedParticipants,
  currentQuestionIndex: 2
});

// Fin de la partie
io.to(accessCode).emit('GAME_END', {
  finalLeaderboard: finalResults,
  winner: topParticipant
});
```

### Gestion des rooms

Chaque partie utilise une "room" Socket.IO isolée :

```typescript
// Rejoindre la room de la partie
socket.join(accessCode);

// Émettre uniquement aux participants de cette partie
io.to(accessCode).emit('event', data);

// Quitter la room
socket.leave(accessCode);
```

## Gestion des erreurs et logging

### Middleware de logging

Tous les services utilisent un logger centralisé :

```typescript
import createLogger from '@/utils/logger';

const logger = createLogger('ScoringService');

logger.info({
  userId,
  gameInstanceId,
  score: result.score,
  timePenalty: result.timePenalty
}, 'Score calculated successfully');
```

### Gestion des erreurs

```typescript
try {
  const result = await ScoringService.calculateAnswerScore(/*...*/);
  return { success: true, data: result };
} catch (error) {
  logger.error({ error, userId, questionUid }, 'Failed to calculate score');
  return { success: false, error: 'Score calculation failed' };
}
```

## Optimisations de performance

### Cache Redis
- **État des parties** : Accès O(1) aux données de session
- **Timers** : Suivi précis du temps serveur
- **Leaderboards** : Mise à jour atomique des scores

### Base de données
- **Index composites** sur les requêtes fréquentes
- **Pooling de connexions** pour éviter la surcharge
- **Transactions** pour les opérations critiques

### Socket.IO
- **Compression** des messages pour réduire la bande passante
- **Batching** des mises à jour pour éviter le spam
- **Heartbeat** pour détecter les déconnexions

## Tests et validation

### Tests unitaires

```typescript
describe('ScoringService', () => {
  test('should calculate correct score for perfect QCM answer', async () => {
    const result = await ScoringService.calculateAnswerScore(
      mockQuestion,
      ['A'], // Correct answer
      30000, // 30 seconds
      30000, // Same as server time
      'TEST123'
    );

    expect(result.score).toBeGreaterThan(80);
    expect(result.timePenalty).toBeLessThan(20);
  });
});
```

### Tests d'intégration

Les tests d'intégration valident les interactions entre services :

- **Flux complet** : De la réponse à la mise à jour du leaderboard
- **Concurrence** : Gestion des réponses simultanées
- **Déconnexions** : Récupération après perte de connexion

Cette architecture modulaire assure la maintenabilité, l'évolutivité et la fiabilité du système de gestion des quiz de MathQuest.

## Événements Socket.IO

MathQuest utilise Socket.IO pour la communication temps réel bidirectionnelle entre le frontend et le backend. Tous les événements sont définis dans `shared/types/socket/events.ts` pour assurer la cohérence.

### Événements Enseignant (TEACHER_EVENTS)

#### Connexion et état
- `JOIN_DASHBOARD` : Rejoindre le tableau de bord enseignant
- `GET_GAME_STATE` : Récupérer l'état actuel du jeu

#### Contrôle des questions
- `SET_QUESTION` : Définir la question active

#### Contrôle du timer
- `TIMER_ACTION` : Action générale sur le timer
- `START_TIMER` : Démarrer le timer
- `PAUSE_TIMER` : Mettre en pause le timer
- `TIMER_SET_DURATION` : Définir la durée du timer

#### Contrôle du jeu
- `LOCK_ANSWERS` : Verrouiller les réponses
- `END_GAME` : Terminer le jeu

#### Actions déclenchées par l'enseignant
- `SHOW_CORRECT_ANSWERS` : Afficher les bonnes réponses
- `TOGGLE_PROJECTION_STATS` : Basculer les statistiques sur la projection
- `REVEAL_LEADERBOARD` : Révéler le classement

#### Événements de diffusion (serveur → client)
- `GAME_CONTROL_STATE` : État du contrôle du jeu
- `DASHBOARD_JOINED` : Confirmation de connexion au dashboard
- `TIMER_UPDATE` : Mise à jour du timer
- `CONNECTED_COUNT` : Nombre de connexions

#### Événements spécifiques au dashboard
- `DASHBOARD_QUESTION_CHANGED` : Question changée
- `DASHBOARD_TIMER_UPDATED` : Timer mis à jour
- `DASHBOARD_ANSWERS_LOCK_CHANGED` : Verrouillage des réponses changé
- `DASHBOARD_GAME_STATUS_CHANGED` : Statut du jeu changé
- `DASHBOARD_ANSWER_STATS_UPDATE` : Statistiques des réponses mises à jour

### Événements Tournoi (TOURNAMENT_EVENTS)

#### Actions des joueurs
- `START_TOURNAMENT` : Démarrer un tournoi
- `JOIN_TOURNAMENT` : Rejoindre un tournoi
- `TOURNAMENT_ANSWER` : Soumettre une réponse au tournoi

#### Réponses du serveur
- `TOURNAMENT_STARTED` : Tournoi démarré
- `TOURNAMENT_JOINED` : Joueur rejoint le tournoi
- `TOURNAMENT_PLAYER_JOINED` : Nouveau joueur rejoint
- `TOURNAMENT_STATE_UPDATE` : Mise à jour de l'état du tournoi
- `TOURNAMENT_ANSWER_RESULT` : Résultat de la réponse
- `TOURNAMENT_QUESTION_UPDATE` : Question mise à jour
- `TOURNAMENT_QUESTION_STATE_UPDATE` : État de la question mis à jour
- `TOURNAMENT_LEADERBOARD_UPDATE` : Classement mis à jour
- `TOURNAMENT_ENDED` : Tournoi terminé
- `TOURNAMENT_TIMER_UPDATE` : Timer mis à jour

### Événements de Projection (PROJECTOR_EVENTS)

#### Actions de projection
- `JOIN_PROJECTION` : Rejoindre la projection
- `LEAVE_PROJECTION` : Quitter la projection

#### Réponses du serveur
- `PROJECTION_JOINED` : Projection rejointe
- `PROJECTION_LEFT` : Projection quittée
- `PROJECTION_ERROR` : Erreur de projection
- `PROJECTION_QUESTION_CHANGED` : Question changée sur la projection
- `PROJECTION_CONNECTED_COUNT` : Nombre de connexions à la projection
- `PROJECTION_STATE` : État de la projection
- `PROJECTION_LEADERBOARD_UPDATE` : Classement mis à jour sur la projection

#### Contrôles d'affichage
- `PROJECTION_SHOW_STATS` : Afficher les statistiques
- `PROJECTION_HIDE_STATS` : Masquer les statistiques
- `PROJECTION_CORRECT_ANSWERS` : Afficher les bonnes réponses
- `PROJECTION_STATS_STATE` : État canonique des statistiques

### Événements de Jeu/Quiz (GAME_EVENTS)

#### Actions des joueurs - Flux de connexion unifié
- `JOIN_GAME` : Rejoindre un jeu (remplace JOIN_LOBBY)
- `LEAVE_GAME` : Quitter un jeu (remplace LEAVE_LOBBY)
- `GAME_ANSWER` : Soumettre une réponse
- `REQUEST_PARTICIPANTS` : Demander la liste des participants
- `REQUEST_NEXT_QUESTION` : Demander la question suivante
- `START_GAME` : Démarrer le jeu

#### Réponses du serveur
- `GAME_JOINED` : Jeu rejoint
- `PLAYER_JOINED_GAME` : Nouveau joueur rejoint le jeu
- `PLAYER_LEFT_GAME` : Joueur a quitté le jeu
- `GAME_PARTICIPANTS` : Liste des participants
- `GAME_QUESTION` : Question du jeu
- `ANSWER_RECEIVED` : Réponse reçue
- `ANSWER_FEEDBACK` : Feedback de la réponse
- `GAME_ENDED` : Jeu terminé
- `GAME_ERROR` : Erreur de jeu
- `GAME_ANSWERS_LOCK_CHANGED` : Verrouillage des réponses changé
- `LEADERBOARD_UPDATE` : Mise à jour du classement

#### Événements du timer
- `GAME_TIMER_UPDATED` : Timer mis à jour (événement primaire)
- `TIMER_UPDATE` : Mise à jour du timer
- `GAME_UPDATE` : Mise à jour du jeu
- `TIMER_SET` : Timer défini

#### Événements d'état du jeu
- `GAME_STATE_UPDATE` : Mise à jour de l'état du jeu
- `CORRECT_ANSWERS` : Bonnes réponses
- `GAME_ALREADY_PLAYED` : Jeu déjà joué
- `GAME_REDIRECT_TO_LOBBY` : Redirection vers le lobby
- `GAME_CODE_UPDATED` : Code du jeu mis à jour
- `GAME_FINISHED_REDIRECT` : Redirection après fin du jeu

#### Événements supplémentaires
- `EXPLICATION` : Explication
- `FEEDBACK` : Feedback
- `LIVE_QUESTION` : Question en direct

### Gestion des rooms Socket.IO

Chaque partie utilise une "room" Socket.IO isolée pour la communication :

```typescript
// Rejoindre la room d'une partie
socket.join(accessCode);

// Émettre uniquement aux participants de cette partie
io.to(accessCode).emit('event', data);

// Quitter la room
socket.leave(accessCode);
```

### Événements de connexion

- `CONNECT` : Connexion établie
- `DISCONNECT` : Déconnexion
- `CONNECT_ERROR` : Erreur de connexion
- `CONNECTION_ESTABLISHED` : Connexion confirmée