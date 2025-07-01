#!/bin/bash
# Démarre le backend (pm2) et le frontend Next.js (serveur) pour MathQuest
# Backend: port 3007, Frontend: port 3008
# Usage: bash start-all.sh

set -e

# 1. Démarrer/redémarrer le backend
cd "$(dirname "$0")/backend/dist/backend/src" || exit 1
pm2 delete mathquest-backend 2>/dev/null || true
pm2 start server.js --name mathquest-backend --env production
pm2 save
echo "Backend (server.js) démarré avec pm2 sur le port 3007 (voir .env)"

# 2. Démarrer le frontend Next.js en mode serveur (port 3008)
cd "$(dirname "$0")/frontend" || exit 1
if ! command -v npx &> /dev/null; then
  echo "npx n'est pas installé. Installez Node.js et npm."
  exit 1
fi
# On force le port 3008 (priorité à .env.local si présent)
export PORT=3008
npx next start --port 3008 &
FRONTEND_PID=$!
echo "Frontend Next.js démarré sur http://localhost:3008 (mode serveur)"

echo "Les deux services sont lancés. (backend:3007, frontend:3008)"
wait $FRONTEND_PID
