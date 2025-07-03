
# 🎓 Zornigma - Mathquest (nom à définir)

**Zornigma** est une application de quiz en temps réel **libre et gratuite**, pensée pour faciliter les révisions et dynamiser les cours. Elle s’inspire de Kahoot, mais avec une philosophie de partage des ressources, sans collecte de données ni marketing.

👩‍🏫 **Pour les enseignants** : créez des sessions de quiz, affichez les résultats en direct, organisez des compétitions en classe, et profitez d’une base de données partagée que vous pouvez enrichir.

🧑‍🎓 **Pour les élèves** : entraînez-vous seul·e ou défiez vos amis dans des tournois, sans inscription obligatoire.


Une documentation (en cours d'écriture) est accessible à : https://alexisflesch.github.io/mathquest/
---

## 🌐 Fonctionnalités clés

- Base de données mutualisée de questions, ajoutées et validées par les enseignants.
- Mode solo ou tournoi (avec avatars, scores, classement…).
- Sessions projetables avec temps limité, affichage des statistiques de réponses, podium.
- Application **libre**, **sans pub**, **sans collecte de données**, hébergée par l’auteur.
- Interface simple et rapide d’accès (pas d’inscription obligatoire pour les élèves).

---

## 🚀 Installation rapide

### Prérequis

- **Node.js** v18+ ([télécharger](https://nodejs.org/))
- **npm** (fourni avec Node.js)
- **PostgreSQL** (stockage des données)
- **Redis** (gestion des sessions et Socket.IO)

### 1. Installer PostgreSQL et Redis

#### PostgreSQL

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

#### Redis

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

### 2. Configuration

Renseignez tous les fichiers `.env` (nommés example.env) 
```

Adapter les identifiants de base de données, ports, etc.

### 3. Installer les dépendances

```bash
npm install
```

### 4. Initialiser la base avec Prisma


```bash
cd app/backend
npx prisma migrate deploy
npx prisma generate
```

### 5. (Optionnel) Importer des questions

```bash
cd script
python3 import_questions.py
```



### 6. Configurer nginx (recommandé pour production)

Copiez le fichier d'exemple :  
```bash
cp nginx.example /etc/nginx/sites-available/mathquest
```
Adaptez les ports/upstreams si besoin, puis activez le site et rechargez nginx :
```bash
sudo ln -s /etc/nginx/sites-available/mathquest /etc/nginx/sites-enabled/
sudo nginx -s reload
```

**Résumé du routage :**
- `/api/v1/` → backend Node.js (port 3007)
- `/socket.io/` → backend Node.js (websockets)
- `/api` → Next.js API (port 3008)
- `/` → Next.js frontend (port 3008)

Voir le fichier `nginx.example` à la racine du projet pour un exemple complet.

---

### 7. Lancer l’application

#### En développement
```bash
npm run dev
```

#### En production (recommandé, tout-en-un)

```bash
cd app
npm install
cd shared
npm install
cd ../frontend
npm install
npm run build
cd ../backend
npm install
npm run build
```

Utilisez le script d’automatisation pour lancer le backend **et** le frontend avec pm2 :
```bash
bash start-all.sh
```
Les deux services seront gérés de façon permanente par pm2 (survivent au reboot et à la fermeture du terminal).

Vous pouvez vérifier l’état avec :
```bash
pm2 status
```
Pour relancer un service :
```bash
pm2 restart mathquest-backend
pm2 restart mathquest-frontend
```

#### (Alternative avancée) Lancer séparément

##### Backend seul
```bash
cd backend/dist/backend/src
pm2 start server.js --name mathquest-backend --env production
```

##### Frontend seul
```bash
cd frontend
pm2 start node --name mathquest-frontend --cwd ./ -- ./node_modules/next/dist/bin/next start -p 3008
```

---

## 🛠️ Dépannage & Conseils

- Vérifier que PostgreSQL et Redis tournent : `systemctl status ...`
- Les ports par défaut sont configurables dans `.env`
- Réinitialiser la base : `npx prisma migrate reset` (**efface toutes les données**)
- Tests et sockets : voir `/docs/sockets/` et `/backend/tests/`
- Documentation technique : dans le dossier `/docs/`

---

## 📄 Informations

- **Nom** : MathQuest – Zornium
- **Licence** : [GPL](https://www.gnu.org/licenses/gpl-3.0.html)
- **Auteur** : [Alexis Flesch](https://hire.alexisfles.ch)
- **Hébergement** : Serveur personnel, sans pub ni traçage.
- **Contributions** : Bienvenues ! Forkez et proposez vos idées/questions.

---