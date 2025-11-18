---
title: 🤝 Contribuer à la base commune de questions
---

# 🤝 Contribuer à la base commune de questions

Vous souhaitez enrichir la base de questions partagée de Kutsum (hébergée sur GitHub) ? Voici comment proposer vos propres questions et les rendre accessibles à tous.

👉 **Voir la base de questions sur GitHub :**

[https://github.com/alexisflesch/mathquest/tree/main/questions](https://github.com/alexisflesch/mathquest/tree/main/questions)

La structure des dossiers est organisée par **Niveau** (`CP`, `CE1`, ...), puis **Discipline**, puis éventuellement **thème** ou **auteur**.

## 📝 1. Préparer vos questions

**Méthode recommandée : Interface web**
- Connectez-vous à l'application Kutsum en tant qu'enseignant
- Utilisez l'[éditeur de questions intégré](./README.md#méthode-recommandée-interface-web) pour créer vos questions facilement
- Exportez vos questions au format YAML une fois terminées

**Méthode alternative : Édition YAML directe**
- Utilisez un éditeur de texte pour créer vos fichiers YAML (recommandé pour VSCode avec extension YAML)
- Rédigez vos questions au format YAML en respectant la [structure officielle](./README.md#exemples-par-type-de-question-yaml)


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

**Validation via interface web (recommandé)**
- Importez vos questions YAML dans l'interface web pour vérification automatique
- L'éditeur détecte les erreurs et propose des corrections
- Utilisez l'aperçu pour vérifier le rendu final

**Validation manuelle**
- Utilisez le script d'import local pour vérifier que vos fichiers sont valides (`scripts/import_questions.py`)
- Utilisez `scripts/yaml2latex.py` pour générer un PDF et vérifier le rendu :
  ```bash
  python scripts/yaml2latex.py L2 mathématiques
  ```
- Assurez-vous que vos fichiers YAML sont bien formatés et respectent la structure


## 🔎 5. Revue et intégration

- Les mainteneurs vérifieront la qualité, la cohérence et l'absence de doublons.
- Après validation, vos questions seront intégrées à la base commune et disponibles pour tous !


## 🌟 6. Bonnes pratiques et conventions

Pour les niveaux, utilisez les noms standards : `CP`, `CE1`, ..., `L1`, `L2`, `L3`, `M1`, `M2`. Pour les disciplines, les thèmes et les "tags", vous pouvez vous référer aux menus déroulants ci-dessous.

**⚠️ Important** : Si vous avez besoin d'un niveau scolaire, d'une discipline, d'un thème ou d'un tag qui n'existe pas encore, contactez un administrateur du système. La taxonomie est gérée de manière centralisée pour assurer la cohérence de toute la base de questions.

<QuestionsExplorer />


**Merci pour votre contribution !**
