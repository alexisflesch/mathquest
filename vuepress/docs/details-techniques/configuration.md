# Configuration et environnement

## Vue d'ensemble

MathQuest utilise plusieurs fichiers de configuration et variables d'environnement pour gérer différents aspects de l'application. Cette section détaille toutes les options de configuration disponibles.

## Variables d'environnement

### Variables obligatoires

#### Base de données
```bash
# URL de connexion PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/mathquest"
```

#### Cache Redis
```bash
# URL de connexion Redis
REDIS_URL="redis://localhost:6379"
```

#### Authentification JWT
```bash
# Clé secrète pour les tokens JWT (minimum 32 caractères)
JWT_SECRET="your_super_secure_jwt_secret_key_here"
```

### Variables recommandées

#### Configuration serveur
```bash
# Port d'écoute du serveur (défaut: 3007)
PORT=3007

# Niveau de log (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL=INFO

# URL du frontend pour CORS (production)
FRONTEND_URL="https://yourdomain.com"

# Domaine de l'application
APP_DOMAIN="yourdomain.com"
APP_NAME="MathQuest"
```

#### Sécurité
```bash
# Mot de passe administrateur pour les inscriptions enseignants
ADMIN_PASSWORD="secure_admin_password"

# Configuration email (Brevo/Sendinblue)
BREVO_API_KEY="your_brevo_api_key"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"
BREVO_SENDER_NAME="MathQuest"
```

#### Email et vérification
```bash
# Durée d'expiration des tokens
EMAIL_VERIFICATION_TOKEN_EXPIRY="24h"
PASSWORD_RESET_TOKEN_EXPIRY="1h"
```

## Fichiers de configuration

### PM2 Ecosystem Configuration

Le fichier `ecosystem.config.js` configure le déploiement avec PM2 :

```javascript
module.exports = {
    apps: [
        {
            name: "mathquest-backend",
            script: "npm",
            cwd: "./backend",
            args: "run start",
            env: {
                NODE_ENV: "production",
                REDIS_URL: "redis://localhost:6379",
                DATABASE_URL: "postgresql://...",
                JWT_SECRET: "...",
                FRONTEND_URL: "https://yourdomain.com"
            },
            log_file: "./logs/pm2-backend.log",
            out_file: "./logs/pm2-backend-out.log",
            error_file: "./logs/pm2-backend-error.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            max_memory_restart: "400M"
        },
        {
            name: "mathquest-frontend",
            script: "npm",
            cwd: "./frontend",
            args: "run start:minimal",
            env: {
                NODE_ENV: "production",
                NEXT_TELEMETRY_DISABLED: "1"
            },
            log_file: "./logs/pm2-frontend.log",
            out_file: "./logs/pm2-frontend-out.log",
            error_file: "./logs/pm2-frontend-error.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            merge_logs: true,
            max_memory_restart: "300M"
        }
    ]
}
```

### Configuration Next.js

Le fichier `next.config.ts` configure l'application frontend :

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration de base
  reactStrictMode: true,

  // Configuration des images
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development'
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },

  // Variables d'environnement exposées au frontend
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.APP_NAME,
    NEXT_PUBLIC_APP_DOMAIN: process.env.APP_DOMAIN
  }
};

module.exports = nextConfig;
```

### Configuration ESLint

Le fichier `eslint.config.mjs` définit les règles de linting :

```javascript
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    // Règles personnalisées
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
});
```

## Configuration de la base de données

### Prisma Schema

Le fichier `schema.prisma` définit le modèle de données :

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/db/generated/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Modèles de données...
```

### Configuration de connexion

La connexion Prisma est configurée dans `src/db/prisma.ts` :

```typescript
import { PrismaClient } from '@/db/generated/client';

// Singleton pattern pour éviter les connexions multiples
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
```

## Configuration Redis

### Connexion Redis

Le fichier `src/config/redis.ts` configure la connexion Redis :

```typescript
import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL is not defined in environment variables.');
  throw new Error('REDIS_URL is not defined.');
}

const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

redisClient.on('connect', () => {
  logger.info('Successfully connected to Redis.');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

export { redisClient };
```

### Clés Redis utilisées

MathQuest utilise plusieurs patterns de clés Redis :

```
# États de partie
mathquest:game:{accessCode}

# Timers de questions
mathquest:timer:{accessCode}:{questionUid}

# Sessions utilisateur
mathquest:session:{userId}

# Cache des questions
mathquest:question:{questionUid}

# Leaderboards
mathquest:leaderboard:{gameId}
```

## Configuration CORS

### Middleware CORS

Le serveur configure CORS dans `src/server.ts` :

```typescript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://mathquest.example.com'
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

## Configuration des logs

### Logger personnalisé

Le système de logging utilise `winston` avec configuration dans `src/utils/logger.ts` :

```typescript
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mathquest' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

export default logger;
```

## Configuration des tests

### Jest Configuration

Le fichier `jest.config.js` configure les tests :

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false,
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

## Variables d'environnement par environnement

### Développement

```bash
# .env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/mathquest_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev_secret_key_not_for_production"
LOG_LEVEL=DEBUG
PORT=3007
FRONTEND_URL="http://localhost:3000"
```

### Production

```bash
# .env
NODE_ENV=production
DATABASE_URL="postgresql://user:password@prod-db-host:5432/mathquest_prod"
REDIS_URL="redis://prod-redis-host:6379"
JWT_SECRET="production_secret_key_very_secure"
LOG_LEVEL=WARN
PORT=3007
FRONTEND_URL="https://mathquest.example.com"
APP_DOMAIN="mathquest.example.com"
BREVO_API_KEY="prod_brevo_key"
ADMIN_PASSWORD="secure_prod_admin_password"
```

### Test

```bash
# .env.test
NODE_ENV=test
DATABASE_URL="postgresql://postgres:password@localhost:5432/mathquest_test"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="test_secret_key"
LOG_LEVEL=ERROR
PORT=3008
```

## Scripts de déploiement

### Scripts disponibles

```bash
# Construction complète
./build-all.sh

# Construction pour VPS
./build-vps.sh

# Démarrage avec PM2
npm run pm2:start

# Redémarrage des services
npm run pm2:restart

# Arrêt des services
npm run pm2:stop

# Logs PM2
npm run pm2:logs
```

### Script de construction complet

Le fichier `build-all.sh` :

```bash
#!/bin/bash

# Construction du backend
echo "Building backend..."
cd backend
npm install
npm run build
cd ..

# Construction du frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Construction de la documentation
echo "Building docs..."
cd vuepress
npm install
npm run build
cd ..

echo "Build completed!"
```

## Monitoring et métriques

### Endpoints de santé

```bash
# Santé générale
GET /health

# Métriques mémoire
GET /health/memory

# Métriques détaillées (authentification requise)
GET /api/v1/health/metrics
```

### Métriques collectées

- Utilisation mémoire (heap, RSS, external)
- Uptime du processus
- Nombre de connexions Socket.IO actives
- Latence base de données
- Taux d'erreur des requêtes
- Métriques Redis (connexions, commandes/seconde)

## Sécurité

### Headers de sécurité

Configuration des headers dans Next.js :

```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=()' }
      ]
    }
  ];
}
```

### Validation des entrées

Toutes les entrées utilisateur sont validées avec Zod :

```typescript
import { z } from 'zod';

export const UserInputSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
  username: z.string().min(3, 'Nom d\'utilisateur trop court')
});
```

## Migration et mise à jour

### Variables d'environnement critiques

Lors des mises à jour, vérifier ces variables :

1. `DATABASE_URL` - Peut changer avec la migration DB
2. `REDIS_URL` - Peut changer avec le scaling
3. `JWT_SECRET` - Ne jamais changer en production
4. `BREVO_API_KEY` - Peut nécessiter rotation
5. `ADMIN_PASSWORD` - À changer régulièrement

### Commandes de migration

```bash
# Migration base de données
cd backend
npx prisma migrate deploy

# Génération du client Prisma
npx prisma generate

# Redémarrage des services
npm run pm2:restart
```