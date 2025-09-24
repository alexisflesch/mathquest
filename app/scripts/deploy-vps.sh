#!/bin/bash

# VPS Deployment Script for MathQuest App
# This script handles VPS-specific deployment tasks

set -e  # Exit on any error

echo "🚀 Starting MathQuest VPS Deployment..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Working in: $APP_ROOT"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to stop existing processes
stop_processes() {
    echo "⏹️  Stopping existing processes..."
    
    # Check if PM2 is running our processes
    if command_exists pm2; then
        pm2 stop mathquest-backend 2>/dev/null || echo "Backend not running"
        pm2 stop mathquest-frontend 2>/dev/null || echo "Frontend not running"
        pm2 delete mathquest-backend 2>/dev/null || echo "Backend process not found"
        pm2 delete mathquest-frontend 2>/dev/null || echo "Frontend process not found"
    fi
    
    echo "✅ Processes stopped"
}

# Function to display helpful information
show_info() {
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Process Status:"
    pm2 status
    echo ""
    echo "🌐 Your app should be available at:"
    echo "   Frontend: http://localhost:3008"
    echo "   Backend:  http://localhost:3007"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs:     pm2 logs"
    echo "   Restart app:   pm2 restart all"
    echo "   Stop app:      pm2 stop all"
    echo "   Monitor:       pm2 monit"
    echo ""
    echo "🔧 If you encounter service worker cache issues:"
    echo "   1. Clear browser cache and storage"
    echo "   2. Run: ./scripts/clear-cache.sh"
    echo "   3. Rebuild: ./build-all.sh && ./start-all.sh"
    echo ""
}

# Main deployment flow
main() {
    echo "🔄 Starting deployment process..."
    
    # Stop existing processes
    stop_processes
    
    # Build using the main build script
    echo "🔨 Building application..."
    cd "$APP_ROOT"
    ./build-all.sh
    
    # Start using the main start script
    echo "▶️  Starting application..."
    ./start-all.sh
    
    # Show info
    show_info
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build-only")
        echo "🔨 Building only (no process management)..."
        cd "$APP_ROOT"
        ./build-all.sh
        echo "✅ Build completed"
        ;;
    "clear-cache")
        echo "🧹 Clearing cache only..."
        cd "$APP_ROOT"
        ./scripts/clear-cache.sh
        ;;
    "restart")
        echo "🔄 Restarting processes..."
        stop_processes
        cd "$APP_ROOT"
        ./start-all.sh
        show_info
        ;;
    *)
        echo "Usage: $0 [deploy|build-only|clear-cache|restart]"
        echo ""
        echo "Commands:"
        echo "  deploy     - Full deployment (default)"
        echo "  build-only - Build without starting processes"
        echo "  clear-cache - Clear service worker cache only"
        echo "  restart    - Restart existing processes"
        exit 1
        ;;
esac
