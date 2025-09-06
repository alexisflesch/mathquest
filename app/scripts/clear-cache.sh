#!/bin/bash

# Quick Service Worker Cache Clear Script
# Use this when you encounter PWA cache issues

set -e

echo "🧹 Clearing service worker and build cache..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$APP_ROOT"

echo "📁 Working in: $APP_ROOT"

# Stop PM2 processes if running
if command -v pm2 >/dev/null 2>&1; then
    echo "⏹️  Stopping PM2 processes..."
    pm2 stop mathquest-frontend 2>/dev/null || echo "Frontend not running"
    pm2 stop mathquest-backend 2>/dev/null || echo "Backend not running"
fi

# Clear frontend cache and service worker files
echo "🗑️  Clearing frontend cache..."
cd "$APP_ROOT/frontend"

# Remove Next.js build cache
rm -rf .next 2>/dev/null || true

# Remove service worker files
rm -f public/sw.js 2>/dev/null || true
rm -f public/sw.js.map 2>/dev/null || true
rm -f public/workbox-*.js 2>/dev/null || true

# Clear node_modules/.cache if it exists
rm -rf node_modules/.cache 2>/dev/null || true

echo "✅ Cache cleared successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/deploy-vps.sh"
echo "2. Or build manually: cd frontend && npm run build"
echo ""
echo "💡 If browser still shows cached content:"
echo "   - Open DevTools (F12)"
echo "   - Right-click refresh button"
echo "   - Select 'Empty Cache and Hard Reload'"
