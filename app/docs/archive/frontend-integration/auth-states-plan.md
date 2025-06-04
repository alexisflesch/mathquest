# Plan d'Attaque : UX/UI Authentication States

_Date : 2 juin 2025_

## 🎯 Objectif

Implémenter un système d'authentification UX/UI complet avec 4 états distincts :
1. **Non connecté** (pseudo/avatar non définis)
2. **Invité** (pseudo/avatar définis + cookie d'identification)
3. **Étudiant** (compte complet avec email/mot de passe)
4. **Enseignant** (compte enseignant avec privilèges administrateur)

## 📊 État Actuel

### ✅ Ce qui existe déjà :
- **AuthProvider** fonctionnel avec détection teacher/student
- **AppNav** avec navigation dynamique
- **Page de connexion enseignant** (`/teacher/login`)
- **Page d'inscription enseignant** (`/teacher/signup`)
- **Page student** (`/student`) avec pseudo/avatar
- **API backend** d'authentification fonctionnelle

### 🚧 Ce qui manque :
- **4 états distincts** dans la navbar ✅ **TERMINÉ**
- **Page de connexion/création unifiée** (`/login`) ✅ **TERMINÉ** 
- **Gestion des comptes invités** (upgrade vers compte complet) ✅ **TERMINÉ**
- **Middleware d'accès** (guard si pseudo non défini) ✅ **TERMINÉ**

### 🎉 Améliorations apportées :
- **Page `/quick-access` fusionnée dans `/login`** - Design simplifié et plus intuitif
- **Support QR codes dans `/login?game=CODE`** - Redirection automatique vers `/live/CODE`
- **Menu navbar simplifié** pour les utilisateurs anonymes

## 🗺️ Plan d'Implémentation

### **Phase 1 : Extension de l'AuthProvider** 
**Durée estimée : 2-3h**

#### 1.1 Nouveaux types d'état
```typescript
type UserState = 
  | 'anonymous'           // Non connecté, pas de pseudo/avatar
  | 'guest'              // Pseudo/avatar définis, pas de compte
  | 'student'            // Compte étudiant complet
  | 'teacher'            // Compte enseignant

interface AuthContextType {
  userState: UserState;
  userProfile: {
    username?: string;
    avatar?: string;
    email?: string;
    role?: 'STUDENT' | 'TEACHER';
    userId?: string;
    cookieId?: string;    // Pour les invités
  };
  // ... méthodes existantes
}
```

#### 1.2 Logique de détection d'état
- **Anonymous** : Pas de localStorage mathquest_username
- **Guest** : localStorage présent mais pas de JWT valide
- **Student** : localStorage + JWT valide + role='STUDENT'
- **Teacher** : JWT valide + role='TEACHER'

#### 1.3 Méthodes à ajouter
```typescript
upgradeGuestToAccount(email: string, password: string): Promise<void>
setGuestProfile(username: string, avatar: string): void
clearGuestProfile(): void
```

### **Phase 2 : Refonte de la Navbar**
**Durée estimée : 3-4h**

#### 2.1 Nouveau composant `NavbarStateManager`
```typescript
// Components à créer
<AnonymousNavbar />      // État 1
<GuestNavbar />          // État 2  
<StudentNavbar />        // État 3
<TeacherNavbar />        // État 4
```

#### 2.2 Logique d'affichage par état
- **Anonymous** : Warning + lien connexion
- **Guest** : Avatar + pseudo + actions limitées
- **Student** : Navigation complète étudiant
- **Teacher** : Navigation + section enseignant

#### 2.3 Restrictions d'accès
- **Anonymous** : Bloquer toutes les fonctionnalités principales
- **Guest** : Bloquer création de quiz/tournoi
- **Student/Teacher** : Accès complet selon le rôle

### **Phase 3 : Pages d'authentification** ✅ **TERMINÉ**
**Durée estimée : 4-5h** ✅ **Réalisé avec amélioration**

#### 3.1 ~~Page d'accès rapide (`/quick-access`)~~ **SUPPRIMÉE** 
❌ **Approche initiale abandonnée au profit d'une solution plus élégante**

#### 3.2 Page de connexion/création unifiée (`/login`) ✅ **AMÉLIORÉE**
```typescript
export default function LoginPage() {
  // 3 modes avec toggle :
  // 1. Jouer en invité (pseudo/avatar)
  // 2. Connexion/Création compte étudiant  
  // 3. Connexion/Création compte enseignant
  
  // 🎉 NOUVEAUTÉ : Support QR codes
  // URL: /login?game=ABC123 → redirection vers /live/ABC123
}
```

#### 3.3 Composants partagés ✅ **TERMINÉ**
```typescript
<AuthModeToggle />       // Switch entre les 3 modes ✅
<GuestForm />           // Pseudo + Avatar ✅
<StudentAuthForm />     // Email + Password (login/signup) ✅  
<GuestUpgradeForm />    // Upgrade invité → étudiant ✅
```

### **Phase 4 : Middleware et Guards**
**Durée estimée : 2h**

#### 4.1 Route Guards
```typescript
// middleware.ts ou hook personnalisé
function useAccessGuard() {
  // Bloquer si userState === 'anonymous'
  // Rediriger vers /quick-access ou /login
}
```

#### 4.2 Guards par fonctionnalité
- **Création quiz/tournoi** : Require student/teacher
- **Accès dashboard enseignant** : Require teacher
- **Rejoindre jeu** : Require au minimum guest

### **Phase 5 : Backend Support**
**Durée estimée : 3h**

#### 5.1 Endpoint upgrade invité
```typescript
// POST /api/v1/auth/upgrade-guest
{
  cookieId: string,
  email: string, 
  password: string
}
// → Convertit le compte invité en compte étudiant
```

#### 5.2 Gestion des cookieId
- Générer cookieId unique pour les invités
- Lier les participations aux tournois
- Préserver l'historique lors de l'upgrade

### **Phase 6 : Tests et Polish**
**Durée estimée : 2-3h**

#### 6.1 Tests des flux
- [ ] Navigation QR code → quick-access → jeu
- [ ] Création compte invité → upgrade
- [ ] Connexion enseignant → dashboard
- [ ] Restrictions d'accès par état

#### 6.2 UX Polish
- [ ] Animations de transition entre états
- [ ] Messages d'information clairs
- [ ] Responsive design mobile
- [ ] Accessibilité (A11Y)

## 📁 Structure des Fichiers

```
frontend/src/
├── components/
│   ├── auth/
│   │   ├── AuthModeToggle.tsx
│   │   ├── GuestForm.tsx
│   │   ├── StudentAuthForm.tsx
│   │   ├── TeacherAuthForm.tsx
│   │   └── NavbarStates/
│   │       ├── AnonymousNavbar.tsx
│   │       ├── GuestNavbar.tsx
│   │       ├── StudentNavbar.tsx
│   │       └── TeacherNavbar.tsx
│   ├── AuthProvider.tsx         # [MODIFIÉ]
│   └── AppNav.tsx              # [MODIFIÉ]
├── app/
│   ├── quick-access/
│   │   └── page.tsx            # [NOUVEAU]
│   ├── login/
│   │   └── page.tsx            # [NOUVEAU]
│   └── middleware.ts           # [NOUVEAU]
├── hooks/
│   ├── useAccessGuard.ts       # [NOUVEAU]
│   └── useAuthState.ts         # [NOUVEAU]
└── types/
    └── auth.ts                 # [NOUVEAU]
```

## 🚨 Points d'Attention

### 1. **Compatibilité Backward**
- Ne pas casser l'authentification enseignant existante
- Préserver les données localStorage actuelles
- Migration douce des utilisateurs existants

### 2. **Sécurité**
- Validation côté backend des cookieId
- Pas de données sensibles en localStorage
- JWT sécurisés pour les comptes complets

### 3. **Performance**
- Lazy loading des composants navbar
- Optimisation des re-renders AuthProvider
- Cache intelligent des états d'auth

### 4. **UX Critical**
- Pas de blocage brutal des utilisateurs
- Messages d'erreur clairs et actionnables
- Parcours fluide QR code → jeu

## 📅 Timeline

| Phase | Durée | Milestone |
|-------|-------|-----------|
| **Phase 1** | 2-3h | AuthProvider étendu |
| **Phase 2** | 3-4h | Navbar avec 4 états |
| **Phase 3** | 4-5h | Pages auth complètes |
| **Phase 4** | 2h | Middleware guards |
| **Phase 5** | 3h | Backend support |
| **Phase 6** | 2-3h | Tests & polish |
| **TOTAL** | **16-20h** | **Feature complète** |

## 🏁 Critères de Succès

### MVP (Minimum Viable Product)
- [ ] 4 états de navbar fonctionnels
- [ ] Page quick-access opérationnelle
- [ ] Page login unifiée
- [ ] Transition invité → compte étudiant

### Version Complète
- [ ] Tous les guards d'accès implémentés
- [ ] UX polie et responsive
- [ ] Tests E2E passants
- [ ] Documentation utilisateur mise à jour

## 🔄 Ordre d'Implémentation Recommandé

1. **Commencer par Phase 1** (AuthProvider) - fondation critique
2. **Phase 3 en parallèle** (pages auth) - visible rapidement  
3. **Phase 2** (navbar) - utilise les résultats de Phase 1
4. **Phase 4 & 5** (guards & backend) - sécurisation
5. **Phase 6** (tests & polish) - finalisation

---

**Prêt à commencer par quelle phase ?** 🚀
