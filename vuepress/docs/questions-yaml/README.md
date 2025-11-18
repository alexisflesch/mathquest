---
title: ✍️ Création de questions
sidebarTitle: Créer des questions
---

# ✍️ Créer des questions

> Cette page explique comment créer des questions pour Kutsum.  
> **Pour la plupart des utilisateurs**, nous recommandons d'utiliser l'interface web dédiée qui permet de créer des questions facilement sans connaissances techniques.  
> Le format YAML présenté ci-dessous est destiné aux utilisateurs avancés ou pour l'édition en masse.

---

## 🌐 Méthode recommandée : Interface web

### Accès à l'éditeur de questions

1. **Connectez-vous** en tant qu'enseignant sur l'application
3. **Cliquez sur "Éditer des questions"** dans le menu latéral pour ouvrir l'interface de création

<!-- TODO: Add screenshot of question editor interface -->
<!-- <div class="screenshot-container">
  <img src="/screenshots/question-editor-interface.png" alt="Interface d'édition de questions" class="theme-screenshot">
  <p><em>Interface intuitive pour créer et modifier des questions</em></p>
</div> -->

### Création d'une question étape par étape

#### 1. **Informations générales**
- **Titre** : Donnez un titre court et descriptif à votre question
- **UID** : Identifiant unique (généré automatiquement, modifiable si besoin)
- **Auteur** : Pré-rempli avec votre nom d'utilisateur

#### 2. **Classification pédagogique**
Organisez votre question selon la hiérarchie suivante :
- **Niveau scolaire** : Sélectionnez le niveau (CP, CE1, CE2, CM1, CM2, Sixième, etc.)
- **Discipline** : Choisissez la matière (Mathématiques, Français, Histoire, etc.)
- **Thèmes** : Sélectionnez un ou plusieurs thèmes liés à la discipline
- **Tags** : Ajoutez des mots-clés supplémentaires pour faciliter la recherche

#### 3. **Contenu de la question**
- **Type de question** :
  - **Choix unique** : Une seule bonne réponse parmi plusieurs propositions
  - **Choix multiple** : Plusieurs bonnes réponses possibles
  - **Numérique** : Réponse sous forme de nombre
- **Temps limite** : Durée allouée (en secondes)
- **Difficulté** : Niveau de difficulté (1 à 5)

#### 4. **Énoncé et réponses**
- **Texte de la question** : Rédigez l'énoncé (support LaTeX pour les formules mathématiques)
- **Options de réponse** : Pour les QCM/QCU, ajoutez/supprimez des propositions
- **Réponses correctes** : Cochez la/les bonne(s) réponse(s)

#### 5. **Explication et feedback**
- **Texte de l'explication** : Explication affichée après la réponse (optionnel)
- **Temps d'affichage** : Durée pendant laquelle l'explication reste visible

### Fonctionnalités avancées

- **Mode Formulaire/YAML** : Basculez entre l'interface visuelle et l'édition directe en YAML
- **Aperçu en temps réel** : Visualisez immédiatement le rendu de votre question
- **Validation automatique** : Détection des erreurs et suggestions de correction
- **Import/Export** : Importez des questions existantes ou exportez vos créations

### 💾 Sauvegarde et export des questions

**Important** : L'interface web ne modifie pas directement la base de données des questions. Par conception, toutes les modifications restent locales dans votre navigateur.

#### Sauvegarde automatique
- Vos questions sont automatiquement sauvegardées dans le stockage local de votre navigateur
- Elles persistent entre les sessions tant que vous utilisez le même navigateur

#### Export vers YAML
Pour utiliser vos questions dans l'application ou les partager :

1. **Utilisez la fonctionnalité d'export** dans l'interface pour télécharger vos questions au format YAML
2. **Importez le fichier YAML** via les scripts d'importation ou contactez un administrateur pour les ajouter à la base commune
3. **Partagez vos questions** en les soumettant via le processus de contribution (voir [Contribuer à la base commune](./contribuer.md))

**💡 Conseil** : Exportez régulièrement vos questions au format YAML pour ne pas perdre votre travail.

### 📋 Gestion de la taxonomie

La classification des questions (niveaux scolaires, disciplines, thèmes, tags) est gérée de manière centralisée pour assurer la cohérence de toute la base de questions.

#### Taxonomie existante
- **Niveaux scolaires** : CP, CE1, CE2, CM1, CM2, Sixième, Cinquième, Quatrième, Troisième, Seconde, Première, Terminale, L1, L2, L3, M1, M2
- **Disciplines** : Mathématiques, Français, Histoire, Géographie, Sciences, etc.
- **Thèmes et tags** : Organisés hiérarchiquement par discipline et niveau

#### Ajouter de nouveaux éléments
Si vous avez besoin d'un niveau scolaire, d'une discipline, d'un thème ou d'un tag qui n'existe pas encore :

- **Contactez un administrateur** du système
- **Expliquez votre besoin** et fournissez des exemples d'utilisation
- **L'administrateur validera** et ajoutera le nouvel élément à la taxonomie

**⚠️ Note** : La taxonomie ne peut pas être modifiée directement par les utilisateurs pour maintenir la qualité et la cohérence de la classification.

- **Clarté** : Utilisez un langage simple et précis
- **Unicité** : Chaque question doit avoir un UID unique
- **Pertinence** : Vérifiez que la classification (niveau, discipline, thèmes) correspond au contenu
- **Feedback** : Fournissez toujours une explication pour aider l'apprentissage

---

## 🔧 Méthode avancée : Format YAML

Pour les utilisateurs expérimentés ou pour créer/modifier plusieurs questions à la fois, vous pouvez utiliser le format YAML directement.

### 📌 Structure d'une question (YAML)

Chaque question doit respecter une structure commune, avec un ensemble de **champs obligatoires** et d'**options facultatives** selon le type de question.  
Le champ `questionType` définit la nature de la question, qui peut être l'un des types suivants :

- `single_choice` – une seule bonne réponse parmi plusieurs propositions.
- `multiple_choice` – plusieurs bonnes réponses possibles.
- `numeric` – la réponse attendue est un nombre.

**⚠️ Note** : Cette section est destinée aux utilisateurs avancés. Pour la plupart des cas, utilisez l'interface web qui génère automatiquement le YAML correct.

### ✅ Exemples par type de question (YAML)

Voici des exemples de structure YAML pour référence. L'interface web génère automatiquement ce format, mais vous pouvez l'utiliser pour l'édition directe ou l'import en masse.

### 🔹 Exemple *single_choice*

```yaml
uid: "Q-0001"
author: "Alexis Flesch"
text: "Quelle est la capitale de la France ?"
questionType: "single_choice"
discipline: "Géographie"
timeLimit: 15
themes: ["Europe", "France"]
answerOptions:
  - "Paris"
  - "Londres"
  - "Berlin"
  - "Madrid"
correctAnswers: [true, false, false, false]
difficulty: 1
gradeLevel: "Sixième"
```

---

### 🔹 Exemple *multiple_choice* (avec plusieurs bonnes réponses)

```yaml
uid: "Q-0002"
title: "Animaux marins"
text: |
  Parmi les animaux suivants, lesquels vivent dans l'eau de mer ?
questionType: "multiple_choice"
discipline: "sciences"
themes: ["biologie", "milieux naturels"]
difficulty: 2
gradeLevel: "CM1"
author: "Mme Dupont"
explanation: "Le dauphin, le thon et la méduse vivent en milieu marin, contrairement à la grenouille qui vit en eau douce."
tags: ["animaux", "milieu", "eau"]
timeLimit: 30
excludedFrom: ["tournament", "practice"]
answerOptions:
  - "Dauphin"
  - "Grenouille"
  - "Méduse"
  - "Thon"
correctAnswers: [true, false, true, true]
feedbackWaitTime: 5
```

---

### 🔹 Exemple *numeric*

```yaml
uid: "jdupont-6e-maths-cp-001"
title: "Calcul mental simple"
text: "Combien font 2 + 2 ?"
questionType: "numeric"
discipline: "mathématiques"
gradeLevel: "CP"
themes: ["Calcul"]
author: "Jean Dupont"
difficulty: 1
correctAnswer: 4
explanation: "2 + 2 = 4"
timeLimit: 20
tolerance: 0
feedbackWaitTime: 5
```

### 🧾 Référence des champs YAML

Cette référence détaille tous les champs disponibles lors de l'édition directe en YAML. L'interface web masque la complexité de ces champs et les remplit automatiquement.

| Champ              | Type      | Obligatoire | Description |
|--------------------|-----------|-------------|-------------|
| `uid`              | string    | oui         | Identifiant unique (ex. : `auteur-niveau-matiere-theme-numero`) |
| `title`            | string    | non         | Titre court de la question |
| `text`             | string    | oui         | Énoncé de la question |
| `questionType`     | string    | oui         | Type : `single_choice`, `multiple_choice`, `numeric` |
| `discipline`       | string    | oui         | Discipline (ex : `mathématiques`, `géographie`) |
| `themes`           | string[]  | oui         | Liste des thèmes abordés |
| `difficulty`       | int       | oui         | Difficulté (entier) |
| `gradeLevel`       | string    | oui         | Niveau scolaire (ex : `5e`, `Terminale`) |
| `author`           | string    | non         | Auteur de la question |
| `explanation`      | string    | non         | Explication affichée après la réponse |
| `tags`             | string[]  | non         | Mots-clés (non hiérarchiques) |
| `timeLimit`        | int       | non         | Temps limite (en secondes) |
| `excludedFrom`     | string[]  | non         | Liste des modes exclus (`tournament`, `practice`, `quiz`) |
| `answerOptions`    | string[]  | oui*        | Liste des propositions (obligatoire pour `single_choice` et `multiple_choice`) |
| `correctAnswers`   | bool[]    | oui*        | Tableau de booléens (obligatoire pour `single_choice` et `multiple_choice`) |
| `correctAnswer`    | number    | oui*        | Réponse numérique (obligatoire pour `numeric`) |
| `tolerance`        | number    | non         | Marge d’erreur acceptée pour les questions `numeric` (par défaut : 0) |
| `feedbackWaitTime` | int       | non         | Durée d’affichage de l’explication (par défaut : 5 secondes) |

---

## 🧮 À propos des questions numériques

Pour les questions de type `numeric`, on utilise :

- `correctAnswer` : la valeur attendue
- `tolerance` *(optionnel)* : pour accepter une plage de valeurs autour de la bonne réponse.  
  Par exemple, si `correctAnswer: 4` et `tolerance: 0.5`, on accepte toute réponse entre 3.5 et 4.5.

---

## 🧠 Ajouter des formules LaTeX

Vous pouvez inclure des formules mathématiques dans les champs `text`, `answerOptions`, `explanation`, etc.  
La syntaxe utilisée est celle de LaTeX compatible MathJax :

- **Formule en ligne** : `\(E = mc^2\)`
- **Formule centrée (bloc)** :
  ```markdown
  \[
  \int_0^1 x^2 dx = \frac{1}{3}
  \]
  ```

⚠️ Les délimiteurs `$$...$$` ou `$...$` ne sont **pas supportés**, pour éviter les conflits avec le symbole dollar utilisé dans certaines disciplines non scientifiques.

### 📥 Import de questions (avancé)

Pour importer des questions créées en YAML ou modifier plusieurs questions à la fois :

- Placez les fichiers YAML dans le dossier prévu
- Utilisez le script d'import fourni pour les charger en base
- Ou utilisez la fonctionnalité d'import dans l'interface web

**💡 Conseil** : Pour la création individuelle, privilégiez toujours l'interface web qui offre validation en temps réel et aperçu visuel.

---

## 🎯 Quand utiliser chaque méthode ?

| Cas d'usage | Méthode recommandée | Pourquoi |
|-------------|-------------------|----------|
| **Créer une question isolée** | Interface web | Simple, intuitif, validation automatique |
| **Modifier une question existante** | Interface web | Aperçu en temps réel, corrections guidées |
| **Créer plusieurs questions similaires** | Interface web | Copier/coller entre questions, validation par lot |
| **Import de questions existantes** | YAML + Import | Pour migrer des banques de questions |
| **Édition en masse** | YAML direct | Modification programmatique ou scriptée |
| **Développement/Tests** | YAML direct | Contrôle total pour les développeurs |

---

## 🧮 À propos des questions numériques
