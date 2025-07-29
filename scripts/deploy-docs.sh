#!/bin/bash
# Déploiement automatique de la doc VuePress sur GitHub Pages
# Usage : ./deploy-docs.sh

set -e

# Répertoire racine du projet (parent de scripts)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Génération des fichiers JSON nécessaires
python3 "$(dirname "$0")/generate_json.py"

BUILD_DIR="$PROJECT_ROOT/vuepress/docs/.vuepress/dist"
REPO_URL="https://github.com/alexisflesch/mathquest.git"
BRANCH="gh-pages"
ORIGIN_DIR="$(pwd)"

# Se déplacer dans le répertoire vuepress pour exécuter npm
cd "$PROJECT_ROOT/vuepress"

# Build la doc
npm run docs:build

# Copie manuelle du logo et du favicon si besoin (contournement bug VuePress)
if [ -f "$PROJECT_ROOT/vuepress/docs/public/assets/logo.svg" ]; then
  cp "$PROJECT_ROOT/vuepress/docs/public/assets/logo.svg" "$BUILD_DIR/assets/logo.svg"
fi
if [ -f "$PROJECT_ROOT/vuepress/docs/public/favicon.ico" ]; then
  cp "$PROJECT_ROOT/vuepress/docs/public/favicon.ico" "$BUILD_DIR/favicon.ico"
fi

cd "$BUILD_DIR"
git init
git remote add origin "$REPO_URL" || true
git checkout -b $BRANCH
git add .
git commit -m "deploy vuepress docs"
git push -f origin $BRANCH

cd "$ORIGIN_DIR"
echo -e "\\nDéploiement terminé !"
echo "La documentation est accessible à : https://alexisflesch.github.io/mathquest/"