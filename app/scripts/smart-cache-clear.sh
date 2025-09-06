#!/bin/bash

# Smart Service Worker Cache Management
# Only clears when necessary to avoid unnecessary work

# Function to check if clearing is needed
needs_cache_clear() {
    local last_build_type_file="$APP_ROOT/frontend/.last_build_type"
    local current_env="${NODE_ENV:-production}"
    
    # Always clear if no previous build type recorded
    if [ ! -f "$last_build_type_file" ]; then
        return 0
    fi
    
    # Clear if switching between development and production
    local last_env=$(cat "$last_build_type_file" 2>/dev/null || echo "unknown")
    if [ "$last_env" != "$current_env" ]; then
        echo "🔄 Build type changed: $last_env → $current_env"
        return 0
    fi
    
    # Clear if service worker config was modified recently
    if [ "$APP_ROOT/frontend/next.config.ts" -nt "$APP_ROOT/frontend/public/sw.js" ]; then
        echo "🔧 PWA configuration changed"
        return 0
    fi
    
    return 1
}

# Smart cache clearing function
smart_clear_cache() {
    if needs_cache_clear; then
        echo "🧹 Clearing service worker cache (necessary)..."
        
        # Remove existing service worker files
        rm -f "$APP_ROOT/frontend/public/sw.js" 2>/dev/null || true
        rm -f "$APP_ROOT/frontend/public/sw.js.map" 2>/dev/null || true
        rm -f "$APP_ROOT/frontend/public/workbox-*.js" 2>/dev/null || true
        
        # Clear Next.js cache
        rm -rf "$APP_ROOT/frontend/.next" 2>/dev/null || true
        
        echo "✅ Cache cleared"
    else
        echo "ℹ️  Cache clearing not needed - reusing existing build cache"
    fi
    
    # Record current build type
    echo "${NODE_ENV:-production}" > "$APP_ROOT/frontend/.last_build_type"
}
