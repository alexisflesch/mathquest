#!/bin/bash

# Atomic Build Script for MathQuest App
# Builds in place, then stages output and atomically deploys

set -e  # Exit on any error

echo "🚀 Building MathQuest App (Atomic Deployment)..."

# Get script directory (app root)
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGING_DIR="$APP_ROOT/.staging_$(date +%s)"

echo "📁 Working in: $APP_ROOT"
echo "📦 Staging directory: $STAGING_DIR"

# Function to cleanup staging directory on exit
cleanup_staging() {
    if [ -d "$STAGING_DIR" ]; then
        echo "🧹 Cleaning up staging directory..."
        rm -rf "$STAGING_DIR"
    fi
}

# Setup cleanup trap
trap cleanup_staging EXIT

# Function to create staging environment
setup_staging() {
    echo "📋 Setting up staging environment..."
    mkdir -p "$STAGING_DIR/frontend"
    mkdir -p "$STAGING_DIR/backend"
    echo "✅ Staging environment ready"
}

# Function to build frontend
build_frontend() {
    echo "🔨 Building frontend..."
    
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
    
    # Move build output to staging
    echo "📦 Moving frontend build to staging..."
    mv ".next" "$STAGING_DIR/frontend/"
    
    # Copy service worker files to staging if they exist
    if [ -f "public/sw.js" ]; then
        cp "public/sw.js" "$STAGING_DIR/frontend/"
        cp "public/sw.js.map" "$STAGING_DIR/frontend/" 2>/dev/null || true
    fi
    
    echo "✅ Frontend built and staged successfully"
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
    
    # Move build output to staging
    echo "📦 Moving backend build to staging..."
    mv "dist" "$STAGING_DIR/backend/"
    
    echo "✅ Backend built and staged successfully"
}

# Function to verify staged builds
verify_staged_builds() {
    echo "🔍 Verifying staged builds..."
    
    # Check backend build
    if [ ! -f "$STAGING_DIR/backend/dist/backend/src/server.js" ]; then
        echo "❌ Backend build verification failed - server.js not found"
        exit 1
    fi
    
    # Check frontend build
    if [ ! -d "$STAGING_DIR/frontend/.next" ]; then
        echo "❌ Frontend build verification failed - .next directory not found"
        exit 1
    fi
    
    # Check if PWA files were generated
    if [ -f "$STAGING_DIR/frontend/sw.js" ]; then
        echo "✅ PWA service worker generated"
    else
        echo "⚠️  No service worker found - PWA may be disabled"
    fi
    
    echo "✅ Staged builds verified successfully"
}

# Function to atomically deploy from staging
atomic_deploy() {
    echo "🔄 Performing atomic deployment..."
    
    # Stop PM2 processes first
    echo "⏹️  Stopping PM2 processes..."
    cd "$APP_ROOT"
    pm2 stop mathquest-backend 2>/dev/null || echo "Backend not running"
    pm2 stop mathquest-frontend 2>/dev/null || echo "Frontend not running"
    
    # Backup current builds (just in case)
    local backup_dir="$APP_ROOT/.backup_$(date +%s)"
    mkdir -p "$backup_dir"
    
    if [ -d "$APP_ROOT/frontend/.next" ]; then
        echo "💾 Backing up current frontend build..."
        mv "$APP_ROOT/frontend/.next" "$backup_dir/frontend_next"
    fi
    
    if [ -d "$APP_ROOT/backend/dist" ]; then
        echo "💾 Backing up current backend build..."
        mv "$APP_ROOT/backend/dist" "$backup_dir/backend_dist"
    fi
    
    if [ -f "$APP_ROOT/frontend/public/sw.js" ]; then
        echo "💾 Backing up current service worker..."
        cp "$APP_ROOT/frontend/public/sw.js" "$backup_dir/"
        cp "$APP_ROOT/frontend/public/sw.js.map" "$backup_dir/" 2>/dev/null || true
    fi
    
    # Atomic deployment from staging
    echo "⚡ Moving staged builds into production..."
    mv "$STAGING_DIR/frontend/.next" "$APP_ROOT/frontend/"
    mv "$STAGING_DIR/backend/dist" "$APP_ROOT/backend/"
    
    # Deploy new service worker files
    if [ -f "$STAGING_DIR/frontend/sw.js" ]; then
        cp "$STAGING_DIR/frontend/sw.js" "$APP_ROOT/frontend/public/"
        cp "$STAGING_DIR/frontend/sw.js.map" "$APP_ROOT/frontend/public/" 2>/dev/null || true
    fi
    
    echo "✅ Atomic deployment completed"
    echo "📝 Backup available at: $backup_dir"
    
    # Cleanup old backups (keep last 3)
    find "$APP_ROOT" -name ".backup_*" -type d | sort -r | tail -n +4 | xargs rm -rf 2>/dev/null || true
}

# Main build flow
main() {
    echo "🔄 Starting atomic build process..."
    
    # Setup staging environment
    setup_staging
    
    # Build frontend (output goes to staging)
    build_frontend
    
    # Build backend (output goes to staging)
    build_backend
    
    # Verify staged builds
    verify_staged_builds
    
    # If we get here, builds were successful - perform atomic deployment
    atomic_deploy
    
    # Start services using the main start script
    echo "▶️  Starting services..."
    cd "$APP_ROOT"
    ./start-all.sh
    
    echo ""
    echo "🎉 Atomic deployment completed successfully!"
    echo ""
    echo "📊 Process Status:"
    pm2 status
    echo ""
    echo "🌐 Your app should be available at:"
    echo "   Frontend: http://localhost:3008"
    echo "   Backend:  http://localhost:3007"
    echo ""
}

# Run main function
main
