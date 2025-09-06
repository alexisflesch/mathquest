#!/bin/bash

# Production-Safe Build with Rollback
# This script ensures zero downtime even if builds fail

set -e

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to create deployment snapshot
create_deployment_snapshot() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local snapshot_dir="$APP_ROOT/.deployment_snapshots/$timestamp"
    
    echo "📸 Creating deployment snapshot..."
    mkdir -p "$snapshot_dir"
    
    # Backup current working state
    if [ -d "$APP_ROOT/frontend/.next" ]; then
        cp -r "$APP_ROOT/frontend/.next" "$snapshot_dir/frontend_next" 2>/dev/null || true
    fi
    
    if [ -d "$APP_ROOT/backend/dist" ]; then
        cp -r "$APP_ROOT/backend/dist" "$snapshot_dir/backend_dist" 2>/dev/null || true
    fi
    
    if [ -f "$APP_ROOT/frontend/public/sw.js" ]; then
        cp "$APP_ROOT/frontend/public/sw.js" "$snapshot_dir/" 2>/dev/null || true
    fi
    
    echo "$timestamp" > "$APP_ROOT/.last_deployment_snapshot"
    echo "✅ Snapshot created: $timestamp"
}

# Function to rollback to last working state
rollback_deployment() {
    local last_snapshot=$(cat "$APP_ROOT/.last_deployment_snapshot" 2>/dev/null || echo "")
    
    if [ -z "$last_snapshot" ]; then
        echo "❌ No snapshot available for rollback"
        return 1
    fi
    
    local snapshot_dir="$APP_ROOT/.deployment_snapshots/$last_snapshot"
    
    if [ ! -d "$snapshot_dir" ]; then
        echo "❌ Snapshot directory not found: $snapshot_dir"
        return 1
    fi
    
    echo "🔄 Rolling back to snapshot: $last_snapshot"
    
    # Restore from snapshot
    if [ -d "$snapshot_dir/frontend_next" ]; then
        rm -rf "$APP_ROOT/frontend/.next"
        cp -r "$snapshot_dir/frontend_next" "$APP_ROOT/frontend/.next"
    fi
    
    if [ -d "$snapshot_dir/backend_dist" ]; then
        rm -rf "$APP_ROOT/backend/dist"
        cp -r "$snapshot_dir/backend_dist" "$APP_ROOT/backend/dist"
    fi
    
    if [ -f "$snapshot_dir/sw.js" ]; then
        cp "$snapshot_dir/sw.js" "$APP_ROOT/frontend/public/"
    fi
    
    echo "✅ Rollback completed successfully"
}

# Production build with safety measures
production_safe_build() {
    echo "🛡️  Starting production-safe build..."
    
    # Create snapshot before any changes
    create_deployment_snapshot
    
    # Trap to rollback on failure
    trap 'echo "❌ Build failed! Rolling back..."; rollback_deployment; exit 1' ERR
    
    # Run the actual build
    "$APP_ROOT/build-all.sh"
    
    # Remove trap on success
    trap - ERR
    
    echo "🎉 Production build completed successfully!"
    
    # Cleanup old snapshots (keep last 5)
    find "$APP_ROOT/.deployment_snapshots" -type d -name "20*" | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
}

# Run production safe build
production_safe_build
