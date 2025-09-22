#!/bin/bash

# Atomic Build Script for MathQuest App
# Builds in place, then stages output and atomically deploys

set -e  # Exit on any error

# Parse command line arguments
LOW_MEMORY=false
SHOW_HELP=false

for arg in "$@"; do
    case $arg in
        --low-memory)
            LOW_MEMORY=true
            shift
            ;;
        --help|-h)
            SHOW_HELP=true
            shift
            ;;
        *)
            ;;
    esac
done

if [ "$SHOW_HELP" = true ]; then
    echo "MathQuest Build Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --low-memory    Optimize build for low-memory VPS environments"
    echo "                  • Disables TypeScript and ESLint checks"
    echo "                  • Limits Node.js heap size to 1GB"
    echo "                  • Reduces webpack parallelism"
    echo "                  • Disables memory-intensive optimizations"
    echo ""
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Standard build (for local development)"
    echo "  $0 --low-memory      # Memory-optimized build (for VPS deployment)"
    echo ""
    exit 0
fi

if [ "$LOW_MEMORY" = true ]; then
    echo "🚀 Building MathQuest App (Memory-Optimized Mode)..."
else
    echo "🚀 Building MathQuest App (Standard Mode)..."
fi

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
    mkdir -p "$STAGING_DIR/frontend/public"
    mkdir -p "$STAGING_DIR/backend"
    echo "✅ Staging environment ready"
}

# Function to check database schema consistency
check_database_schema() {
    echo "🗄️  Checking database schema consistency..."
    
    cd "$APP_ROOT/backend"
    
    # Check migration status using a temporary file to capture output
    # Temporarily disable 'set -e' since we expect exit code 1 for pending migrations
    TEMP_FILE=$(mktemp)
    set +e
    npx prisma migrate status > "$TEMP_FILE" 2>&1
    EXIT_CODE=$?
    set -e
    MIGRATION_STATUS=$(cat "$TEMP_FILE")
    rm "$TEMP_FILE"
    
    if [ $EXIT_CODE -eq 1 ]; then
        # Check if it's due to pending migrations or connection issues
        if echo "$MIGRATION_STATUS" | grep -q "Following migrations have not yet been applied"; then
            echo "❌ Pending database migrations detected!"
            echo ""
            echo "The following migrations need to be applied:"
            echo "$MIGRATION_STATUS" | grep -A 20 "Following migrations have not yet been applied" | sed 's/^/   • /'
            echo ""
            echo "This will cause runtime errors if the code expects the new schema."
            echo ""
            echo "To resolve this:"
            echo "   1. Run 'npx prisma migrate dev' (development)"
            echo "   2. Run 'npx prisma migrate deploy' (production)"
            echo ""
            echo "❌ Build cancelled due to pending database migrations"
            echo "   Apply migrations first, then re-run the build"
            exit 1
        else
            echo "❌ Database connection or schema validation failed"
            echo "   Error details:"
            echo "$MIGRATION_STATUS"
            echo ""
            echo "   Please ensure:"
            echo "   • Database is running and accessible"
            echo "   • Database credentials in .env are correct"
            exit 1
        fi
    else
        echo "✅ Database schema is up to date"
    fi
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
    
    # Apply memory optimizations for VPS builds
    if [ "$LOW_MEMORY" = true ]; then
        echo "🧠 Applying memory optimizations for VPS..."
        export LIGHT_BUILD=1
        export NODE_OPTIONS="--max-old-space-size=1024"
        export NEXT_TELEMETRY_DISABLED=1
        export DISABLE_ESLINT=1
        echo "   • Disabled TypeScript checks"
        echo "   • Disabled ESLint checks"  
        echo "   • Limited Node.js heap to 1GB"
        echo "   • Disabled Next.js telemetry"
    fi
    
    # Build frontend
    echo "🏗️  Running production build..."
    if [ "$LOW_MEMORY" = true ]; then
        npm run vps-build
        # Run postbuild script manually since vps-build doesn't trigger it
        echo "🔧 Running postbuild script..."
        npm run postbuild
    else
        npm run build
    fi
    
    # Move build output to staging
    echo "📦 Moving frontend build to staging..."
    mv ".next" "$STAGING_DIR/frontend/"
    
    # Copy PWA service worker files and workbox bundles to staging if they exist
    if ls public/sw-*.js >/dev/null 2>&1; then
        cp public/sw-*.js "$STAGING_DIR/frontend/public/" 2>/dev/null || true
        cp public/sw-*.js.map "$STAGING_DIR/frontend/public/" 2>/dev/null || true
    fi
    if ls public/workbox-*.js >/dev/null 2>&1; then
        cp public/workbox-*.js "$STAGING_DIR/frontend/public/" 2>/dev/null || true
        cp public/workbox-*.js.map "$STAGING_DIR/frontend/public/" 2>/dev/null || true
    fi

    echo "🧾 Staged PWA files:"
    ls -la "$STAGING_DIR/frontend/public" 2>/dev/null || true
    
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
    if ls "$STAGING_DIR/frontend/public/sw-"*.js >/dev/null 2>&1; then
        echo "✅ PWA service worker generated"
        # Diagnose whether SW references an external workbox bundle
        SW_FILE=$(ls "$STAGING_DIR/frontend/public/sw-"*.js | head -n 1)
        if grep -Eq "workbox-[a-f0-9]+\\.js" "$SW_FILE"; then
            echo "⚠️  SW references external workbox bundle inside: $(basename "$SW_FILE")"
            echo "   Ensure matching workbox-*.js is deployed (or enable inlineWorkboxRuntime)."
        else
            echo "✅ SW contains inlined Workbox runtime (no external workbox-*.js needed)"
        fi
    else
        echo "⚠️  No service worker found - PWA may be disabled"
    fi
    
    echo "✅ Staged builds verified successfully"
}

# Function to atomically deploy from staging
atomic_deploy() {
    echo "🔄 Performing atomic deployment..."
    
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
    
    # Backup current PWA files (if any)
    if ls "$APP_ROOT/frontend/public/sw-"*.js >/dev/null 2>&1; then
        echo "💾 Backing up current service worker(s)..."
        cp "$APP_ROOT/frontend/public/sw-"*.js "$backup_dir/" 2>/dev/null || true
        cp "$APP_ROOT/frontend/public/sw-"*.js.map "$backup_dir/" 2>/dev/null || true
    fi
    if ls "$APP_ROOT/frontend/public/workbox-*.js" >/dev/null 2>&1; then
        echo "💾 Backing up current workbox bundles..."
        cp "$APP_ROOT/frontend/public/workbox-"*.js "$backup_dir/" 2>/dev/null || true
        cp "$APP_ROOT/frontend/public/workbox-"*.js.map "$backup_dir/" 2>/dev/null || true
    fi
    
    # Atomic deployment from staging
    echo "⚡ Moving staged builds into production..."
    mv "$STAGING_DIR/frontend/.next" "$APP_ROOT/frontend/"
    mv "$STAGING_DIR/backend/dist" "$APP_ROOT/backend/"
    
    # Deploy new PWA files
    # Clean up old workbox bundles to avoid stale references
    rm -f "$APP_ROOT/frontend/public/workbox-"*.js 2>/dev/null || true
    rm -f "$APP_ROOT/frontend/public/workbox-"*.js.map 2>/dev/null || true

    if ls "$STAGING_DIR/frontend/public/sw-"*.js >/dev/null 2>&1; then
        cp "$STAGING_DIR/frontend/public/sw-"*.js "$APP_ROOT/frontend/public/" 2>/dev/null || true
        cp "$STAGING_DIR/frontend/public/sw-"*.js.map "$APP_ROOT/frontend/public/" 2>/dev/null || true
    fi
    if ls "$STAGING_DIR/frontend/public/workbox-"*.js >/dev/null 2>&1; then
        cp "$STAGING_DIR/frontend/public/workbox-"*.js "$APP_ROOT/frontend/public/" 2>/dev/null || true
        cp "$STAGING_DIR/frontend/public/workbox-"*.js.map "$APP_ROOT/frontend/public/" 2>/dev/null || true
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
    
    # Check database schema consistency before building
    check_database_schema
    
    # Build frontend (output goes to staging)
    build_frontend
    
    # Build backend (output goes to staging)
    build_backend
    
    # Verify staged builds
    verify_staged_builds
    
    # If we get here, builds were successful - perform atomic deployment
    atomic_deploy
    
    echo ""
    echo "🎉 Build and deployment completed successfully!"
    echo ""
    echo "📋 What was built:"
    echo "   ✅ Frontend: .next directory with PWA support"
    echo "   ✅ Backend: dist directory with compiled TypeScript"
    SW_SUMMARY_LIST=$(ls "$APP_ROOT/frontend/public"/sw-*.js 2>/dev/null | xargs -n1 basename 2>/dev/null | tr '\n' ' ')
    if [ -n "$SW_SUMMARY_LIST" ]; then
        echo "   ✅ Service Worker(s): $SW_SUMMARY_LIST (Workbox runtime may be inlined; workbox-*.js may not be present)"
    else
        echo "   ⚠️  Service Worker: none found (PWA may be disabled)"
    fi
    echo ""
    echo "📝 Next steps:"
    echo "   Run your PM2 start script to launch the services"
    echo "   Check that files are in place:"
    echo "     ls -la frontend/.next backend/dist"
    echo ""
}

# Run main function
main
