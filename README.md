# MathQuest

MathQuest est une application inspirée de Kahoot, destinée aux enseignants. Son but est de :
- proposer une base de données partagée d'exercices avec la possibilité d'en ajouter facilement.
- permettre aux élèves/étudiant(e)s de s'exercer sur ces exercices, soit seul(e)s soit en groupe (mode "tournoi").
- permettre aux enseignant(e)s d'organiser des sessions en classe, avec un affichage sur un écran de projection, en suivant les résultats en temps réel.

## Installation et démarrage

### 1. Installer PostgreSQL

- **Linux (Debian/Ubuntu)** :
  ```bash
  sudo apt update
  sudo apt install postgresql postgresql-contrib
  ```
- **macOS (Homebrew)** :
  ```bash
  brew install postgresql
  brew services start postgresql
  ```
- **Windows** :
  Télécharger et installer depuis https://www.postgresql.org/download/

Créez une base de données et un utilisateur si besoin :
```bash
sudo -u postgres psql
CREATE DATABASE mathquest;
CREATE USER postgre WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mathquest TO postgre;
\q
```

### 2. Configurer les variables d'environnement

- Copiez `example.env` à la racine du projet en `.env` et éditez-le avec vos informations PostgreSQL :
  ```bash
  cp example.env .env
  nano .env
  ```
- Faites de même dans le dossier `script/` :
  ```bash
  cp script/example.env script/.env
  nano script/.env
  ```

### 3. Installer les dépendances Node.js

```bash
npm install
```

### 4. Initialiser la base de données avec Prisma

- Appliquez les migrations :
  ```bash
  npx prisma migrate deploy
  ```
- Générez le client Prisma :
  ```bash
  npx prisma generate
  ```

### 5. Importer les questions (optionnel)

- Utilisez le script Python pour importer les questions YAML :
  ```bash
  cd script
  python3 import_questions.py
  ```

### 6. Lancer l'application en développement

```bash
npm run dev
```

### 7. Lancer en production

```bash
npm run build
npm start
```

---

- **Nom de l'application** : MathQuest
- **Licence** : GPL
