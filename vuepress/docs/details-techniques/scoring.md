# Système de scoring

## Vue d'ensemble

MathQuest utilise un système de scoring sophistiqué qui prend en compte plusieurs facteurs :
- La correction de la réponse
- Le temps mis pour répondre
- Le type de question (QCM vs numérique)
- Les redémarrages de timer
- Le mode de jeu (quiz, tournoi, entraînement)

## Score de base

### Calcul du score par question

Le score total d'une partie est réparti équitablement entre toutes les questions :

```
score_base_par_question = 1000 / nombre_total_questions
```

**Exemple :**
- Quiz avec 10 questions → 100 points par question
- Quiz avec 20 questions → 50 points par question

## Score de correction

### Questions à choix multiples (QCM)

MathQuest utilise un système de scoring partiel pour les QCM :

```
score_correction = max(0, (C_B / B) - (C_M / M))
```

Où :
- `B` = nombre d'options correctes
- `C_B` = nombre d'options correctes sélectionnées
- `C_M` = nombre d'options incorrectes sélectionnées
- `M` = nombre d'options incorrectes totales

**Exemples :**

```javascript
// Question : Quelle est la capitale de la France ?
// Options : [Paris, Lyon, Marseille] - Correct : [true, false, false]
// B = 1, M = 2

// Réponse parfaite : [Paris] → C_B = 1, C_M = 0
// Score = max(0, (1/1) - (0/2)) = 1.0 (100%)

// Réponse partielle : [Paris, Lyon] → C_B = 1, C_M = 1
// Score = max(0, (1/1) - (1/2)) = 0.5 (50%)

// Mauvaise réponse : [Lyon] → C_B = 0, C_M = 1
// Score = max(0, (0/1) - (1/2)) = 0.0 (0%)
```

### Questions numériques

Les questions numériques utilisent un système binaire (correct/incorrect) avec tolérance :

```javascript
function checkNumericAnswer(correctAnswer, userAnswer, tolerance) {
  const difference = Math.abs(userAnswer - correctAnswer);
  return difference <= tolerance;
}
```

**Exemple :**
```javascript
// Question : Quelle est la racine carrée de 16 ?
// Réponse correcte : 4, tolérance : 0.1

checkNumericAnswer(4, 4.05, 0.1)     // true  → score = 1.0
checkNumericAnswer(4, 4.2, 0.1)      // false → score = 0.0
checkNumericAnswer(4, "4", 0.1)       // true  → conversion automatique
```

## Pénalité temporelle

### Principe général

La pénalité temporelle utilise une fonction logarithmique pour éviter les pénalités trop sévères :

```
facteur_pénalité = min(1, log(temps_effectif + 1) / log(limite_temps + 1))
```

### Gestion des redémarrages de timer

Le système adapte les pénalités selon le nombre de redémarrages :

| Redémarrage | Pénalité de base | Pénalité maximale |
|-------------|------------------|-------------------|
| 0 (premier) | 0%              | 30%               |
| 1 (second)  | 30%             | 50%               |
| 2+ (suivant)| 50%             | 50%               |

### Calcul détaillé

```javascript
function calculateTimePenalty(scoreBeforePenalty, effectiveTime, timeLimit, restartCount) {
  // Facteur logarithmique
  const timePenaltyFactor = Math.min(1, Math.log(effectiveTime + 1) / Math.log(timeLimit + 1));

  // Plages de pénalité selon les redémarrages
  let basePenaltyPercent = 0.0;
  let maxPenaltyPercent = 0.3;

  if (restartCount === 1) {
    basePenaltyPercent = 0.3;
    maxPenaltyPercent = 0.5;
  } else if (restartCount >= 2) {
    basePenaltyPercent = 0.5;
    maxPenaltyPercent = 0.5;
  }

  // Pénalité dynamique
  const penaltyRange = maxPenaltyPercent - basePenaltyPercent;
  const dynamicPenaltyPercent = basePenaltyPercent + (penaltyRange * timePenaltyFactor);

  // Application de la pénalité
  const timePenalty = scoreBeforePenalty * dynamicPenaltyPercent;
  const finalScore = Math.max(0, scoreBeforePenalty - timePenalty);

  return {
    finalScore: Math.round(finalScore * 100) / 100,
    timePenalty: Math.round(timePenalty * 100) / 100
  };
}
```

**Exemple concret :**

```javascript
// Question à 100 points, limite 60 secondes, premier essai
const result1 = calculateTimePenalty(100, 30, 60, 0);
// timePenaltyFactor ≈ 0.5
// dynamicPenaltyPercent = 0 + (0.3 * 0.5) = 0.15 (15%)
// finalScore = 100 - 15 = 85

// Même question, deuxième essai (redémarrage)
const result2 = calculateTimePenalty(100, 45, 60, 1);
// timePenaltyFactor ≈ 0.7
// dynamicPenaltyPercent = 0.3 + (0.2 * 0.7) = 0.44 (44%)
// finalScore = 100 - 44 = 56
```

## Score final par question

```
score_final = max(0, (score_base × score_correction) - pénalité_temporelle)
```

### Exemple complet

```javascript
// Quiz de 10 questions = 100 points par question
// Question QCM : 3 options, 1 correcte
// Temps limite : 60 secondes
// Utilisateur répond en 25 secondes, parfaitement

const baseScore = 100;                    // 1000 / 10 questions
const correctnessScore = 1.0;             // Réponse parfaite
const scoreBeforePenalty = 100 * 1.0;    // 100 points

const timeSpent = 25;                     // secondes
const timeLimit = 60;                     // secondes
const restartCount = 0;                   // Premier essai

// Calcul de la pénalité
const timeFactor = Math.log(25 + 1) / Math.log(60 + 1);  // ≈ 0.63
const penaltyPercent = 0 + (0.3 * 0.63);                // ≈ 0.19 (19%)
const timePenalty = 100 * 0.19;                         // ≈ 19 points

const finalScore = Math.max(0, 100 - 19);               // 81 points
```

## Modes de jeu et scoring

### Mode Quiz
- Score en temps réel
- Leaderboard mis à jour après chaque réponse
- Pénalités temporelles appliquées

### Mode Tournoi
- Système de scoring identique au quiz
- Possibilité de sessions différées
- Gestion des tentatives multiples

### Mode Entraînement
- Pas de timer, pas de pénalités
- Focus sur l'apprentissage
- Score optionnel pour le suivi des progrès

## Stockage des scores

### Base de données

```sql
-- Score en direct (mises à jour temps réel)
liveScore: Int @default(0)

-- Score différé (pour les tournois)
deferredScore: Int @default(0)

-- Nombre de tentatives
nbAttempts: Int @default(0)
```

### Cache Redis

Les scores intermédiaires sont stockés dans Redis pour :
- Mise à jour rapide du leaderboard
- Gestion des sessions différées
- Synchronisation entre participants

## Debugging et monitoring

Le système de scoring produit des logs détaillés :

```json
{
  "questionType": "multiple-choice",
  "totalQuestions": 10,
  "baseScorePerQuestion": 100,
  "correctnessScore": 0.5,
  "serverTimeSpentSeconds": 25,
  "timeLimitSeconds": 60,
  "restartCount": 0,
  "timePenaltyFactor": 0.63,
  "dynamicPenaltyPercent": 0.19,
  "finalScore": 81,
  "timePenalty": 19
}
```

Ces logs permettent de déboguer les calculs de score et d'optimiser le système de pénalités.