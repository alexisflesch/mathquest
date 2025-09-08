#!/bin/bash

# VPS-Optimized Build Script for MathQuest App
# This is a convenience wrapper around build-all.sh with memory optimizations

echo "🚀 Starting VPS-optimized build..."
echo "💡 This script uses memory optimizations suitable for VPS environments"
echo ""

# Check available memory
if command -v free >/dev/null 2>&1; then
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.1fGB", $2/1024}')
    AVAIL_MEM=$(free -m | awk 'NR==2{printf "%.1fGB", $7/1024}')
    echo "📊 System Memory: $TOTAL_MEM total, $AVAIL_MEM available"
    echo ""
fi

# Run the main build script with low-memory optimizations
exec "$(dirname "$0")/build-all.sh" --low-memory
