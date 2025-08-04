---
title: 🛠️ Installation
---

# 🛠️ Installation complète de MathQuest

> **Note** : Ce guide est destiné aux utilisateurs souhaitant héberger MathQuest eux-mêmes. Si vous voulez simplement l'utiliser, [rendez-vous ici](https://mathquest.alexisfles.ch).

## 📦 Prérequis

- **Node.js** v18+ ([télécharger](https://nodejs.org/))
- **npm** (fourni avec Node.js)
- **PostgreSQL** (stockage des données)
- **Redis** (gestion des sessions et Socket.IO)
- **Python 3** (pour l'import de questions, optionnel)
- **git** (pour cloner le dépôt)

## 🌀 1. Cloner le dépôt

```bash
git clone https://github.com/alexisflesch/mathquest.git
cd mathquest
```

## 🗄️ 2. Installer PostgreSQL et Redis

### 🗄️ PostgreSQL

- **Linux (Debian/Ubuntu)** :
  ```bash
  sudo apt update && sudo apt install postgresql postgresql-contrib
  ```
- **macOS (Homebrew)** :
  ```bash
  brew install postgresql
  brew services start postgresql
  ```
- **Windows** : [Télécharger PostgreSQL](https://www.postgresql.org/download/)

Créer la base et l'utilisateur :
```bash
sudo -u postgres psql
CREATE DATABASE mathquest;
CREATE USER mathquest WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mathquest TO mathquest;
\q
```

### 🗄️ Redis

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

Test de bon fonctionnement :
```bash
redis-cli ping
# Réponse attendue : PONG
```

## ⚙️ 3. Configuration des variables d'environnement

Renseignez tous les fichiers `.env` (nommés example.env) :

```bash
cp app/backend/example.env app/backend/.env
cp app/frontend/example.env app/frontend/.env
```

Adaptez les identifiants de base de données, ports, secrets, etc. selon votre environnement.

## 📥 4. Installer les dépendances

### 📦 Installation globale
```bash
npm install
```

### 📦 Installation détaillée par module
```bash
cd app
npm install
cd shared && npm install
cd ../frontend && npm install
cd ../backend && npm install
```

## 🗃️ 5. Initialiser la base de données avec Prisma

```bash
cd app/backend
npx prisma migrate deploy
npx prisma generate
```

## 📚 6. (Optionnel) Importer des questions

```bash
cd script
python3 import_questions.py
```

## 🌐 7. Configurer nginx (recommandé pour production)

Copiez le fichier d'exemple :
```bash
cp nginx.example /etc/nginx/sites-available/mathquest
```

Adaptez les ports/upstreams si besoin, puis activez le site et rechargez nginx :
```bash
sudo ln -s /etc/nginx/sites-available/mathquest /etc/nginx/sites-enabled/
sudo nginx -s reload
```

**Résumé du routage nginx :**
- `/api/v1/` → backend Node.js (port 3007)
- `/socket.io/` → backend Node.js (websockets)
- `/api` → Next.js API (port 3008)
- `/` → Next.js frontend (port 3008)

Voir le fichier `nginx.example` à la racine du projet pour un exemple complet.

## 🚀 8. Lancer l'application

### 🧑‍💻 En développement
```bash
npm run dev
```
- Frontend : http://localhost:3008
- Backend API : http://localhost:3007

### 🏭 En production (recommandé, tout-en-un)

#### 🏗️ Build des applications
```bash
cd app
npm install
cd shared && npm install
cd ../frontend && npm install && npm run build
cd ../backend && npm install && npm run build
```

#### 🚦 Lancement avec PM2
Utilisez le script d'automatisation pour lancer le backend **et** le frontend avec pm2 :
```bash
bash app/start-all.sh
```

Les deux services seront gérés de façon permanente par pm2 (survivent au reboot et à la fermeture du terminal).

#### 🛎️ Gestion des services PM2
```bash
# Vérifier l'état
pm2 status

# Relancer un service
pm2 restart mathquest-backend
pm2 restart mathquest-frontend

# Voir les logs
pm2 logs mathquest-backend
pm2 logs mathquest-frontend
```

### 🧩 (Alternative avancée) Lancer séparément

#### 🖥️ Backend seul
```bash
cd backend/dist/backend/src
pm2 start server.js --name mathquest-backend --env production
```

#### 🖥️ Frontend seul
```bash
cd frontend
pm2 start node --name mathquest-frontend --cwd ./ -- ./node_modules/next/dist/bin/next start -p 3008
```

## 🧰 Dépannage & Conseils

### 🖥️ Vérifications système
- Vérifier que PostgreSQL et Redis tournent : `systemctl status postgresql redis-server`
- Tester la connectivité Redis : `redis-cli ping`
- Vérifier les ports utilisés : `netstat -tlnp | grep :3007`

### ⚙️ Configuration
- Les ports par défaut sont configurables dans les fichiers `.env`
- Réinitialiser la base : `npx prisma migrate reset` (**efface toutes les données**)
- Tests et sockets : voir `/docs/sockets/` et `/backend/tests/`
- Documentation technique : dans le dossier `/docs/`

### 🚨 Problèmes courants
- **Port déjà utilisé** : Vérifiez qu'aucun autre service n'utilise les ports 3007/3008
- **Erreur de connexion BDD** : Vérifiez les identifiants dans le fichier `.env`
- **Redis non connecté** : Vérifiez que Redis est démarré et accessible
- **Module non trouvé** : Relancez `npm install` dans le bon dossier

## 📄 Informations

- **Nom** : MathQuest
- **Licence** : [GPL v3](https://www.gnu.org/licenses/gpl-3.0.html)
- **Auteur** : [Alexis Flesch](https://hire.alexisfles.ch)
- **Hébergement** : Serveur personnel, sans pub ni traçage
- **Code source** : [GitHub](https://github.com/alexisflesch/mathquest)
- **Contributions** : Bienvenues ! Forkez et proposez vos idées/questions

## 🎯 Fonctionnalités clés de MathQuest

- **Base de données mutualisée** de questions, ajoutées et validées par les enseignants
- **Mode solo ou tournoi** (avec avatars, scores, classement…)
- **Sessions projetables** avec temps limité, affichage des statistiques de réponses, podium
- **Application libre**, **sans pub**, **sans collecte de données**
- **Interface simple** et rapide d'accès (pas d'inscription obligatoire pour les élèves)
- **Support LaTeX complet** - Parfait pour les enseignants de mathématiques !
