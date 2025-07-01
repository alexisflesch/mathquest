#!/bin/bash
# Démarre le backend (pm2) et le frontend Next.js (serveur) pour MathQuest
# Backend: port 3007, Frontend: port 3008
# Usage: bash start-all.sh

set -e


# 1. Démarrer/redémarrer le backend avec pm2
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/backend/dist/backend/src" || exit 1
pm2 delete mathquest-backend 2>/dev/null || true
pm2 start server.js --name mathquest-backend --env production
echo "Backend (server.js) démarré avec pm2 sur le port 3007 (voir .env)"

# 2. Démarrer/redémarrer le frontend Next.js avec pm2 (méthode robuste)
cd "$SCRIPT_DIR/frontend" || exit 1
pm2 delete mathquest-frontend 2>/dev/null || true
pm2 start node --name mathquest-frontend --cwd "$SCRIPT_DIR/frontend" -- ./node_modules/next/dist/bin/next start -p 3008
echo "Frontend Next.js démarré avec pm2 sur le port 3008 (mode serveur, méthode node direct)"

# 3. Sauvegarder la configuration pm2
pm2 save

echo "Les deux services sont lancés et gérés par pm2. (backend:3007, frontend:3008)"
echo "Utilisez 'pm2 status' pour vérifier, 'pm2 restart mathquest-backend' ou 'pm2 restart mathquest-frontend' pour relancer."
