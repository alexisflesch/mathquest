
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


# Update page teacher/games prompt :

Please redesign the “My Activities” page with a clean, professional, and minimal layout.

**no hardcoded colors**: use colors from globals.css

Each activity should appear as a compact card with subtle visual separation. Prioritize readability and hierarchy over flashy colors or large buttons.

🔹 Activity Card Layout:
Top section:

Title (bold)

Optional level tag (e.g., “elementary”) — keep it small and neutral (e.g. muted text)

Small dropdown arrow on the right to expand/collapse

When collapsed: show just the title and metadata (e.g. created date, subject, themes)

When expanded:

Section: “Start Activity” with a single main button:

“Start Activity” → opens a modal or dropdown with:

Quiz

Tournament

Training

Secondary actions (ghost or text buttons):

Edit Model | Duplicate | Delete

🔹 Visual Style:
Neutral background, soft borders, subtle shadows

Compact spacing with clear hierarchy (e.g. bold titles, small metadata)

Buttons should be small or medium, not full-width unless necessary

Avoid bright or oversized buttons

No strong colored tags like big “elementary” badges

🔹 Overall Page:
Keep the “Create New Activity” button in the top-right corner, rounded and slightly more vibrant

Ensure mobile responsiveness with clean stacking

Consider a floating action button (FAB) for “Create Activity” on mobile instead of placing it in the header.