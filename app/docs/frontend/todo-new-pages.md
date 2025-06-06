
# 📚 Spécifications UI — Interface Enseignant

## 1. 🧠 Mes activités

Liste compacte avec possibilité d’agir sur chaque activité.

```
+-----------------------------------------------------------+
|                🌟 Mes activités (Mes quiz)               |
+-----------------------------------------------------------+
| 📘 Fractions niveau 6e                                     |
|     ↳ [📝 Éditer] [🚀 Démarrer une session] [📄 Dupliquer] [🗑️ Supprimer]         |
|     ↳ Sessions :                                          |
|        - 👥 6eA - 8 juin 2025 (code : 529138) [👁️ Voir] [📦 Archiver]         |
|        - 👥 6eB - 8 juin 2025 (code : 201893) [👁️ Voir] [📦 Archiver]         |
+-----------------------------------------------------------+
| 📘 Les équations (niveau 4e)                              |
|     ↳ [📝 Éditer] [🚀 Démarrer une session] [📄 Dupliquer] [🗑️ Supprimer]         |
|     ↳ Sessions : (aucune)                                 |
+-----------------------------------------------------------+
```

⚙️ Comportement :
- Les activités sont **repliables (collapse)** pour gagner de la place.
- Les sessions archivées sont masquées par défaut.
- Bouton "Démarrer une session" permet de choisir entre tournoi ou quiz en classe.

---

## 2. ➕ Créer une activité

Interface simple en 3 étapes :

```
+-----------------------------------------------------------+
|               ➕ Créer une activité (quiz)                |
+-----------------------------------------------------------+
| 🔍 Filtrage des questions                                |
|  [discipline] [niveau] [tag] [auteur] [champ recherche]   |
|-----------------------------------------------------------|
| ☑️ Liste des questions disponibles à sélectionner        |
|   [✔] Q1 — Sur les puissances                            |
|   [ ] Q2 — Produit de fractions                          |
|   [✔] Q3 — Résoudre une équation simple                  |
+-----------------------------------------------------------+
| 🧺 Panier : Aperçu des questions choisies                |
|   1. Q1 — ⏱️ 30s [↑↓] [🗑️]                                |
|   2. Q3 — ⏱️ 45s [↑↓] [🗑️]                                |
|   [➕ Ajouter manuellement une question]                   |
|-----------------------------------------------------------|
| ✅ [Enregistrer]                                         |
+-----------------------------------------------------------+
```

---

## 3. ✏️ Éditer une activité

Même interface que "Créer une activité", **avec les champs déjà remplis**.
Ajout d’un bouton **[💾 Enregistrer les modifications]**.

---

## 📁 Structure à retenir

- `Mes activités` = toutes les activités enregistrées (≠ sessions)
- Chaque activité peut donner lieu à plusieurs sessions (codes d’accès)
- On peut archiver les anciennes sessions pour aérer l’UI

---

## 🛠️ Routes suggérées

- `/teacher/activities` → Mes activités
- `/teacher/activities/new` → Créer une activité
- `/teacher/activities/:id/edit` → Éditer une activité

