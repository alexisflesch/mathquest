---
title: ✍️ Écriture de questions (YAML)
---

# ✍️ Rédiger des questions au format YAML

> Cette page explique comment créer des questions pour MathQuest en utilisant le format YAML.  
> Les noms de **champs sont en anglais** (par cohérence avec le code), mais les **valeurs et les textes sont en français**.  
> Les disciplines, thèmes et tags doivent respecter la nomenclature définie dans le dossier `questions` (un fichier de référence par niveau scolaire : `CP`, `CE1`, etc.).

---

## 📌 Structure d’une question

Chaque question doit respecter une structure commune, avec un ensemble de **champs obligatoires** et d’**options facultatives** selon le type de question.  
Le champ `questionType` définit la nature de la question, qui peut être l’un des types suivants :

- `single_choice` – une seule bonne réponse parmi plusieurs propositions.
- `multiple_choice` – plusieurs bonnes réponses possibles.
- `numeric` – la réponse attendue est un nombre.

---

## ✅ Exemples par type de question

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

---

## 🧾 Référence des champs YAML

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

---

## 📥 Importer vos questions

- Placez les fichiers YAML dans le dossier prévu.
- Utilisez le script d’import fourni pour les charger en base.
