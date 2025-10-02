# Liens

- [Landing page](https://www.kutsum.org)
- [Application](https://app.kutsum.org)
- [Documentation](https://docs.kutsum.org)

# Kutsum

**Kutsum** est une application de quiz en temps réel **libre et gratuite**, pensée pour faciliter les révisions et dynamiser les cours. Elle s'inspire de Kahoot, mais avec une philosophie de partage des ressources, sans collecte de données ni marketing.

> ✨ **Tagline** — *« L'appli de révisions qui n'en fait qu'à sa tête »*

👩‍🏫 **Pour les enseignants** : créez des sessions de quiz, affichez les résultats en direct, organisez des compétitions en classe, et profitez d'une base de données partagée que vous pouvez enrichir.

🧑‍🎓 **Pour les élèves** : entraînez-vous seul·e ou défiez vos amis dans des tournois, sans inscription obligatoire.

> ℹ️ Les identifiants techniques, noms de base de données et clés d'environnement conservent encore le préfixe `mathquest` pour garantir une migration progressive et sans risque.

## ✨ Fonctionnalités principales

- 🌀 **Quiz interactifs en temps réel** - Préparez des questions en les récupérant dans la base partagée puis utilisez-les en classe
- 👥 **Système de tournois** - Les élèves peuvent organiser des tournois entre eux sur des thèmes de leur choix
- 🏋️‍♂️ **Mode entraînement individuel** - Les élèves peuvent s'entraîner en autonomie, sans timer ni classement
- 📱 **Interface responsive** - Fonctionne parfaitement sur mobile, tablette et ordinateur
- 🔧 **Libre et personnalisable** - Code source ouvert, hébergement autonome
- 📐 **Support LaTeX complet** - Parfait pour les enseignants de mathématiques

## 🛠️ Technologies utilisées

### Frontend
- **Next.js 15** - Framework React moderne avec App Router
- **React 19** - Bibliothèque de composants avec hooks avancés
- **TypeScript** - Typage strict pour la sécurité du code
- **Tailwind CSS** - Framework CSS utilitaire
- **Socket.IO Client** - Communication temps réel
- **Framer Motion** - Animations fluides

### Backend
- **Node.js** - Runtime JavaScript côté serveur
- **Express.js** - Framework web minimaliste
- **Socket.IO** - Communication bidirectionnelle temps réel
- **Prisma** - ORM moderne pour PostgreSQL
- **TypeScript** - Typage strict end-to-end
- **Zod** - Validation des données runtime

### Base de données & Cache
- **PostgreSQL** - Base de données relationnelle robuste
- **Redis** - Cache haute performance et sessions
- **Prisma** - Schéma de base de données type-safe

### Tests & Qualité
- **Jest** - Framework de tests unitaires et d'intégration
- **Playwright** - Tests end-to-end automatisés
- **ESLint** - Linting et qualité du code
- **TypeScript** - Vérification de types statique

## 📊 Métriques de qualité

- **🧪 Tests unitaires** : 532 tests (Backend: 173, Frontend: 359)
- **🔄 Tests E2E** : 27 tests automatisés
- **📏 Couverture** : TypeScript strict mode activé
- **🏗️ Build** : Compilation sans erreur
- **📱 Responsive** : Support complet mobile/tablette

## 🚀 Accès rapide

- 🌐 **[Essayer l'application](https://app.kutsum.org)** - Version en ligne (non garantie de stabilité)
- 📖 **[Documentation utilisateur](https://alexisflesch.github.io/mathquest/)** - Guide complet d'utilisation (URL bientôt migrée)
- ⚙️ **[Guide d'installation](https://alexisflesch.github.io/mathquest/installation/)** - Hébergement autonome
- ✏️ **[Écriture de questions](https://alexisflesch.github.io/mathquest/questions-yaml/)** - Format YAML pour les questions

## 📦 Installation

```bash
# Cloner le dépôt
git clone https://github.com/alexisflesch/mathquest.git
cd mathquest/app

# Installer les dépendances
npm install

# Configuration des variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Initialiser la base de données
cd backend
npx prisma migrate dev
npx prisma db seed

# Lancer l'application
cd ..
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:3008
- Backend : http://localhost:3007

## 🤝 Contribution

MathQuest est un projet open source sous licence GPL v3. Les contributions sont les bienvenues !

- 🐛 **Signaler un bug** : [Issues GitHub](https://github.com/alexisflesch/mathquest/issues)
- 💡 **Proposer une fonctionnalité** : [Discussions GitHub](https://github.com/alexisflesch/mathquest/discussions)
- 🔧 **Contribuer du code** : Forkez et créez une pull request

## 📄 Licence

Ce projet est distribué sous licence [GPL v3](https://www.gnu.org/licenses/gpl-3.0.html).

## ⚠️ Note importante

La version en ligne que j'héberge sur ma page web n'est pas forcément stable et aucune garantie n'est faite quant à la pérennité des données (sauf la base de questions partagée). L'application est fournie sans aucune garantie de bon fonctionnement ou de disponibilité.

Si vous ne souhaitez pas accéder aux dernières fonctionnalités, je vous recommande d'installer une version stable sur votre propre serveur. Faites-vous aider par un LLM pour l'installation si besoin !

---

**Développé avec ❤️ par [Alexis Flesch](https://hire.alexisfles.ch)**