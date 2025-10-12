---
title: Questions L1 — Espaces vectoriels (aflesch)
---

Fichiers ajoutés:

- `questions/L1/mathématiques/aflesch/quiz/L1-math-aflesch-espaces-vectoriels-001.yaml` — conversion d'un ensemble d'exercices "todo.md" vers le format YAML de la base.
- `questions/L1/mathématiques/aflesch/quiz/L1-math-aflesch-espaces-vectoriels-extra.yaml` — suggestions de 4 questions additionnelles.

Conventions suivies:

- Notation mathématique: utilisez les délimiteurs inline `\(...\)` (pas `$...$`) afin d'être compatibles avec le rendu MathJax/KaTeX du site.
- Champs obligatoires par question: `uid`, `author`, `discipline`, `title`, `text`, `questionType`, `themes`, `tags`, `timeLimit`, `difficulty`, `gradeLevel`, `answerOptions` (ou `explanation` / `feedback` selon le type), `correctAnswers` pour QCM/QCU.
- Nomenclature `uid`: préfixe `aflesch-mt1-` + domaine + numéro séquentiel.
- Emplacement: placer les fichiers par auteur dans `questions/L1/<discipline>/<auteur>/quiz/`.

Remarques:

- J'ai conservé le style existant des autres fichiers YAML pour compatibilité.
- Les questions de type rédaction (`short_answer`) n'ont pas de `answerOptions` ni `correctAnswers`.

Pour toute question mal formulée, je peux proposer une reformulation plus concise et mathématiquement stricte — dites-moi lesquelles vous voulez améliorer en priorité.
