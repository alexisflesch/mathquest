# Build Optimization for VPS

This document explains the memory optimization strategies implemented for building MathQuest on memory-constrained VPS environments.

## Quick Start

### For VPS Deployment (Memory-Optimized)
```bash
# Use the VPS-optimized build script
./build-vps.sh

# Or use the main script with the low-memory flag
./build-all.sh --low-memory
```

### For Local Development (Standard)
```bash
# Standard build with all optimizations enabled
./build-all.sh
```

## Memory Optimizations Applied

When using `--low-memory` flag or `build-vps.sh`, the following optimizations are applied:

### Node.js Memory Limits
- `--max-old-space-size=1024`: Limits heap size to 1GB
- `--max-semi-space-size=64`: Limits young generation space to 64MB

### Build Optimizations
- **TypeScript Checks Disabled**: Skips type checking during build
- **ESLint Disabled**: Skips linting during build
- **SWC Minification Disabled**: Uses less memory-intensive minification
- **Reduced Webpack Parallelism**: Uses single-threaded compilation
- **Simplified Module IDs**: Reduces memory overhead
- **Next.js Telemetry Disabled**: Saves memory and network

### Next.js Configuration
- Sets `LIGHT_BUILD=1` environment variable
- Configures `next.config.ts` to apply memory optimizations
- Simplifies webpack chunk splitting strategy

## Memory Requirements

| Build Type | Minimum RAM | Recommended RAM | Features |
|-----------|-------------|-----------------|----------|
| Standard  | 4GB        | 8GB+           | Full type checking, ESLint, optimizations |
| VPS-Optimized | 1GB    | 2GB            | Basic build, minimal checks |

## Troubleshooting

### Build Still Fails with Memory Issues

1. **Check available memory:**
   ```bash
   free -h
   ```

2. **Try with even lower memory limit:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=768"
   ./build-vps.sh
   ```

3. **Enable swap space (if not already enabled):**
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **Build on a machine with more memory and deploy:**
   - Build locally or on a CI server
   - Transfer the built `.next` and `dist` directories
   - Use `rsync` or similar to sync files

### Monitor Memory Usage During Build
```bash
# Watch memory usage in real-time
watch -n 1 free -h

# Or use htop for detailed process monitoring
htop
```

## Build Scripts Reference

| Script | Purpose | Memory Usage |
|--------|---------|-------------|
| `build-all.sh` | Standard build | High |
| `build-all.sh --low-memory` | Memory-optimized build | Low |
| `build-vps.sh` | VPS convenience script | Low |

## npm Scripts Reference

| Script | Purpose | Memory Limit |
|--------|---------|-------------|
| `npm run build` | Standard build | No limit |
| `npm run light-build` | Light build | 4GB |
| `npm run vps-build` | VPS build | 1GB |

## Files Modified

- `build-all.sh`: Added `--low-memory` flag support
- `build-vps.sh`: VPS convenience script
- `frontend/next.config.ts`: Memory optimization configurations
- `frontend/package.json`: Added `vps-build` script
