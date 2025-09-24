# Tests et qualité

## Vue d'ensemble

MathQuest maintient une suite de tests complète couvrant les tests unitaires, d'intégration et end-to-end. La stratégie de test suit les principes suivants :

- **Tests unitaires** : Logique métier isolée
- **Tests d'intégration** : Interactions entre composants
- **Tests end-to-end** : Parcours utilisateur complets
- **Tests de performance** : Métriques et optimisations

## Configuration Jest

### Backend (Node.js)

Le fichier `jest.config.js` configure Jest pour le backend :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.tests.json'
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false, // Désactivé pour la vitesse
  clearMocks: true,
  globalSetup: '<rootDir>/tests/support/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/support/globalTeardown.ts',
  setupFiles: ['<rootDir>/tests/setupTestEnv.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1'
  },
  maxConcurrency: 1,
  maxWorkers: 1,
  forceExit: true,
  testTimeout: 10000
};
```

### Frontend (Next.js)

Configuration Jest pour le frontend :

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          jsx: true
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^next/link$': '<rootDir>/next-link-mock.js',
    '^next/image$': '<rootDir>/next-image-mock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1'
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/']
};
```

## Environnement de test

### Variables d'environnement de test

Le fichier `setupTestEnv.js` configure l'environnement de test :

```javascript
process.env.DATABASE_URL = "postgresql://postgre:dev123@localhost:5432/mathquest_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test_jwt_secret";
process.env.ADMIN_PASSWORD = "test_admin";
process.env.PORT = "3001";
process.env.LOG_LEVEL = "error";
process.env.NODE_ENV = "test";

// Vérification de sécurité
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mathquest') &&
    !process.env.DATABASE_URL.includes('mathquest_test')) {
    throw new Error('TEST SAFETY VIOLATION: Test configured to use production database!');
}
```

### Base de données de test

La base de données de test est isolée de la production :

```sql
-- Base de données dédiée aux tests
CREATE DATABASE mathquest_test;

-- Permissions pour l'utilisateur de test
GRANT ALL PRIVILEGES ON DATABASE mathquest_test TO postgre;
```

## Structure des tests

### Tests unitaires

Les tests unitaires testent des unités isolées :

```
tests/unit/
├── new-scoring-strategy.test.ts      # Logique de scoring
├── emailService.test.ts               # Service d'email
├── timerRaceConditions.test.ts        # Conditions de course timer
├── socketRateLimiting.test.ts         # Limitation taux Socket.IO
├── latexInjection.test.ts             # Sécurité LaTeX
└── userServiceEmailVerification.test.ts
```

**Exemple de test unitaire :**

```typescript
describe('ScoringService.calculateAnswerScore', () => {
  it('should calculate correct score for multiple choice with perfect answer', async () => {
    // Configuration Redis
    const accessCode = 'TEST123';
    await redisClient.set(`mathquest:game:${accessCode}`, JSON.stringify({
      questionUids: ['question-1', 'question-2']
    }));

    // Question parfaite
    const question = {
      uid: 'question-1',
      multipleChoiceQuestion: {
        correctAnswers: [true, false, true]
      }
    };

    const { score, timePenalty } = await ScoringService.calculateAnswerScore(
      question,
      [0, 2], // Réponses correctes
      1000,   // 1 seconde
      1000,   // temps total
      accessCode
    );

    expect(score).toBeGreaterThan(450);
    expect(timePenalty).toBeLessThan(50);
  });
});
```

### Tests d'intégration

Les tests d'intégration testent les interactions :

```
tests/integration/
├── tournament-mode-logic.test.ts      # Logique tournoi
├── scoring-all-modes.test.ts          # Scoring tous modes
├── deferred-tournament-fixes.test.ts  # Corrections tournois différés
├── leaderboard-payload.test.ts        # Payloads leaderboard
├── timer-sync.test.ts                 # Synchronisation timers
└── database-reality-check.test.ts     # Vérifications DB
```

**Exemple de test d'intégration :**

```typescript
describe('Tournament Mode Scoring', () => {
  it('should handle live vs deferred tournaments differently', async () => {
    // Test de la logique de différenciation
    const liveGame = { playMode: 'tournament', status: 'active' };
    const deferredGame = { playMode: 'tournament', status: 'completed' };

    expect(liveGame.status).toBe('active');
    expect(deferredGame.status).toBe('completed');

    // Vérification des clés Redis
    const liveKey = `mathquest:game:leaderboard:${accessCode}`;
    const deferredKey = `deferred_session:${accessCode}:${userId}:1`;

    expect(liveKey).not.toBe(deferredKey);
  });
});
```

### Tests de cas limites

Les tests de cas limites couvrent les scénarios edge :

```
tests/edge-cases-*.test.ts
├── edge-cases-game-sessions.test.ts   # Sessions de jeu
├── edge-cases-timer-scoring.test.ts   # Timer et scoring
├── edge-cases-tournament-mode.test.ts # Mode tournoi
├── edge-cases-user-authentication.test.ts # Authentification
├── edge-cases-network-connection.test.ts  # Connexions réseau
└── edge-cases-multi-device.test.ts    # Multi-appareils
```

**Exemple de test de cas limite :**

```typescript
describe('Timer Edge Cases', () => {
  it('should handle timer restart penalties correctly', async () => {
    // Test des pénalités de redémarrage
    const restartCount = 2;
    const basePenalty = 0.5; // 50% pour 3ème essai

    expect(restartCount).toBe(2);
    expect(basePenalty).toBe(0.5);
  });

  it('should cap penalty at 50% for excessive restarts', async () => {
    // Test du plafond de pénalité
    const excessiveRestarts = 10;
    const maxPenalty = 0.5;

    expect(excessiveRestarts).toBeGreaterThan(2);
    expect(maxPenalty).toBe(0.5);
  });
});
```

## Exécution des tests

### Commandes de test

```bash
# Tests backend - tous
cd backend && npm test

# Tests backend - unitaires seulement
npm run test:unit

# Tests backend - intégration seulement
npm run test:integration

# Tests backend - avec couverture
npm run test:coverage

# Tests backend - fichier spécifique
npm test new-scoring-strategy.test.ts

# Tests frontend
cd frontend && npm test

# Tests end-to-end (Playwright)
cd app && npx playwright test
```

### Tests en continu

```bash
# Mode watch
npm run test:watch

# Tests avant commit (husky)
npm run test:precommit
```

## Mocks et utilitaires de test

### Mocks Redis

```typescript
import { redisClient } from '../../src/config/redis';

// Nettoyage avant/après chaque test
beforeEach(async () => {
  await redisClient.flushall();
});

afterEach(async () => {
  await redisClient.flushall();
});
```

### Mocks de base de données

```typescript
import { prisma } from '../../src/db/prisma';

// Mock du client Prisma
jest.mock('../../src/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));
```

### Utilitaires de test

```typescript
// Utilitaires pour créer des données de test
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  email: 'test@example.com',
  role: 'STUDENT',
  ...overrides
});

export const createTestGame = (overrides = {}) => ({
  id: 'test-game-id',
  name: 'Test Game',
  accessCode: 'TEST123',
  playMode: 'quiz',
  status: 'active',
  ...overrides
});
```

## Tests de performance

### Métriques de performance

```typescript
describe('Performance Tests', () => {
  it('should handle 1000 concurrent users', async () => {
    const startTime = Date.now();

    // Simulation de charge
    const promises = Array(1000).fill().map(async () => {
      return ScoringService.calculateAnswerScore(/*...*/);
    });

    await Promise.all(promises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // < 5 secondes
  });
});
```

### Tests de charge Socket.IO

```typescript
describe('Socket.IO Load Tests', () => {
  it('should handle multiple simultaneous connections', async () => {
    const connections = 100;

    // Créer plusieurs connexions Socket.IO
    const sockets = [];
    for (let i = 0; i < connections; i++) {
      const socket = io('http://localhost:3007');
      sockets.push(socket);
    }

    // Vérifier que toutes les connexions sont établies
    await Promise.all(sockets.map(socket =>
      new Promise(resolve => socket.on('connect', resolve))
    ));

    expect(sockets.length).toBe(connections);
  });
});
```

## Tests end-to-end (E2E)

### Configuration Playwright

Le fichier `playwright.config.ts` :

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' }
    }
  ]
});
```

### Exemple de test E2E

```typescript
import { test, expect } from '@playwright/test';

test('complete quiz workflow', async ({ page }) => {
  // Connexion
  await page.goto('/');
  await page.fill('[data-testid="email"]', 'teacher@test.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Création d'un quiz
  await page.click('[data-testid="create-quiz"]');
  await page.fill('[data-testid="quiz-name"]', 'Test Quiz');
  await page.click('[data-testid="save-quiz"]');

  // Vérification
  await expect(page.locator('[data-testid="quiz-list"]')).toContainText('Test Quiz');
});
```

## Qualité du code

### Linting et formatage

```bash
# ESLint
npm run lint

# Prettier
npm run format

# TypeScript checking
npm run type-check
```

### Couverture de code

```bash
# Génération du rapport de couverture
npm run test:coverage

# Rapport HTML
open coverage/lcov-report/index.html
```

### Métriques de qualité

- **Couverture de code** : > 80%
- **Complexité cyclomatique** : < 10 par fonction
- **Duplication de code** : < 5%
- **Temps d'exécution des tests** : < 5 minutes

## Intégration continue

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### Hooks de pré-commit

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test:unit",
      "pre-push": "npm run test:integration"
    }
  }
}
```

## Debugging des tests

### Logs de test

```typescript
// Logs détaillés pour le debugging
console.log('Test data:', { userId, gameId, score });

// Utilisation du logger de l'application
import createLogger from '../../src/utils/logger';
const logger = createLogger('TestDebug');
logger.info('Test execution details', { context });
```

### Isolation des tests

```typescript
// Chaque test est isolé
beforeEach(async () => {
  await redisClient.flushall();
  await prisma.user.deleteMany();
});

afterEach(async () => {
  await redisClient.flushall();
});
```

## Maintenance des tests

### Refactoring des tests

```typescript
// Extraire les données de test communes
const TEST_USERS = {
  teacher: { id: 'teacher-1', role: 'TEACHER' },
  student: { id: 'student-1', role: 'STUDENT' }
};

// Utiliser des factories
const createTestGame = (overrides) => ({
  id: 'game-1',
  name: 'Test Game',
  ...overrides
});
```

### Tests legacy

```typescript
// Marquer les tests legacy
describe.skip('Legacy Tests', () => {
  it('should be updated to new patterns', () => {
    // TODO: Refactor this test
  });
});
```

Cette stratégie de test assure la fiabilité et la maintenabilité de MathQuest tout en permettant une évolution rapide des fonctionnalités.