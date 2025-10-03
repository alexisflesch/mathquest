# Éditeur de Questions pour Enseignants

## Vue d'ensemble

L'éditeur de questions est une nouvelle page accessible aux enseignants via `/teacher/questions/edit`. Cette page permet de créer, modifier et gérer des questions au format YAML sans affecter la base de données live.

## Fonctionnalités

### Interface Utilisateur
- **Layout responsive** : 3 colonnes sur desktop, onglets empilés sur mobile
- **Édition YAML** : Éditeur Monaco avec coloration syntaxique
- **Édition formulaire** : Interface simplifiée avec sections repliables
- **Aperçu mobile** : Simulation d'écran de téléphone

### Gestion des Questions
- Ajout/suppression de questions avec génération automatique d'UID
- Synchronisation bidirectionnelle entre YAML et formulaire
- Sauvegarde automatique dans localStorage

### Import/Export
- Import de fichiers YAML par glisser-déposer ou sélection de fichier
- Export vers fichier YAML téléchargeable
- Copie du YAML dans le presse-papiers

## Architecture Technique

### Composants
- Page principale : `src/app/teacher/questions/edit/page.tsx`
- Utilise les types partagés : `@shared/types/quiz/question`

### Dépendances
- `@monaco-editor/react` pour l'édition YAML
- `js-yaml` pour le parsing
- `jest` pour les tests

### Sécurité
- Accès restreint aux utilisateurs avec rôle "Teacher" via middleware
- Pas de modification de la base de données

### Tests
- Couverture complète avec Jest
- Tests d'intégration pour les interactions utilisateur
- Mock de localStorage et Monaco Editor
- Tests de non-régression sur le mode YAML (`QuestionEditor.yaml-mode.test.tsx`) pour garantir qu'aucune normalisation automatique ne réécrit le YAML pendant la saisie

### Correctifs récents
- 2025-10-03 : désactivation de la normalisation automatique des métadonnées lorsque l'éditeur est en mode YAML afin d'éviter que la saisie manuelle (ex. mise à jour du champ `discipline`) ne réécrive tout le document. Voir `QuestionEditor.yaml-mode.test.tsx` pour le test de reproduction et `QuestionEditor.tsx` pour la mise à jour des garde-fous.

## Utilisation

1. Accéder à `/teacher/questions/edit`
2. Importer un fichier YAML existant ou créer de nouvelles questions
3. Éditer en mode YAML ou formulaire
4. Prévisualiser l'apparence sur mobile
5. Exporter le résultat

## Format YAML

```yaml
- uid: q123456
  text: "Quelle est la capitale de la France ?"
  questionType: multiple-choice
  answers:
    - text: Paris
      correct: true
    - text: Lyon
      correct: false
    - text: Marseille
      correct: false
```

## Évolutions Futures

- Support pour d'autres types de questions
- Validation de schéma YAML
- Partage par email
- Intégration avec l'API de questions