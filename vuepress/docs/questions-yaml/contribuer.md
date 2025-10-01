---
title: 🤝 Contribuer à la base commune de questions
---

# 🤝 Contribuer à la base commune de questions

Vous souhaitez enrichir la base de questions partagée de Kutsum (hébergée sur GitHub) ? Voici comment proposer vos propres questions et les rendre accessibles à tous.

👉 **Voir la base de questions sur GitHub :**

[https://github.com/alexisflesch/mathquest/tree/main/questions](https://github.com/alexisflesch/mathquest/tree/main/questions)

La structure des dossiers est organisée par **Niveau** (`CP`, `CE1`, ...), puis **Discipline**, puis éventuellement **thème** ou **auteur**.


## 📝 1. Préparer vos fichiers YAML
- Utilisez un éditeur de texte pour créer vos fichiers YAML. Préférez un éditeur qui supporte la coloration syntaxique YAML (comme VSCode, Sublime Text, etc.).
- Rédigez vos questions au format YAML en respectant la [structure officielle](./README.md).
- Utilisez les clés en anglais (`uid`, `text`, `answerOptions`, etc.), mais les valeurs (énoncés, thèmes, etc.) peuvent être en français.
- **L'`uid` doit être unique** : il doit commencer par le nom de l'auteur (ex : `dupont-6e-maths-fractions-001`). Ajoutez niveau, discipline, thème si besoin pour éviter toute collision.
- Vous pouvez mettre autant de questions que vous voulez dans un même fichier YAML.
- Faites-vous aider par un LLM ! En particulier si vous rencontrez des difficultés avec le texte sur plusieurs lignes, avec le LaTeX, la formulation des questions, etc.
- **Attention**: les sauts de ligne dans le yaml seront conservés dans l'affichage final ! C'est un parti pris pour éviter l'utilisation de balises HTML et pour simplifier l'expérience utilisateur lors de la rédaction des questions.


## 🚀 2. Proposer une contribution

Deux possibilités :
- **Contact direct (recommandé pour débuter)** : envoyez vos fichiers ou questions à alexis.flesch@gmail.com (idéal si vous n'êtes pas à l'aise avec GitHub).
- **Pull Request sur GitHub** :
    - Rendez-vous sur [le dépôt GitHub de Kutsum](https://github.com/aflesch/mathquest) et cliquez sur "Fork" pour créer votre copie personnelle.
    - Ajoutez vos fichiers YAML dans le bon dossier (`questions/6e/`, etc.), puis ouvrez une Pull Request vers la branche principale du dépôt d'origine. Décrivez brièvement votre contribution (niveau, thèmes, nombre de questions, etc.).


## 📂 3. Ajouter vos fichiers/questions

- Placez vos fichiers YAML dans le dossier approprié (ex : `questions/6e/`, `questions/test/`, etc.).
- Respectez l'organisation existante (un fichier par question ou un fichier pour un lot, selon le dossier).


## ✅ 4. Vérifier la validité

- Relisez soigneusement chaque question avant de proposer une contribution.
- Utilisez le script d'import local pour vérifier que vos fichiers sont valides et importables (dans `scripts/import_questions.py`).
- Utilisez éventuellement `scripts/yaml2latex.py` pour générer un PDF de vos questions et vérifier leur rendu. Vous pouvez appeler le script avec des arguments optionnels pour ne pas tout recompiler :
  ```bash
  python scripts/yaml2latex.py L2 mathématiques
  ```
- Assurez-vous que vos fichiers YAML sont bien formatés :
- Corrigez toute erreur de format ou de validation.


## 🔎 5. Revue et intégration

- Les mainteneurs vérifieront la qualité, la cohérence et l'absence de doublons.
- Après validation, vos questions seront intégrées à la base commune et disponibles pour tous !


## 🌟 6. Bonnes pratiques et conventions

Pour les niveaux, utilisez les noms standards : `CP`, `CE1`, ..., `L1`, `L2`, `L3`, `M1`, `M2`. Pour les disciplines, les thèmes et les "tags", vous pouvez vous référer aux menus déroulants ci-dessous. Si vous souhaitez améliorer la nomenclature ou proposer de nouveaux thèmes/tags, n'hésitez pas à le mentionner dans votre contribution.

<QuestionsExplorer />


**Merci pour votre contribution !**
