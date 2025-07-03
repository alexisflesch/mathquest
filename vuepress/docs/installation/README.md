---
title: Installation
---


# Installation complète de MathQuest

> Suivez ce guide étape par étape pour installer MathQuest sur votre machine ou serveur.

## Prérequis

- **Node.js** v18 ou supérieur ([télécharger](https://nodejs.org/))
- **npm** (fourni avec Node.js)
- **PostgreSQL** (base de données)
- **Redis** (sessions et Socket.IO)
- **Python 3** (pour l’import de questions, optionnel)
- **git** (pour cloner le dépôt)

## 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd mathquest
```

## 2. Installer PostgreSQL et Redis

### PostgreSQL

- **Linux (Debian/Ubuntu)** :
  ```bash
  sudo apt update && sudo apt install postgresql postgresql-contrib
  ```
- **macOS** :
  ```bash
  brew install postgresql
  brew services start postgresql
  ```
- **Windows** : [Télécharger PostgreSQL](https://www.postgresql.org/download/)

Créer la base et l’utilisateur :
```bash
sudo -u postgres psql
CREATE DATABASE mathquest;
CREATE USER mathquest WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE mathquest TO mathquest;
\q
```

### Redis

- **Linux** :
  ```bash
  sudo apt update && sudo apt install redis-server
  sudo systemctl enable redis-server --now
  ```
- **macOS** :
  ```bash
  brew install redis
  brew services start redis
  ```
- **Windows** : [Redis Stack](https://redis.io/download)

Vérifier le fonctionnement :
```bash
redis-cli ping
# Réponse attendue : PONG
```

## 3. Configuration des variables d’environnement

Copiez les fichiers d’exemple puis adaptez-les :
```bash
cp app/backend/example.env app/backend/.env
cp app/frontend/example.env app/frontend/.env
```
Modifiez les identifiants, ports, secrets, etc. selon votre environnement.

## 4. Installer les dépendances

```bash
cd app
npm install
cd shared && npm install
cd ../frontend && npm install
cd ../backend && npm install
```

## 5. Initialiser la base de données

```bash
cd app/backend
npx prisma migrate deploy
npx prisma generate
```

## 6. (Optionnel) Importer des questions

```bash
cd script
python3 import_questions.py
```

## 7. Lancer l’application

### En développement (tout-en-un) :
```bash
cd app
npm run dev
```
- Frontend : http://localhost:3008
- Backend API : http://localhost:3007

### En production (recommandé) :
- Construisez le frontend et le backend :
  ```bash
  cd app/frontend && npm run build
  cd ../backend && npm run build
  ```
- Utilisez le script d’automatisation :
  ```bash
  cd ../../
  bash app/start-all.sh
  ```

### Avec pm2 (persistance) :
```bash
pm2 status
pm2 restart mathquest-backend
pm2 restart mathquest-frontend
```

## 8. (Optionnel) Configurer nginx pour la production

Copiez et adaptez le fichier `nginx.example` fourni à la racine du projet.

---

**Conseils** :
- Vérifiez que PostgreSQL et Redis tournent (`systemctl status ...`).
- Les ports sont configurables dans les fichiers `.env`.
- Pour réinitialiser la base : `npx prisma migrate reset` (efface toutes les données).
- Consultez la documentation technique dans `/docs/` pour plus de détails.
