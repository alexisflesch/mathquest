---
title: Écriture de questions (YAML)
---



# Rédiger des questions au format YAML

> Cette page explique comment rédiger des questions pour MathQuest au format YAML, en utilisant les noms de champs **anglais** (cohérence avec le code). Les valeurs et la documentation sont en français.



## Exemple minimal (champs obligatoires)

```yaml
uid: "Q-0001"
text: "Quelle est la capitale de la France ?"
questionType: "single_choice"
discipline: "géographie"
themes: ["Europe", "France"]
answerOptions:
  - "Paris"
  - "Londres"
  - "Berlin"
  - "Madrid"
correctAnswers: [true, false, false, false]
difficulty: 1
gradeLevel: "6e"
```


## Exemple complet (toutes options)

Ci-dessous un exemple complet avec toutes les clefs possibles ainsi que la syntaxe à utiliser pour écrire un champ sur plusieurs lignes.

```yaml
uid: "Q-0002"
title: "Capitale européenne"
text: |
  Dans quelle ville se trouve le siège du gouvernement allemand ?

  Un indice ? Cette ville est aussi la capitale du pays, et elle a été 
  divisée pendant la guerre froide.
questionType: "multiple_choice"
discipline: "géographie"
themes: ["Europe", "Allemagne"]
difficulty: 2
gradeLevel: "5e"
author: "Mme Dupont"
explanation: "Berlin est la capitale depuis 1990."
tags: ["capitale", "Europe", "histoire"]
timeLimit: 30
isHidden: false
answerOptions:
  - "Munich"
  - "Berlin"
  - "Francfort"
  - "Hambourg"
correctAnswers: [false, true, false, false]
feedbackWaitTime: 5
```



## Référence des champs YAML

| Champ             | Type      | Obligatoire | Description |
|-------------------|-----------|-------------|-------------|
| `uid`             | string    | oui         | Identifiant unique de la question (fourni par l'utilisateur) |
| `title`           | string    | non         | Titre court (optionnel mais recommandé) |
| `text`            | string    | oui         | Énoncé de la question (en français ou autre) |
| `questionType`    | string    | oui         | `multiple_choice` ou `single_choice` |
| `discipline`      | string    | oui         | Discipline (ex : `mathématiques`, `géographie`) |
| `themes`          | string[]  | oui         | Liste de thèmes (en français ou anglais) |
| `difficulty`      | int       | oui         | Niveau de difficulté (entier, obligatoire) |
| `gradeLevel`      | string    | oui         | Niveau scolaire (ex : `5e`, `Terminale`, obligatoire) |
| `author`          | string    | non         | Auteur de la question |
| `explanation`     | string    | non         | Explication affichée après la réponse |
| `tags`            | string[]  | non         | Liste de tags |
| `timeLimit`       | int       | non         | Limite de temps en secondes |
| `isHidden`        | boolean   | non         | Si vrai, la question est cachée aux élèves |
| `answerOptions`   | string[]  | oui*        | Liste des propositions (obligatoire pour multiple_choice) |
| `correctAnswers`  | bool[]    | oui*        | Tableau de booléens, un par proposition |
| `feedbackWaitTime`| int       | non         | Temps (secondes) d'affichage de l'explication |


- Le champ `timeLimit` correspond à la durée du chrono (en secondes) pour la question. Evitez les durées trop longues (plus de 30 secondes) car les élèves doivent attendre la fin du chrono pour passer à la question suivante ! Ou alors, ajoutez le paramètre `isHidden` pour que la question ne soit pas affichée aux élèves en mode "tournoi" ou "entraînement" (cf ci-dessous).

- Le champ `isHidden` permet de "cacher" une question aux élèves. Autrement dit, lorsqu'ils travailleront en mode "tournoi" ou "entraînement", cette question ne sera jamais affichée. Cela peut être utile pour des questions trop difficiles, hors programme, ou qui nécessitent un grand temps de réflexion (donc bien pour un quiz en classe, mais pas pour un entraînement autonome).

- le champ `feedbackWaitTime` a une valeur par défaut de 5 secondes. C'est le temps pendant lequel l'explication restera affichée après la fin du chrono.

---

## Écrire des formules mathématiques avec LaTeX

Vous pouvez insérer des formules mathématiques dans vos questions, réponses ou explications en utilisant la syntaxe LaTeX (compatible MathJax).

- Pour une formule en ligne :
  ```markdown
  \(E = mc^2\)
  ```
- Pour une formule centrée (affichage bloc) :
  ```markdown
  \[
  \int_0^1 x^2 dx = \frac{1}{3}
  \]
  ```

Les "anciens" délimiteurs de LaTeX (`$$` et `$`) **ne sont pas supportés** pour éviter les conflits avec le symbole dollar qui pourrait être utilisé dans les réponses (en particulier dans les matières non scientifiques où les enseignants ignorent l'existence de LaTeX). N'importe quel chatbot est capable de convertir ces délimiteurs en `\(...\)` ou `\[...\]` si nécessaire, ou de vous aider à le faire avec des expressions régulières.

Toutes les zones de texte (`text`, `answerOptions`, `explanation`, etc.) acceptent le LaTeX.


---

**Importer des questions :**
- Placez vos fichiers YAML dans le dossier prévu à cet effet.
- Utilisez le script d'import fourni pour les charger en base.
