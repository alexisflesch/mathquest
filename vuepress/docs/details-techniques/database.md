# Base de données

## Schéma général

MathQuest utilise PostgreSQL comme base de données principale avec Prisma comme ORM. Le schéma est organisé autour de plusieurs entités principales interconnectées.

## Modèles principaux

### User (Utilisateur)

```sql
model User {
  id                              String            @id @default(uuid())
  username                        String
  email                           String?           @unique
  passwordHash                    String?
  createdAt                       DateTime          @default(now())
  role                            UserRole
  resetToken                      String?           @map("reset_token")
  resetTokenExpiresAt             DateTime?         @map("reset_token_expires_at")
  avatarEmoji                     String?
  emailVerificationToken          String?           @map("email_verification_token")
  emailVerificationTokenExpiresAt DateTime?         @map("email_verification_token_expires_at")
  emailVerified                   Boolean?          @default(false) @map("email_verified")
  studentProfile                  StudentProfile?
  teacherProfile                  TeacherProfile?
  initiatedGameInstances          GameInstance[]    @relation("InitiatedGameInstancesByUser")
  gameParticipations              GameParticipant[]
  createdGameTemplates            GameTemplate[]    @relation("UserCreatedGameTemplates")
}
```

**Rôles disponibles :**
- `STUDENT` : Élève
- `TEACHER` : Professeur
- `GUEST` : Invité (sans compte)

### Question (Question)

```sql
model Question {
  uid                    String                    @id @default(uuid())
  title                  String?
  text                   String                    @map("question_text")
  questionType           String                    @map("question_type")
  discipline             String
  themes                 String[]
  difficulty             Int?
  gradeLevel             String?                   @map("grade_level")
  author                 String?
  explanation            String?
  tags                   String[]
  timeLimit              Int                       @map("time_limit_seconds")
  excludedFrom           String[]                  @default([]) @map("excluded_from")
  createdAt              DateTime                  @default(now()) @map("created_at")
  updatedAt              DateTime                  @updatedAt @map("updated_at")
  feedbackWaitTime       Int?
  isHidden               Boolean?                  @default(false) @map("is_hidden")
  multipleChoiceQuestion MultipleChoiceQuestion?
  numericQuestion        NumericQuestion?
  gameTemplates          QuestionsInGameTemplate[]
}
```

**Types de questions :**
- **QCM (Multiple Choice)** : Questions à choix multiples avec réponses partielles possibles
- **Numérique** : Questions nécessitant une réponse numérique avec tolérance

### MultipleChoiceQuestion

```sql
model MultipleChoiceQuestion {
  questionUid    String    @id @map("question_uid")
  answerOptions  String[]  @map("answer_options")
  correctAnswers Boolean[] @map("correct_answers")
  question       Question  @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
}
```

**Exemple :**
```json
{
  "questionUid": "q-123",
  "answerOptions": ["Paris", "Lyon", "Marseille", "Toulouse"],
  "correctAnswers": [true, false, true, false]
}
```

### NumericQuestion

```sql
model NumericQuestion {
  questionUid   String   @id @map("question_uid")
  correctAnswer Float    @map("correct_answer")
  tolerance     Float?   @default(0) @map("tolerance")
  unit          String?  @map("unit")
  question      Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
}
```

**Exemple :**
```json
{
  "questionUid": "q-456",
  "correctAnswer": 3.14159,
  "tolerance": 0.01,
  "unit": "m²"
}
```

### GameTemplate (Modèle de jeu)

```sql
model GameTemplate {
  id            String                    @id @default(uuid())
  name          String
  gradeLevel    String?                   @map("grade_level")
  themes        String[]
  discipline    String?
  description   String?
  defaultMode   PlayMode?                 @map("default_mode")
  createdAt     DateTime                  @default(now()) @map("created_at")
  updatedAt     DateTime                  @updatedAt @map("updated_at")
  creatorId     String                    @map("creator_id")
  gameInstances GameInstance[]
  creator       User                      @relation("UserCreatedGameTemplates", fields: [creatorId], references: [id])
  questions     QuestionsInGameTemplate[]
}
```

**Modes de jeu :**
- `quiz` : Quiz classique en temps réel
- `tournament` : Tournoi avec système de score avancé
- `practice` : Mode entraînement sans timer
- `class` : Mode classe pour utilisation en salle

### QuestionsInGameTemplate (Questions dans un modèle)

```sql
model QuestionsInGameTemplate {
  gameTemplateId String       @map("game_template_id")
  questionUid    String       @map("question_uid")
  sequence       Int
  createdAt      DateTime     @default(now()) @map("created_at")
  gameTemplate   GameTemplate @relation(fields: [gameTemplateId], references: [id], onDelete: Cascade)
  question       Question     @relation(fields: [questionUid], references: [uid], onDelete: Cascade)

  @@id([gameTemplateId, sequence])
  @@unique([gameTemplateId, questionUid])
}
```

### GameInstance (Instance de jeu)

```sql
model GameInstance {
  id                    String            @id @default(uuid())
  name                  String
  accessCode            String            @unique @map("access_code")
  status                String
  playMode              PlayMode          @map("play_mode")
  leaderboard           Json?
  currentQuestionIndex  Int?              @map("current_question_index")
  settings              Json?
  createdAt             DateTime          @default(now()) @map("created_at")
  startedAt             DateTime?         @map("started_at")
  endedAt               DateTime?         @map("ended_at")
  differedAvailableFrom DateTime?         @map("differed_available_from")
  differedAvailableTo   DateTime?         @map("differed_available_to")
  gameTemplateId        String            @map("game_template_id")
  initiatorUserId       String?           @map("initiator_user_id")
  gameTemplate          GameTemplate      @relation(fields: [gameTemplateId], references: [id])
  initiatorUser         User?             @relation("InitiatedGameInstancesByUser", fields: [initiatorUserId], references: [id])
  participants          GameParticipant[]
}
```

**États possibles :**
- `waiting` : En attente de participants
- `active` : Partie en cours
- `completed` : Partie terminée
- `cancelled` : Partie annulée

### GameParticipant (Participant)

```sql
model GameParticipant {
  id             String            @id @default(uuid())
  gameInstanceId String            @map("game_instance_id")
  userId         String            @map("user_id")
  liveScore      Float             @default(0) @map("live_score")
  deferredScore  Float             @default(0) @map("deferred_score")
  nbAttempts     Int               @default(0) @map("nb_attempts")
  status         ParticipantStatus @default(PENDING) @map("status")
  joinedAt       DateTime          @default(now()) @map("joined_at")
  lastActiveAt   DateTime?         @map("last_active_at")
  completedAt    DateTime?         @map("completed_at")
  gameInstance   GameInstance      @relation(fields: [gameInstanceId], references: [id], onDelete: Cascade)
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Statuts de participant :**
- `PENDING` : En attente
- `ACTIVE` : Actif dans la partie
- `COMPLETED` : A terminé la partie
- `LEFT` : A quitté la partie

### Taxonomy (Taxonomie)

```sql
model Taxonomy {
  id          String   @id @default(uuid())
  gradeLevel  String   @unique @map("grade_level")
  content     Json     @map("content")
  contentHash String?  @map("content_hash")
  updatedAt   DateTime @updatedAt @map("updated_at")
}
```

**Description :** Stocke les métadonnées canoniques des niveaux scolaires (disciplines/thèmes/tags). Rempli par un script d'import manuel et en lecture seule pour l'application.

## Relations entre les entités

```
User
├── 1:1 → StudentProfile/TeacherProfile
├── 1:N → GameTemplate (created)
├── 1:N → GameInstance (initiated)
└── 1:N → GameParticipant

GameTemplate
├── 1:N → GameInstance
├── 1:N → QuestionsInGameTemplate
└── N:1 → User (creator)

GameInstance
├── N:1 → GameTemplate
├── N:1 → User (initiator)
└── 1:N → GameParticipant

Question
├── 1:1 → MultipleChoiceQuestion
├── 1:1 → NumericQuestion
└── 1:N → QuestionsInGameTemplate

QuestionsInGameTemplate
├── N:1 → GameTemplate
└── N:1 → Question
```

## Index et contraintes

- **Index unique** sur `GameInstance.accessCode` pour recherche rapide
- **Index composite** sur `QuestionsInGameTemplate(gameTemplateId, sequence)` pour l'ordre des questions
- **Contraintes de clé étrangère** avec suppression en cascade pour maintenir l'intégrité
- **Index sur timestamps** pour les requêtes de tri chronologique

## Migration et évolution

Le schéma évolue via les migrations Prisma :

```bash
# Générer une nouvelle migration
npx prisma migrate dev --name description_de_la_migration

# Appliquer les migrations
npx prisma migrate deploy

# Générer le client Prisma
npx prisma generate
```

## Cache et optimisation

Certaines données sont mises en cache dans Redis pour améliorer les performances :
- État des parties en cours
- Timers des questions
- Sessions utilisateur
- Métadonnées des questions fréquemment utilisées