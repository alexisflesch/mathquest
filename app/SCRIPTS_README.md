# MathQuest Build & Deploy Scripts

This directory contains scripts for building and deploying the MathQuest application.

## Quick Start

### 1. Build Everything
```bash
./build-all.sh
```
This script:
- Clears service worker cache
- Builds frontend (with PWA support)
- Builds backend
- Verifies both builds completed successfully

### 2. Start Services
```bash
./start-all.sh
```
This script:
- Stops any existing PM2 processes
- Starts both backend and frontend using PM2
- Saves PM2 configuration

### 3. Full Deployment (Build + Start)
```bash
./scripts/deploy-vps.sh
```
This combines both steps above for VPS deployment.

## Script Details

### `build-all.sh` (App Root)
- **Purpose**: Build both frontend and backend
- **Order**: Frontend first, then backend
- **Features**: Cache clearing, dependency installation, build verification
- **PWA**: Generates service worker with proper configuration

### `start-all.sh` (App Root) 
- **Purpose**: Start services with PM2
- **Ports**: Backend (3007), Frontend (3008)
- **Management**: Uses `ecosystem.config.js` for PM2 configuration

### `scripts/deploy-vps.sh`
- **Purpose**: VPS-specific deployment tasks
- **Commands**:
  - `./scripts/deploy-vps.sh` - Full deployment
  - `./scripts/deploy-vps.sh build-only` - Build without starting
  - `./scripts/deploy-vps.sh restart` - Restart services only
  - `./scripts/deploy-vps.sh clear-cache` - Clear cache only

### `scripts/clear-cache.sh`
- **Purpose**: Clear service worker and build caches
- **Use**: When encountering PWA cache issues

## Typical Workflow

### Development to Production
```bash
# 1. Build everything
./build-all.sh

# 2. Start services
./start-all.sh

# 3. Check status
pm2 status
```

### VPS Deployment
```bash
# One command deployment
./scripts/deploy-vps.sh
```

### Troubleshooting Cache Issues
```bash
# Clear cache and rebuild
./scripts/clear-cache.sh
./build-all.sh
./start-all.sh
```

## Service Management

- **View logs**: `pm2 logs`
- **Restart**: `pm2 restart all`
- **Stop**: `pm2 stop all`
- **Monitor**: `pm2 monit`

## Ports
- Backend: http://localhost:3007
- Frontend: http://localhost:3008
