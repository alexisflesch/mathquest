---
title: Contribuer à la base commune de questions
---


# Contribuer à la base commune de questions

Vous souhaitez enrichir la base de questions partagée de MathQuest (hébergée sur GitHub) ? Voici comment proposer vos propres questions et les rendre accessibles à tous.

👉 **Voir la base de questions sur GitHub :**
[https://github.com/alexisflesch/mathquest/tree/main/questions](https://github.com/alexisflesch/mathquest/tree/main/questions)

La structure des dossiers est organisée par **Niveau** (`6e`, `5e`, ...), puis **Discipline**, puis éventuellement **thème** ou **auteur**.


## 1. Préparer vos fichiers YAML
- Utilisez un éditeur de texte pour créer vos fichiers YAML. Préférez un éditeur qui supporte la coloration syntaxique YAML (comme VSCode, Sublime Text, etc.).
- Rédigez vos questions au format YAML en respectant la [structure officielle](/questions-yaml/).
- Utilisez les clés en anglais (`uid`, `text`, `answerOptions`, etc.), mais les valeurs (énoncés, thèmes, etc.) peuvent être en français.
- **L'`uid` doit être unique** : il doit commencer par le nom de l'auteur (ex : `dupont-6e-maths-fractions-001`). Ajoutez niveau, discipline, thème si besoin pour éviter toute collision.
- Vous pouvez mettre autant de questions que vous voulez dans un même fichier YAML.


## 2. Proposer une contribution

- Deux possibilités :
  - **Contact direct (recommandé pour débuter)** : envoyez vos fichiers ou questions à alexis.flesch@gmail.com (idéal si vous n'êtes pas à l'aise avec GitHub).
  - **Pull Request sur GitHub** :
    - Rendez-vous sur [le dépôt GitHub de MathQuest](https://github.com/aflesch/mathquest) et cliquez sur "Fork" pour créer votre copie personnelle.
    - Ajoutez vos fichiers YAML dans le bon dossier (`questions/6e/`, etc.), puis ouvrez une Pull Request vers la branche principale du dépôt d'origine. Décrivez brièvement votre contribution (niveau, thèmes, nombre de questions, etc.).


## 3. Ajouter vos fichiers/questions

- Placez vos fichiers YAML dans le dossier approprié (ex : `questions/6e/`, `questions/test/`, etc.).
- Respectez l'organisation existante (un fichier par question ou un fichier pour un lot, selon le dossier).


## 4. Vérifier la validité

- Relisez soigneusement chaque question avant de proposer une contribution.
- Utilisez le script d'import local pour vérifier que vos fichiers sont valides et importables (voir la doc principale).
- Corrigez toute erreur de format ou de validation.


## 5. Proposer une contribution

- Deux possibilités :
  - **Pull Request sur GitHub** : depuis votre fork, ouvrez une Pull Request vers la branche principale du dépôt d'origine. Décrivez brièvement votre contribution (niveau, thèmes, nombre de questions, etc.).
  - **Contact direct** : envoyez vos fichiers ou questions à alexis.flesch@gmail.com (idéal pour les débutants ou si vous n'êtes pas à l'aise avec GitHub).


## 6. Revue et intégration

- Les mainteneurs vérifieront la qualité, la cohérence et l'absence de doublons.
- Après validation, vos questions seront intégrées à la base commune et disponibles pour tous !

## 7. Bonnes pratiques et conventions

- Il n'existe pas encore de liste officielle de niveaux/disciplines/thèmes/tags, mais vous pouvez consulter la partie "Créer une activité" de l'application pour voir les valeurs existantes (menus déroulants).
- Pour les niveaux, utilisez les noms standards : `6e`, `5e`, ..., `L1`, `L2`, `L3`, `M1`, `M2`.


**Merci pour votre contribution !**
