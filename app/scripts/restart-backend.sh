#!/bin/bash
# Redémarre le backend MathQuest avec pm2
# Usage: bash scripts/restart-backend.sh

cd "$(dirname "$0")/../backend/dist/backend/src" || exit 1

# Arrête l'ancienne instance si elle existe
pm2 delete mathquest-backend 2>/dev/null || true

# Démarre le backend
pm2 start server.js --name mathquest-backend

pm2 save

echo "Backend (server.js) redémarré avec pm2 sous le nom 'mathquest-backend'"
