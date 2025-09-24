# Détails techniques (utilisateurs avancés seulement)

Cette section contient une documentation technique détaillée de l'architecture de MathQuest, destinée aux développeurs, administrateurs système et utilisateurs avancés souhaitant comprendre en profondeur le fonctionnement de l'application.

## Vue d'ensemble

MathQuest est une application web moderne construite avec une architecture full-stack comprenant :

- **Frontend** : Next.js avec React et TypeScript
- **Backend** : Node.js avec Express, Socket.IO et Prisma
- **Base de données** : PostgreSQL
- **Cache/Stockage** : Redis
- **Documentation** : VuePress (cette documentation)

## Sections disponibles

- [Architecture générale](./architecture.md) - Vue d'ensemble de l'architecture technique
- [Base de données](./database.md) - Schéma de la base de données et modèles
- [Système de scoring](./scoring.md) - Logique de calcul des scores et pénalités
- [Services backend](./backend-services.md) - Services et gestion des événements quiz
- [API REST](./api.md) - Documentation complète des endpoints REST
- [Configuration](./configuration.md) - Variables d'environnement et fichiers de configuration
- [Tests et qualité](./tests.md) - Stratégie de test et qualité du code
- [Déploiement et DevOps](./deployement.md) - Déploiement, monitoring et scaling

## Avertissement

Cette documentation technique est destinée aux utilisateurs expérimentés. Elle contient des détails d'implémentation qui peuvent changer avec les mises à jour. Pour une utilisation normale de l'application, consultez la [documentation utilisateur](../utilisation/).

## Contribuer

Si vous êtes développeur et souhaitez contribuer au code de MathQuest, cette documentation vous aidera à comprendre l'architecture. Le code source est disponible sur [GitHub](https://github.com/alexisflesch/mathquest).