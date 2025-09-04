# Guide pour la Rédaction de Questions au Format YAML pour MathQuest

Ce guide détaille exactement comment formuler les questions au format YAML pour ton application MathQuest, en s’appuyant sur les spécifications officielles en date du **4 septembre 2025**. ([alexisflesch.github.io](https://alexisflesch.github.io/mathquest/questions-yaml/))

---

## 1. Structure Générale d’une Question

Chaque question doit respecter une structure commune, avec des **champs obligatoires** et des **champs optionnels**, en fonction du type (`questionType`). Les valeurs des champs `discipline`, `themes`, et `tags` doivent respecter strictement la nomenclature définie dans le dossier `questions` (ex. : `CP`, `CE1`, etc.). Les noms des champs sont en anglais, les valeurs (textes, réponses) en français.

### Types supportés
- `single_choice` – une seule bonne réponse
- `multiple_choice` – plusieurs bonnes réponses possibles
- `numeric` – la réponse est un nombre

---

## 2. Exemples Concrets

### 2.1. **single_choice**
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

### 2.2. **multiple_choice**
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

### 2.3. **numeric**
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

## 3. Détail des Champs YAML

| Champ             | Type          | Obligatoire | Description |
|------------------|---------------|-------------|-------------|
| `uid`            | string        | Oui         | Identifiant unique |
| `title`          | string        | Non         | Titre court de la question |
| `text`           | string        | Oui         | Énoncé de la question |
| `questionType`   | string        | Oui         | `single_choice`, `multiple_choice`, ou `numeric` |
| `discipline`     | string        | Oui         | Discipline (ex. `mathématiques`, `géographie`) |
| `themes`         | string[]      | Oui         | Liste des thèmes abordés |
| `difficulty`     | int           | Oui         | Niveau de difficulté (entier) |
| `gradeLevel`     | string        | Oui         | Niveau scolaire (ex. `5e`, `Terminale`) |
| `author`         | string        | Non         | Auteur de la question |
| `explanation`    | string        | Non         | Explication affichée après réponse |
| `tags`           | string[]      | Non         | Mots-clés non hiérarchiques |
| `timeLimit`      | int           | Non         | Temps limite (en secondes) |
| `excludedFrom`   | string[]      | Non         | Modes exclus (`tournament`, `practice`, `quiz`) |
| `answerOptions`  | string[]      | Oui*        | Obligatoire pour `single_choice` & `multiple_choice` |
| `correctAnswers` | bool[]        | Oui*        | Tableau de booléens obligatoire pour `single_choice` & `multiple_choice` |
| `correctAnswer`  | number        | Oui*        | Obligatoire pour `numeric` |
| `tolerance`      | number        | Non         | Marge d’erreur pour `numeric` (par défaut 0) |
| `feedbackWaitTime` | int         | Non         | Durée d’affichage de l’explication (par défaut 5 s) |

\* Selon le type de question concerné.

---

## 4. Spécificités pour les Questions Numériques

- Utilise `correctAnswer` pour la valeur attendue.
- Tu peux ajouter `tolerance` pour accepter une plage autour de la bonne réponse.

---

## 5. Inclusion de Formules LaTeX

Tu peux intégrer des formules mathématiques dans les champs `text`, `answerOptions`, `explanation`, etc., avec une syntaxe LaTeX compatible MathJax :

- **Formule en ligne** : `\(E = mc^2\)`
- **Formule centrée (bloc)** :
  ```yaml
  text: |
    Voici une intégrale :
    \[
      \int_0^1 x^2\,dx = \frac{1}{3}
    \]
  ```
  **Important** : Les délimiteurs `$$...$$` ou `$...$` ne sont **pas supportés**.

---

## 6. Processus d’Import des Questions

1. Place les fichiers YAML dans le dossier prévu dans ton projet.
2. Lance le script d’import fourni pour les charger dans la base de données.

---

## 7. Checklist pour les Agents IA

Avant de finaliser une question, vérifie :

- Que **tous les champs obligatoires** sont bien présents selon le `questionType`.
- Que les valeurs sont en français, et que les champs comme `discipline`, `gradeLevel`, `themes`, `tags` suivent la nomenclature existante.
- Que `uid` est **unique**.
- Que pour `numeric`, si la précision est importante, un `tolerance` raisonnable est défini.
- Que les formules LaTeX sont valides et n’utilisent pas `$...$` ou `$$...$$`.
- Que les **champs optionnels** sont utilisés à bon escient (`author`, `explanation`, `timeLimit`, etc.).
- Que la structure YAML est bien indentée et syntactiquement correcte.

---

##  Conclusion

Ce guide donne à tes agents IA une base complète pour rédiger des questions conformes au format attendu par MathQuest.
