---
title: 👥 Mode Tournoi
---


## 👥 Vue d'ensemble

Le mode Tournoi permet d'organiser ou de rejoindre des compétitions mathématiques, en direct ou en différé, avec classement et feedback détaillé. Que vous soyez élève, enseignant ou invité, vous pouvez participer à un tournoi, suivre votre progression et consulter les résultats à tout moment.

## ⚙️ Fonctionnement

Le principe est similaire au mode Entraînement, mais avec quelques différences clés :
- Un timer est imposé pour chaque question : les élèves peuvent changer d'avis jusqu'à la fin du temps imparti.
- À la fin du timer, la bonne réponse et l'explication (si disponible) sont affichées, ainsi que le score obtenu pour la question.
- Un tableau des scores (highscores) est mis à jour et affiché à la fin de chaque question.
- Le tournoi peut être joué en direct (synchrone) ou en différé (asynchrone).

## 🛠️ Configuration du tournoi

Avant de commencer, configurez votre tournoi :
- **Niveau** : CP, CE1, etc.
- **Discipline** : Mathématiques, Physique, Chimie, etc.
- **Thème** : Algèbre, Géométrie, Calcul, etc.
- **Nombre de questions** : selon le tournoi choisi
- **Mode** : direct (synchrone) ou différé (asynchrone)

Partagez le code d’accès avec les participants pour qu’ils rejoignent le tournoi.

## ⏱️ Déroulement d’une session

Une fois le tournoi lancé :
- **Timer pour chaque question** : Les élèves répondent et peuvent modifier leur choix jusqu'à la fin du temps imparti.
- **Révélation des réponses** : À la fin du timer, la bonne réponse et l'explication (si disponible) sont affichées à tous les participants.
- **Scoring** : Un score est attribué à chaque élève selon ses réponses.
- **Classement en direct** : Un tableau des scores est mis à jour et affiché à la fin de chaque question.

<div class="screenshot-container">
  <img src="/screenshots/live-phone-light.png" alt="Interface tournoi en direct - Mode clair" class="theme-screenshot screenshot-light mobile-screenshot">
  <img src="/screenshots/live-phone-dark.png" alt="Interface tournoi en direct - Mode sombre" class="theme-screenshot screenshot-dark mobile-screenshot">
</div>

## 🏆 Tableau des scores et historique

À la fin du tournoi :
- Le classement final est enregistré dans la base de données.
- Les élèves peuvent consulter le tournoi dans la section "historique" et le rejouer en différé si souhaité.
- Les scores en différé sont ajoutés au tableau des highscores.

## 🔄 Mode différé (asynchrone)

En mode différé, les élèves peuvent rejouer un tournoi dans les mêmes conditions que le direct :
- Les mêmes questions, le même timer, le même déroulement.
- À la fin, leur score est noté comme score en différé et ajouté au classement.

Certaines questions sont accompagnées de feedbacks détaillés qui s’affichent à la fin de chaque question pendant un temps donné.