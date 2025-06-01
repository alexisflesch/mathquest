# MathQuest - Zornium

MathQuest est une application de quiz en temps réel inspirée de Kahoot, conçue pour les enseignants et leurs élèves. Elle permet :
- d'accéder à une base de données partagée d'exercices, avec ajout facile de nouveaux contenus.
- aux élèves de s'exercer seuls ou en groupe (mode tournoi).
- aux enseignants d'organiser des sessions en classe, avec affichage sur projecteur et suivi des résultats en temps réel.

---

## 🚀 Installation rapide

### Prérequis
- **Node.js** v18+ recommandé ([télécharger](https://nodejs.org/))
- **npm** (installé avec Node.js)
- **PostgreSQL** (base de données)
- **Redis** (sessions et Socket.IO)

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
- **Windows** :
  Télécharger et installer depuis https://www.postgresql.org/download/

Créer la base et l'utilisateur :
```bash
sudo -u postgres psql
CREATE DATABASE mathquest;
CREATE USER mathquest WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mathquest TO mathquest;
\q
```

#### Redis
- **Linux (Debian/Ubuntu)** :
  ```bash
  sudo apt update && sudo apt install redis-server
  sudo systemctl enable redis-server --now
  ```
- **macOS (Homebrew)** :
  ```bash
  brew install redis
  brew services start redis
  ```
- **Windows** :
  Télécharger Redis Stack : https://redis.io/download

Vérifier le fonctionnement :
```bash
redis-cli ping
# Réponse attendue : PONG
```

### 2. Configurer les variables d'environnement

- Copier `example.env` en `.env` à la racine du projet et adapter les valeurs (PostgreSQL, Redis, etc) :
  ```bash
  cp example.env .env
  nano .env
  ```
- Faire de même dans `script/` si besoin de scripts d'import :
  ```bash
  cp script/example.env script/.env
  nano script/.env
  ```

### 3. Installer les dépendances Node.js

```bash
npm install
```

### 4. Initialiser la base de données avec Prisma

- Appliquer les migrations :
  ```bash
  npx prisma migrate deploy
  ```
- Générer le client Prisma :
  ```bash
  npx prisma generate
  ```

### 5. (Optionnel) Importer des questions

- Utiliser le script Python pour importer des questions YAML :
  ```bash
  cd script
  python3 import_questions.py
  ```

### 6. Lancer l'application

#### En développement
```bash
npm run dev
```

#### En production
```bash
npm run build
npm start
```

### 7. Lancer le frontend (si séparé)
- Le frontend Next.js est inclus dans ce repo. Pour le développement :
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- Pour la production :
  ```bash
  npm run build
  npm start
  ```

---

## 🛠️ Dépannage & Conseils
- Vérifiez que PostgreSQL et Redis tournent (`systemctl status ...`).
- Les ports par défaut sont configurables dans `.env`.
- Pour réinitialiser la base : `npx prisma migrate reset` (⚠️ efface les données).
- Pour tester les sockets : voir `/docs/sockets/` et `/backend/tests/`.
- Documentation technique détaillée : `/docs/`

---

- **Nom de l'application** : MathQuest
- **Licence** : GPL
