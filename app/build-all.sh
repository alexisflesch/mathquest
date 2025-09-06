#!/bin/bash

# Build All Script for MathQuest App
# Builds frontend first, then backend

set -e  # Exit on any error

echo "🚀 Building MathQuest App (Frontend + Backend)..."

# Get script directory (app root)
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Working in: $APP_ROOT"

# Function to clear service worker cache
clear_service_worker_cache() {
    echo "🧹 Clearing service worker cache..."
    
    # Remove existing service worker files
    rm -f "$APP_ROOT/frontend/public/sw.js" 2>/dev/null || true
    rm -f "$APP_ROOT/frontend/public/sw.js.map" 2>/dev/null || true
    rm -f "$APP_ROOT/frontend/public/workbox-*.js" 2>/dev/null || true
    rm -f "$APP_ROOT/frontend/public/_next/static/chunks/pages/_app-*.js" 2>/dev/null || true
    
    # Clear Next.js cache
    rm -rf "$APP_ROOT/frontend/.next" 2>/dev/null || true
    
    echo "✅ Service worker cache cleared"
}

# Function to build frontend
build_frontend() {
    echo "🔨 Building frontend with PWA support..."
    
    cd "$APP_ROOT/frontend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Set production environment
    export NODE_ENV=production
    
    # Build frontend
    echo "🏗️  Running production build..."
    npm run build
    
    echo "✅ Frontend built successfully with PWA support"
}

# Function to build backend
build_backend() {
    echo "🔨 Building backend..."
    
    cd "$APP_ROOT/backend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        echo "📦 Installing backend dependencies..."
        npm install
    fi
    
    # Build backend
    npm run build
    
    echo "✅ Backend built successfully"
}

# Function to verify build
verify_build() {
    echo "🔍 Verifying build..."
    
    # Check backend build - updated path to match actual build output
    if [ ! -f "$APP_ROOT/backend/dist/backend/src/server.js" ]; then
        echo "❌ Backend build failed - server.js not found"
        exit 1
    fi
    
    # Check frontend build
    if [ ! -d "$APP_ROOT/frontend/.next" ]; then
        echo "❌ Frontend build failed - .next directory not found"
        exit 1
    fi
    
    # Check if PWA files were generated
    if [ -f "$APP_ROOT/frontend/public/sw.js" ]; then
        echo "✅ PWA service worker generated"
    else
        echo "⚠️  No service worker found - PWA may be disabled"
    fi
    
    echo "✅ Build verification completed"
}

# Main build flow
main() {
    echo "🔄 Starting build process..."
    
    # Clear service worker cache first
    clear_service_worker_cache
    
    # Build frontend first
    build_frontend
    
    # Build backend second
    build_backend
    
    # Verify both builds
    verify_build
    
    echo ""
    echo "🎉 Build completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   Start services: ./start-all.sh"
    echo "   Or manually:"
    echo "     pm2 start ecosystem.config.js"
    echo ""
}

# Run main function
main
