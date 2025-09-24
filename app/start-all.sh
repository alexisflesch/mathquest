#!/bin/bash
# Démarre le backend (pm2) et le frontend Next.js (serveur) pour MathQuest
# Backend: port 3007, Frontend: port 3008
# Usage: bash start-all.sh
#
# Configuration:
# - Frontend: Minimal logging with memory limits (256MB)
# - Backend: Memory-optimized with monitoring (512MB)
# - Logs: Stored in ./logs/ directory
# - Memory restart limits: 1GB (backend), 1GB (frontend)

set -e



# Démarrage centralisé via ecosystem.config.js
pm2 delete mathquest-backend 2>/dev/null || true
pm2 delete mathquest-frontend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "Les deux services (backend:3007, frontend:3008) sont lancés et gérés par pm2 via ecosystem.config.js."
echo "Utilisez 'pm2 status' pour vérifier, 'pm2 restart mathquest-backend' ou 'pm2 restart mathquest-frontend' pour relancer."
