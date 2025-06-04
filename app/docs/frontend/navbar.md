
# Documentation UX : États de Navbar & Pages d'authentification

## 1. États de Navbar

### 1.1. Non connecté, pseudo/avatar **non définis**
- **Affichage** :
  ```
  ☰   🤖 ???
  ⚠️  Choisis ton pseudo
  🔐 Connexion / Création
  ```
- **Restrictions** :
  - Blocage de toutes les fonctionnalités principales.
  - Tooltip/toast : "Choisis ton pseudo pour commencer à jouer !"

---

### 1.2. Non connecté, pseudo/avatar **définis (joueur temporaire)**
- **Affichage** :
  ```
  ☰   🧑‍🚀 Pseudo123
  Accueil | Rejoindre un tournoi | 🔐 Connexion / Création
  ```
- **Restrictions** :
  - Pas de création de tournoi/quiz.
  - Peut rejoindre un tournoi via QR code.

---

### 1.3. Connecté (élève, compte complet)
- **Affichage** :
  ```
  ☰   🧑‍🚀 Pseudo123
  Accueil | Rejoindre | Entraînement | Créer tournoi | Mes tournois | Profil | Déconnexion
  ```
- **Accès** :
  - Toutes les fonctionnalités côté joueur débloquées.

---

### 1.4. Connecté (enseignant)
- **Affichage** :
  ```
  ☰   👨‍🏫 Pr Nom
  Accueil | Rejoindre | Entraînement | Créer tournoi | Mes tournois | Profil | Déconnexion
  ───────────────
  Espace enseignant
  Créer quiz | Gérer quiz | Mes stats | ...
  ```
- **Accès** :
  - Ajout de la section "Espace enseignant" visible uniquement si authentifié avec un mot de passe administrateur.

---

## 2. Page de login & accès

### 2.1. Deux routes distinctes
- `/quick-access?game=XYZ`
  - Utilisé après scan d’un QR code.
  - Affiche directement le formulaire pseudo/avatar.
  - Lien discret vers la page de login ("Déjà un compte ?")

- `/welcome` ou `/login`
  - Pour un usage standard / première visite.
  - Explication de l’application.
  - Proposition :
    - Jouer en invité (pseudo/avatar)
    - Créer un compte (email + mdp)
    - Créer un compte enseignant (mêmes champs + code admin)

---

## 3. Suggestions UI/UX supplémentaires

- **Avatar trop grand ?** Oui : le réduire en version navbar desktop.
- **Fusionner connexion/création** : ✅ à faire. Affichage unique "Connexion / Création de compte" avec toggle sur la page.
- **Affichage du pseudo invité** : préférable à "Invité", plus engageant.

---

## 4. Règle UX globale
Toujours prioriser une interface fluide dès la première visite, sans forcer la création de compte mais en l’encourageant après un premier contact réussi (ex : après un tournoi).

---

## 5. TODO techniques (dev)
- [ ] Créer un composant `NavbarService` capable de détecter l'état auth/enseignant/élève/invité.
- [ ] Router : `/quick-access` + `/login` séparés
- [ ] Blocage d’accès si pseudo/avatar non définis (guard ou middleware léger)
- [ ] Uniformiser la logique d’affichage dans le header (pseudo/avatar et actions associées)
