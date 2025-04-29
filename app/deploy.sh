#!/bin/bash
#Build and deploy script for MathQuest using pm2

set -e

# Parse arguments
if [ "$#" -ne 1 ]; then
  echo "Usage: $0 --build | --no-build"
  exit 1
fi

if [ "$1" == "--build" ]; then
  SKIP_BUILD=false
elif [ "$1" == "--no-build" ]; then
  SKIP_BUILD=true
else
  echo "Unknown option: $1"
  echo "Usage: $0 --build | --no-build"
  exit 1
fi

echo "Starting deployment script..."

# Build if requested
if [ "$SKIP_BUILD" = false ]; then
    echo "Running production build..."
    npm run production_build
else
    echo "Skipping build as requested (--no-build)."
fi

echo "Restarting PM2 instance..."

# Stop and delete old process if it exists
pm2 delete mathquest || true

# Start fresh clean instance
PORT=3007 NODE_ENV=production pm2 start server.js --name mathquest --env production

echo "Deployment complete."