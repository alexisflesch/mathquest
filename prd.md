# Project Requirement Document (PRD)

Nom du projet : MathQuest

## 1. Introduction

### Objectif de l'application

Créer une application web de quiz en tournoi, pensée pour un usage éducatif (enseignants/élèves), permettant :

- De créer et rejoindre des tournois de questions/réponses.
- De jouer en direct ou en différé.
- D’avoir une interface en temps réel (scores, classement).
- De personnaliser l'expérience utilisateur (avatar, pseudo, etc.).

### Public cible

- Élèves de niveaux élémentaire à post-bac.
- Enseignants souhaitant dynamiser leur enseignement par le jeu.
- Éventuellement : étudiants, structures éducatives ou centres de formation.

### Contexte

Le projet vise à offrir une alternative libre, rapide et accessible aux solutions propriétaires comme Kahoot!, avec une approche communautaire et modulaire. Il doit pouvoir évoluer pour supporter plusieurs enseignants, chacun pouvant gérer sa propre base de données.

### 1.4 Design UI/UX

- L'interface doit être moderne, responsive et proposer une expérience engageante.
- Les avatars sont présents dans le dossier `avatars/` mais pourront être déplacés au besoin.

## 2. Fonctionnalités

Sur la page d'accueil, l'utilisateur doit pouvoir choisir entre deux modes : élève ou enseignant. En fonction de son choix, il sera redirigé vers la vue correspondante.

### 2.1 Vue Élève

- **Accès sans authentification** : Les élèves n'ont pas besoin de créer de compte.
- **Connexion à un tournoi** : Via un code fourni par l’enseignant.
- **Possibilité de rejoindre un tournoi déjà commencé** : Les élèves peuvent arriver en retard, mais recevront 0 aux questions déjà passées.
- **Sélection de catégories** : En mode libre (hors tournoi), un élève peut choisir des catégories dans lesquelles il souhaite s'entraîner.
- **Affichage du score et du classement** en temps réel pendant le tournoi.
- **Avatar et pseudo personnalisables** pour chaque session.

### 2.2 Vue Enseignant

- **Espace personnel avec authentification** (voir 2.5).
- **Création de quizz** :
  - Les questions sont stockées dans des fichiers Markdown, importés dans une base de données.
  - L’enseignant interroge cette base via une interface web pour créer une liste de questions.
  - Possibilité de sauvegarder un quizz pour réutilisation ultérieure.
- **Création de tournois** :
  - Un tournoi correspond à un événement dans lequel un quizz est joué avec des participants en direct.
  - L’enseignant choisit un quizz existant et lance un tournoi avec un code unique.
- **Affichage pour vidéoprojection** :
  - Page spéciale projetable en classe affichant :
    - La question en cours
    - Le temps restant pour répondre
    - Un podium en direct des meilleurs joueurs
- **Suivi des performances** (éventuellement dans une future version) : Résultats globaux ou par question, exportables.

### 2.3 Vue Administrateur

- **Définition du mot de passe administrateur** utilisé pour autoriser la création des comptes enseignants.
- **Accès restreint** : Le mot de passe est fixe, non modifiable par l'interface web (stocké côté serveur).
- **Pas d’interface graphique** nécessaire pour l’admin dans un premier temps.

### 2.4 Structure Générale

- **Tournoi** : Instance de jeu en direct avec des participants et un quizz prédéfini.
- **Quizz** : Liste de questions sélectionnées par un enseignant depuis la base de données.
- **Questions** :
  - Rédigées en Markdown
  - Importées dans la base de données par parsing automatisé
  - Comportent : énoncé, propositions, bonne réponse, explication (optionnelle), niveau, catégorie, tags, etc.

### 2.5 Page de Création de Compte Enseignant

#### 2.5.1 Objectif

Permettre à un enseignant de créer un compte personnel afin d’accéder aux fonctionnalités avancées (création de quizz, lancement de tournois, etc.), à condition qu’il soit autorisé via un mot de passe administrateur fixe. Ce mot de passe est communiqué par l’administrateur de l’application (par exemple, le développeur ou le responsable technique).

#### 2.5.2 Fonctionnement

La page de création de compte enseignant comporte les éléments suivants :

- **Nom et prénom**
- **Adresse email** (utilisée comme identifiant unique)
- **Mot de passe administrateur** (obligatoire et constant)
- **Mot de passe personnel** (avec confirmation)

Validation :
- Si les données sont valides et que le mot de passe admin est correct, le compte est créé.
- En option : envoi d’un email de confirmation.

#### 2.5.3 Sécurité

- Le mot de passe admin est stocké côté serveur.
- Les mots de passe enseignants sont hachés (bcrypt ou équivalent).
- Protection contre le spam et les attaques par force brute (captcha, throttling…).

#### 2.5.4 Accès à la page

- Page d’inscription enseignant disponible à une URL connue mais non affichée dans la navigation publique.
- Inscription refusée si le mot de passe administrateur est absent ou incorrect.

#### 2.5.5 Résumé du processus

1. Accès à la page d’inscription
2. Saisie des informations et du mot de passe admin
3. Validation et création du compte
4. Connexion possible à l’espace enseignant


## 3. Stack technique

### 3.1 Frontend

- **Framework** : React
- **Rendu côté serveur** : Next.js
- **Type d’application** : Progressive Web App (PWA)
- **Fonctionnalités front** :
  - Affichage en temps réel (question, scores, podium…)
  - Interface adaptée à une utilisation sur vidéoprojecteur
  - Gestion des états via React Context ou Zustand
  - Formulaire pour les élèves (pseudo + avatar)
  - Interface dédiée aux enseignants pour :
    - Créer un tournoi
    - Sélectionner les questions depuis la base
    - Suivre les résultats en direct

### 3.2 Backend

- **Base de données** : PostgreSQL
- **API** : REST (via Next.js API routes) ou éventuellement tRPC pour typage complet
- **Temps réel** : WebSocket ou Server-Sent Events pour les mises à jour en direct (questions, scores, podium)
- **Import des questions** :
  - Les enseignants n’ajoutent pas de questions depuis l’interface
  - Les questions sont importées via des fichiers Markdown/YAML par l’administrateur sur github.
  - Ces fichiers sont parsés côté serveur et injectés dans la base PostgreSQL via un script indépendant de l'appli, qui sera écrit plus tard.

### 3.3 Authentification

- **Élèves** :
  - Pas de compte requis
  - Accès par code de tournoi
  - Choix du pseudo et avatar

- **Enseignants** :
  - Création de compte restreinte
  - Un mot de passe administrateur (défini une fois pour toutes côté serveur) est requis lors de l’inscription
  - Une fois connectés, les enseignants accèdent à :
    - Leur propre base de questions
    - La création/sauvegarde de listes de questions (quiz)
    - Le lancement et le suivi des tournois
    - L’interface vidéoprojecteur (question en cours, chrono, podium)


## 4. Base de données

### 4.1 Table `questions`

Cette table contient l’ensemble des questions disponibles dans l’application. L’ajout de questions ne se fait pas via l’interface mais exclusivement via des fichiers YAML importés par les enseignants ou l’administrateur.

| Champ         | Type      | Description                                              |
|---------------|-----------|----------------------------------------------------------|
| `uid`         | `UUID`    | Identifiant unique de la question                        |
| `question`    | `text`    | L’énoncé de la question                                  |
| `reponses`    | `jsonb`   | Liste des réponses avec indication de la/les bonne(s)    |
| `type`        | `varchar` | Type de la question (`qcm`, `choix_simple`)              |
| `discipline`  | `varchar` | Matière (ex : `maths`, `français`, `info`, etc...)       |
| `theme`       | `varchar` | Thème spécifique (ex : `trigo`, `calcul mental`, etc...) |
| `difficulte`  | `integer` | Niveau de difficulté, de 1 à 5                           |
| `niveau`      | `varchar` | Niveau scolaire (ex : `6e`, `CP`, etc...)                |
| `auteur`      | `varchar` | Nom ou identifiant de l’auteur                           |
| `explication` | `text`    | Explication de la réponse correcte (feedback optionnel)  |
| `tags`        | `text[]`  | Tableau de tags (ex : `["aire", "triangle"]`)            |
| `temps`       | `int`     | Temps (en secondes) pour répondre à la question          |


---

### Exemple de champ `reponses` (en `jsonb`)

```json
[
  { "texte": "4", "correct": false },
  { "texte": "2", "correct": true },
  { "texte": "3", "correct": false },
  { "texte": "1", "correct": true }
]
```


### Table `enseignants`

Cette table contient tous les comptes des enseignants, qui doivent s'inscrire et s'authentifier pour utiliser certaines fonctionnalités (création de quiz, gestion des tournois, etc.).

| Champ            | Type      | Description |
|------------------|-----------|-------------|
| `id`             | `UUID`    | Identifiant unique |
| `pseudo`         | `varchar` | Nom d'utilisateur ou pseudo |
| `mot_de_passe`   | `text`    | Mot de passe chiffré |
| `email`          | `varchar` | (Optionnel, surtout pour les enseignants) |
| `created_at`     | `timestamp` | Date de création du compte |
| `avatar`         | `varchar` | Nom de l’avatar choisi (optionnel, proposé à partir d'une sélection d'avatars libres de droits) |

---

### Table `joueurs`

Cette table contient les informations des joueurs (élèves) qui participent aux tournois, mais n'ont pas de compte spécifique. Ils sont identifiés par un cookie.

| Champ            | Type      | Description |
|------------------|-----------|-------------|
| `id`             | `UUID`    | Identifiant unique généré par le système (lié au cookie) |
| `pseudo`         | `varchar` | Nom d'utilisateur ou pseudo choisi par l'élève |
| `cookie_id`      | `varchar` | Identifiant unique associé au cookie de l'utilisateur |
| `created_at`     | `timestamp` | Date de création de l'utilisateur dans la session |
| `avatar`         | `varchar` | Nom de l’avatar choisi (optionnel, proposé à partir d'une sélection d'avatars libres de droits) |


### Table `tournois`

| Champ             | Type      | Description |
|-------------------|-----------|-------------|
| `id`              | `UUID`    | Identifiant unique du tournoi |
| `nom`             | `varchar` | Nom du tournoi |
| `date_creation`   | `timestamp` | Date et heure de la création du tournoi |
| `date_debut`      | `timestamp` | Date et heure de début du tournoi (peut être dans le futur) |
| `date_fin`        | `timestamp` | Date et heure de fin du tournoi |
| `statut`          | `varchar` | Statut du tournoi : "en préparation", "en cours", "terminé" |
| `enseignant_id`   | `UUID`    | Identifiant de l'enseignant qui a créé le tournoi (lié à la table `enseignants` ou `joueurs`) |
| `questions_ids`   | `text[]`  | Liste des identifiants des questions utilisées pour ce tournoi (générée automatiquement par le backend) |
| `type`            | `varchar` | Type de tournoi : "direct", "differé" |
| `niveau`          | `varchar` | Niveau scolaire des joueurs (par exemple, "CP", "6ème", etc.) |
| `categorie`       | `varchar` | Catégorie des questions choisie pour ce tournoi (maths, français, etc.) |
| `themes`          | `text[]`  | Liste des thèmes choisis pour le tournoi (par exemple, "trigonométrie", "calcul mental") |
| `creé_par`        | `varchar` | Identifiant de l'utilisateur ayant créé le tournoi, peut être un élève ou un enseignant |
| `questions_generées` | `boolean` | Indique si la liste des questions a été générée par le backend (true si générée, false si manuellement définie) |


### Table `scores`

Cette table enregistre les scores des joueurs dans chaque tournoi. Chaque ligne représente un score pour un joueur spécifique dans un tournoi donné.

| Champ             | Type      | Description |
|-------------------|-----------|-------------|
| `id`              | `UUID`    | Identifiant unique du score |
| `tournoi_id`      | `UUID`    | Identifiant du tournoi auquel appartient le score (lié à la table `tournois`) |
| `joueur_id`       | `UUID`    | Identifiant du joueur (lié à la table `joueurs`) |
| `score`           | `integer` | Score du joueur dans ce tournoi |
| `temps`           | `integer` | Temps écoulé (en secondes) pour compléter le tournoi (si applicable) |
| `position`        | `integer` | Position du joueur dans le classement final |
| `date_score`      | `timestamp` | Date et heure à laquelle le score a été enregistré |



### Table `tournois_sauvegardes`

Cette table permet de conserver les informations des tournois passés pour que les enseignants puissent les réutiliser dans de futures sessions.

| Champ             | Type      | Description |
|-------------------|-----------|-------------|
| `id`              | `UUID`    | Identifiant unique du tournoi |
| `nom`             | `VARCHAR` | Nom du tournoi (ex. : "Tournoi de mathématiques - Trigonometrie", "Tournoi de français - Grammaire") |
| `date_creation`   | `TIMESTAMP` | Date et heure de création du tournoi |
| `date_debut`      | `TIMESTAMP` | Date et heure du début effectif du tournoi |
| `date_fin`        | `TIMESTAMP` | Date et heure de fin du tournoi |
| `enseignant_id`   | `UUID`    | Identifiant unique de l'enseignant qui a créé ce tournoi. Référence à la table `enseignants` |
| `questions_ids`   | `TEXT[]`  | Liste des IDs des questions utilisées dans le tournoi. |
| `type`            | `VARCHAR` | Type de tournoi (par exemple, "direct", "différé") |
| `niveau`          | `VARCHAR` | Niveau scolaire des joueurs (par exemple, "Sixième", "Terminale") |
| `categorie`       | `VARCHAR` | Discipline choisie pour le tournoi (par exemple, "Mathématiques", "Français") |
| `themes`          | `TEXT[]`  | Liste des thèmes du tournoi (par exemple, ["Trigonométrie", "Calcul mental"]) |


### Utilisation

1. **Création d'un tournoi** : Lorsqu'un enseignant crée un tournoi, il peut choisir de l'archiver dans cette table pour le réutiliser ultérieurement.
2. **Réutilisation** : Un tournoi archivé peut être récupéré par l'enseignant, qui peut choisir de le modifier légèrement ou de le conserver tel quel. Il pourra alors le lancer à nouveau avec de nouveaux participants.
3. **Filtrage et recherche** : L'enseignant pourra rechercher ses tournois archivés par discipline, niveau, date de création, ou même par type (direct ou différé).
4. **Réutilisation de questions** : Les questions archivées dans le tournoi seront identifiées par leurs `question_ids`, ce qui permet de les récupérer facilement pour d'autres tournois.

Cela permet de garder une trace des tournois passés, d'en tirer des enseignements et de gagner du temps en réutilisant des tournois déjà conçus.

