#!/bin/bash
# Déploiement automatique de la doc VuePress sur GitHub Pages
# Usage : ./deploy-docs.sh

set -e

BUILD_DIR="$(cd "$(dirname "$0")" && pwd)/docs/.vuepress/dist"
REPO_URL="https://github.com/alexisflesch/mathquest.git"
BRANCH="gh-pages"
ORIGIN_DIR="$(pwd)"

 # Build la doc
npm run docs:build


# Copie manuelle du logo et du favicon si besoin (contournement bug VuePress)
cp "$(cd "$(dirname "$0")" && pwd)/docs/public/assets/logo.svg" "$BUILD_DIR/assets/logo.svg"
if [ -f "$(cd "$(dirname "$0")" && pwd)/docs/public/favicon.ico" ]; then
  cp "$(cd "$(dirname "$0")" && pwd)/docs/public/favicon.ico" "$BUILD_DIR/favicon.ico"
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