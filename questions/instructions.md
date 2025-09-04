# Instructions pour un agent IA : rédiger des questions au format YAML pour MathQuest

Objectif

- Produire des fichiers YAML contenant une ou plusieurs questions conformes au format attendu par MathQuest.
- Respecter les conventions de nommage, les champs obligatoires et les bonnes pratiques observées dans le dépôt.

Principes généraux

- Les clés YAML doivent être en anglais (par ex. `uid`, `text`, `questionType`).
- Les valeurs textuelles (énoncés, thèmes, tags, explications) doivent être en français.
- Les fichiers se placent dans le dossier `questions/` sous le niveau scolaire approprié (ex : `CP`, `L1`, `L2`).
- Utiliser la syntaxe YAML plain/flow standard ; pour des textes multi-lignes utiliser le bloc `|`.
- Les formules mathématiques doivent utiliser LaTeX compatible MathJax. Utiliser `\(...\)` pour inline et `\[ ... \]` pour les blocs. Ne pas employer `$$...$$` ou `$...$`.

Champs requis et recommandés

- `uid` (string) - Obligatoire. Identifiant unique. Convention suggérée : `auteur-niveau-sujet-XXX` (ex : `dupont-6e-fractions-001`).
- `text` (string) - Obligatoire. Énoncé de la question. Pour plusieurs paragraphes utiliser `|`.
- `questionType` (string) - Obligatoire. Un des : `single_choice`, `multiple_choice`, `numeric`.
- `discipline` (string) - Obligatoire. Exemple : `mathématiques`, `français`.
- `themes` (array[string]) - Obligatoire. Liste des thèmes.
- `difficulty` (int) - Obligatoire. Entier indiquant la difficulté (1,2,3...).
- `gradeLevel` (string) - Obligatoire. Niveau scolaire (ex : `CP`, `L1`).
- `answerOptions` (array[string]) - Obligatoire pour `single_choice` et `multiple_choice`.
- `correctAnswers` (array[bool]) - Obligatoire pour `single_choice` et `multiple_choice`. Doit avoir la même longueur que `answerOptions`.
- `correctAnswer` (number) - Obligatoire pour `numeric`.

Champs optionnels fréquemment utilisés

- `title` (string) - Titre court.
- `author` (string) - Auteur.
- `tags` (array[string]) - Mots-clés non hiérarchiques.
- `explanation` (string) - Explication affichée après la réponse.
- `timeLimit` (int) - Durée en secondes.
- `tolerance` (number) - Pour `numeric` questions.
- `excludedFrom` (array[string]) - Modes exclus (ex : `tournament`, `practice`).
- `feedbackWaitTime` (int) - Durée d'affichage de l'explication.

Conventions et validations automatiques à effectuer

- `uid` doit être unique dans le fichier et idéalement globalement unique. Ajouter un préfixe auteur pour réduire les collisions.
- Pour `single_choice`, `correctAnswers` doit contenir exactement un `true`.
- Pour `multiple_choice`, `correctAnswers` peut contenir plusieurs `true`.
- Les longueurs de `answerOptions` et `correctAnswers` doivent correspondre.
- Pour `numeric`, `correctAnswer` doit être un nombre (entier ou flottant). `tolerance` si présent doit être >=0.
- Les thèmes/discipline doivent correspondre aux conventions du dépôt (ex : `mathématiques` avec accent, ou `Mathematics` selon dossier existant). Si incertain, copier exactement la casse/orthographe observée dans les exemples.

Exemples

- single_choice

```yaml
- uid: "dupont-6e-fractions-001"
  author: "dupont"
  gradeLevel: "6e"
  discipline: "mathématiques"
  themes: ["fractions"]
  title: "Addition de fractions"
  questionType: "single_choice"
  difficulty: 1
  timeLimit: 60
  text: |
    Calculer : \(\frac{1}{2} + \frac{1}{3} = ?\)
  answerOptions:
    - "\(\frac{5}{6}\)"
    - "\(\frac{2}{5}\)"
    - "\(\frac{3}{4}\)"
    - "Aucune des réponses ci-dessus"
  correctAnswers: [true, false, false, false]
```

- numeric

```yaml
- uid: "dupont-6e-calcul-001"
  questionType: "numeric"
  discipline: "mathématiques"
  gradeLevel: "6e"
  themes: ["calcul mental"]
  text: "Combien font 2 + 2 ?"
  correctAnswer: 4
  tolerance: 0
```

Consignes de style

- Préférer des énoncés concis et un langage clair.
- Pour les listes d'options, inclure une option "Aucune des réponses ci-dessus" si pertinent.
- Limiter la longueur des `answerOptions` pour une bonne lisibilité sur mobile.
- Pour les formules LaTeX, vérifier l'affichage en mode aperçu (MathJax).

Checklist avant finalisation (doit être cochée par l'agent IA)

- [ ] Le YAML est valide (parser YAML OK).
- [ ] `uid` respecte la convention et n'introduit pas de doublon dans le fichier.
- [ ] Tous les champs obligatoires sont présents.
- [ ] Longueur de `answerOptions` == longueur de `correctAnswers` (pour choix multiples).
- [ ] `questionType` correspond à la structure fournie (`numeric` vs `single/multiple_choice`).
- [ ] Les formules LaTeX sont entre `\\(...\\)` ou `\\[\\]`.

Comment livrer

- Placer les fichiers sous `questions/<NIVEAU>/...`.
- Nommer le fichier avec un préfixe indiquant l'auteur et un thème court si possible.
- Fournir un bref commentaire ou `README` si plusieurs fichiers sont ajoutés.

Notes sur l'utilisation de l'agent

- Si tu n'es pas sûr d'une orthographe/nom de thème, reproduis la casse et l'orthographe des exemples existants.
- En cas de doute sur une formulation pédagogique, propose deux variantes (courte / détaillée) et laisse le choix à l'éditeur humain.

---

Fichier généré automatiquement : `questions/instructions.md` - rédigé à partir de la doc `vuepress/docs/questions-yaml/README.md` et d'exemples existants dans `questions/`.
 
 Niveaux autorisés et fichier de nomenclature
 
 - Niveaux standards acceptés : `CP`, `CE1`, `CE2`, `CM1`, `CM2`, `6e`, `5e`, `4e`, `3e`, `2de`, `1re`, `Terminale`, `L1`, `L2`, `L3`, `M1`, `M2`.
 - Les fichiers de nomenclature (disciplines / thèmes / tags) se trouvent à la racine du dossier `questions/` sous la forme `CP.yaml`, `CE1.yaml`, `L1.yaml`, etc. Exemple : `questions/CP.yaml`.
 - Lors de la validation automatique, l'agent doit charger le fichier `questions/<grade>.yaml` (par ex. `questions/L1.yaml`) pour vérifier que la `discipline`, les `themes` et les `tags` mentionnés existent et respecter la casse exacte.
