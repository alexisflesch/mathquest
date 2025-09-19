# API REST

## Vue d'ensemble

MathQuest expose une API REST complète pour toutes les opérations. L'API utilise JSON pour les requêtes et réponses, avec validation Zod pour la sécurité des données.

**Base URL :** `/api/v1`

**Authentification :** JWT via cookies (`teacherToken`, `authToken`)

## Authentification

### POST /api/v1/auth

Point d'entrée générique pour l'authentification avec différents `action`.

#### Actions disponibles

**Connexion enseignant :**
```json
{
  "action": "teacher_login",
  "email": "teacher@school.com",
  "password": "password123"
}
```

**Inscription enseignant :**
```json
{
  "action": "teacher_register",
  "username": "prof_math",
  "email": "teacher@school.com",
  "password": "password123",
  "name": "Dupont",
  "prenom": "Jean"
}
```

**Connexion élève :**
```json
{
  "action": "login",
  "email": "student@school.com",
  "password": "password123"
}
```

**Réponse de succès :**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "prof_math",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "avatarEmoji": "🎓"
  },
  "token": "jwt_token_here"
}
```

### POST /api/v1/auth/logout

Déconnexion de l'utilisateur.

**Réponse :**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/v1/auth/upgrade-account

Mise à niveau d'un compte invité vers un compte permanent.

```json
{
  "cookieId": "guest_session_id",
  "email": "student@school.com",
  "password": "new_password",
  "targetRole": "STUDENT",
  "adminPassword": "admin_secret"
}
```

### POST /api/v1/auth/password-reset

Demande de réinitialisation de mot de passe.

```json
{
  "email": "user@domain.com"
}
```

### POST /api/v1/auth/password-reset-confirm

Confirmation de réinitialisation avec nouveau mot de passe.

```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_secure_password"
}
```

### POST /api/v1/auth/send-email-verification

Envoi d'un email de vérification.

```json
{
  "email": "user@domain.com"
}
```

### POST /api/v1/auth/verify-email

Vérification de l'email avec token.

```json
{
  "token": "verification_token_from_email"
}
```

### POST /api/v1/auth/resend-email-verification

Renvoi de l'email de vérification.

```json
{
  "email": "user@domain.com"
}
```

### GET /api/v1/auth/status

Vérification du statut d'authentification.

**Réponse :**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "username": "prof_math",
    "role": "TEACHER"
  }
}
```

## Gestion des parties

### POST /api/v1/games

Création d'une nouvelle instance de jeu.

**Authentification :** Optionnelle (enseignant ou élève)

```json
{
  "name": "Quiz Mathématiques CM2",
  "gameTemplateId": "uuid-du-template",
  "playMode": "quiz",
  "settings": {
    "allowLateJoin": true,
    "showCorrectAnswers": false
  },
  "differedAvailableFrom": "2025-09-20T08:00:00Z",
  "differedAvailableTo": "2025-09-20T18:00:00Z"
}
```

**Modes de jeu :**
- `quiz` : Quiz en temps réel
- `tournament` : Tournoi avec système de score avancé
- `practice` : Mode entraînement
- `class` : Mode classe

**Réponse :**
```json
{
  "success": true,
  "gameInstance": {
    "id": "uuid",
    "name": "Quiz Mathématiques CM2",
    "accessCode": "ABC123",
    "status": "waiting",
    "playMode": "quiz",
    "createdAt": "2025-09-19T10:00:00Z"
  }
}
```

### POST /api/v1/games/join

Rejoindre une partie existante.

```json
{
  "accessCode": "ABC123",
  "userId": "uuid-utilisateur",
  "username": "Alice",
  "avatar": "🎨"
}
```

**Réponse :**
```json
{
  "success": true,
  "participant": {
    "id": "uuid",
    "userId": "uuid-utilisateur",
    "username": "Alice",
    "avatar": "🎨",
    "liveScore": 0,
    "joinedAt": "2025-09-19T10:05:00Z"
  },
  "gameInstance": {
    "id": "uuid",
    "name": "Quiz Mathématiques CM2",
    "status": "active"
  }
}
```

### GET /api/v1/games/:gameId

Récupération des détails d'une partie.

**Authentification :** Requise (participant ou enseignant)

**Réponse :**
```json
{
  "id": "uuid",
  "name": "Quiz Mathématiques CM2",
  "accessCode": "ABC123",
  "status": "active",
  "playMode": "quiz",
  "currentQuestionIndex": 2,
  "settings": {},
  "participants": [
    {
      "id": "uuid",
      "username": "Alice",
      "avatar": "🎨",
      "liveScore": 850,
      "status": "ACTIVE"
    }
  ],
  "leaderboard": [
    { "username": "Alice", "score": 850 },
    { "username": "Bob", "score": 720 }
  ]
}
```

### GET /api/v1/games/:gameId/state

Récupération de l'état complet de la partie (avec questions).

**Authentification :** Requise (enseignant uniquement)

### PUT /api/v1/games/:gameId/status

Mise à jour du statut d'une partie.

**Authentification :** Requise (enseignant)

```json
{
  "status": "active"
}
```

**Statuts possibles :**
- `waiting` : En attente de participants
- `active` : Partie en cours
- `completed` : Partie terminée
- `cancelled` : Partie annulée

### PUT /api/v1/games/:gameId/rename

Renommage d'une partie.

```json
{
  "name": "Nouveau nom du quiz"
}
```

### GET /api/v1/games/active

Liste des parties actives de l'enseignant.

**Authentification :** Requise (enseignant)

**Réponse :**
```json
{
  "games": [
    {
      "id": "uuid",
      "name": "Quiz Mathématiques",
      "accessCode": "ABC123",
      "participantCount": 15,
      "status": "active",
      "createdAt": "2025-09-19T10:00:00Z"
    }
  ]
}
```

## Contrôle des parties (Enseignant)

### POST /api/v1/game-control/start

Démarrage d'une partie.

**Authentification :** Requise (enseignant)

```json
{
  "gameId": "uuid-de-la-partie"
}
```

### POST /api/v1/game-control/next-question

Passage à la question suivante.

```json
{
  "gameId": "uuid-de-la-partie"
}
```

### POST /api/v1/game-control/end

Fin de la partie.

```json
{
  "gameId": "uuid-de-la-partie"
}
```

### POST /api/v1/game-control/pause

Mise en pause de la partie.

```json
{
  "gameId": "uuid-de-la-partie"
}
```

### POST /api/v1/game-control/resume

Reprise de la partie.

```json
{
  "gameId": "uuid-de-la-partie"
}
```

## Modèles de jeu

### GET /api/v1/game-templates

Liste des modèles de jeu disponibles.

**Authentification :** Requise (enseignant)

**Paramètres de requête :**
- `gradeLevel` : Niveau scolaire (CP, CE1, etc.)
- `discipline` : Discipline (mathématiques, français, etc.)
- `themes` : Thèmes spécifiques

**Réponse :**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Mathématiques - Géométrie",
      "gradeLevel": "CM2",
      "discipline": "mathématiques",
      "themes": ["géométrie", "aires"],
      "description": "Quiz sur les figures géométriques",
      "questionCount": 15,
      "createdAt": "2025-09-01T09:00:00Z"
    }
  ]
}
```

### POST /api/v1/game-templates

Création d'un nouveau modèle de jeu.

**Authentification :** Requise (enseignant)

```json
{
  "name": "Mon Quiz Personnalisé",
  "gradeLevel": "CM1",
  "discipline": "mathématiques",
  "themes": ["addition", "soustraction"],
  "description": "Quiz personnalisé pour CM1",
  "questionIds": ["uuid-q1", "uuid-q2", "uuid-q3"]
}
```

### GET /api/v1/game-templates/:templateId

Détails d'un modèle spécifique.

### PUT /api/v1/game-templates/:templateId

Modification d'un modèle.

### DELETE /api/v1/game-templates/:templateId

Suppression d'un modèle.

## Questions

### GET /api/v1/questions

Recherche et filtrage de questions.

**Authentification :** Non requise (questions publiques)

**Paramètres de requête :**
- `gradeLevel` : Niveau scolaire
- `discipline` : Discipline
- `themes` : Liste de thèmes
- `difficulty` : Difficulté (1-5)
- `limit` : Nombre maximum de résultats
- `offset` : Décalage pour pagination

**Réponse :**
```json
{
  "questions": [
    {
      "uid": "uuid",
      "title": "Calcul mental",
      "text": "Combien font 15 + 27 ?",
      "questionType": "numeric",
      "discipline": "mathématiques",
      "gradeLevel": "CE2",
      "difficulty": 2,
      "timeLimit": 30,
      "numericQuestion": {
        "correctAnswer": 42,
        "tolerance": 0,
        "unit": null
      }
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### GET /api/v1/questions/:questionId

Détails d'une question spécifique.

### POST /api/v1/questions

Création d'une nouvelle question.

**Authentification :** Requise (enseignant)

**Question à choix multiples :**
```json
{
  "title": "Capitale de la France",
  "text": "Quelle est la capitale de la France ?",
  "questionType": "multiple-choice",
  "discipline": "géographie",
  "gradeLevel": "CM1",
  "difficulty": 1,
  "timeLimit": 20,
  "multipleChoiceQuestion": {
    "answerOptions": ["Paris", "Lyon", "Marseille", "Toulouse"],
    "correctAnswers": [true, false, false, false]
  }
}
```

**Question numérique :**
```json
{
  "title": "Calcul",
  "text": "Combien font 12 × 8 ?",
  "questionType": "numeric",
  "discipline": "mathématiques",
  "gradeLevel": "CE2",
  "difficulty": 2,
  "timeLimit": 30,
  "numericQuestion": {
    "correctAnswer": 96,
    "tolerance": 0,
    "unit": null
  }
}
```

## Utilisateurs

### GET /api/v1/users/profile

Récupération du profil utilisateur.

**Authentification :** Requise

### PUT /api/v1/users/profile

Mise à jour du profil utilisateur.

```json
{
  "username": "nouveau_nom",
  "avatar": "🎭"
}
```

### GET /api/v1/users/my-tournaments

Liste des tournois de l'utilisateur.

**Authentification :** Requise

## Validation d'accès aux pages

### POST /api/v1/validatePageAccess

Validation de l'accès à une page spécifique.

**Authentification :** Requise (enseignant)

```json
{
  "pageType": "dashboard",
  "accessCode": "ABC123"
}
```

**Types de page :**
- `dashboard` : Tableau de bord de projection
- `projection` : Interface de projection
- `practice` : Mode entraînement
- `tournament` : Interface tournoi

**Réponse :**
```json
{
  "valid": true,
  "gameInstance": {
    "id": "uuid",
    "name": "Quiz Mathématiques",
    "status": "active"
  }
}
```

## Gestion des enseignants

### GET /api/v1/teachers/dashboard

Données du tableau de bord enseignant.

**Authentification :** Requise (enseignant)

### GET /api/v1/teachers/students

Liste des élèves de l'enseignant.

## Gestion des élèves

### GET /api/v1/student/dashboard

Données du tableau de bord élève.

**Authentification :** Requise (élève)

### GET /api/v1/student/games

Liste des parties de l'élève.

## Sessions d'entraînement

### GET /api/v1/practice/sessions

Liste des sessions d'entraînement.

### POST /api/v1/practice/sessions

Création d'une session d'entraînement.

```json
{
  "name": "Entraînement Mathématiques",
  "gradeLevel": "CM1",
  "discipline": "mathématiques",
  "themes": ["addition", "soustraction"],
  "questionCount": 10
}
```

## Codes d'erreur

### Erreurs communes

**400 Bad Request :**
```json
{
  "error": "Invalid request data",
  "details": "Validation failed for field 'email'"
}
```

**401 Unauthorized :**
```json
{
  "error": "Authentication required"
}
```

**403 Forbidden :**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found :**
```json
{
  "error": "Resource not found"
}
```

**409 Conflict :**
```json
{
  "error": "Resource already exists"
}
```

**429 Too Many Requests :**
```json
{
  "error": "Rate limit exceeded"
}
```

**500 Internal Server Error :**
```json
{
  "error": "Internal server error"
}
```

## Limites et quotas

- **Requêtes par minute :** 1000 par IP
- **Taille maximale du payload :** 10MB
- **Timeout des requêtes :** 30 secondes
- **Taille maximale des fichiers :** 5MB (pour les images/avatar)

## Webhooks et callbacks

MathQuest ne propose pas actuellement de webhooks externes, mais toutes les opérations importantes sont tracées dans les logs pour audit.

## Versionnage de l'API

L'API est versionnée avec `/v1/`. Les changements non rétrocompatibles feront l'objet d'une nouvelle version majeure.

## SDK et bibliothèques

Actuellement, aucun SDK officiel n'est fourni. L'API peut être utilisée directement avec n'importe quelle bibliothèque HTTP (axios, fetch, etc.).