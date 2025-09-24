---
title: Troubleshooting Guide
description: Common issues, debugging procedures, and solutions for MathQuest deployment and development
---

# Troubleshooting Guide

This guide covers common issues, debugging procedures, and solutions for MathQuest deployment and development.

## Quick Diagnosis

### Health Check Commands

```bash
# Check all services status
pm2 status

# Check memory usage
curl http://localhost:3007/health/memory

# Check basic health
curl http://localhost:3007/health

# View recent logs
pm2 logs --lines 50

# Check Redis connection
redis-cli ping
```

### Common Symptoms and Solutions

## Memory Issues

### Symptom: Application crashes with "JavaScript heap out of memory"

**Solutions:**

```bash
# 1. Check current memory usage
curl http://localhost:3007/health/memory

# 2. Restart with ultra-limited memory settings
cd backend && npm run start:ultra-limited

# 3. Check PM2 memory limits
pm2 show mathquest-backend

# 4. Rebuild with low-memory optimization
bash build-vps.sh
```

**Prevention:**
- Use `build-vps.sh` for VPS deployment
- Monitor memory with `/health/memory` endpoint
- Set appropriate PM2 memory limits in `ecosystem.config.js`

### Symptom: PM2 auto-restarts due to memory limits

```bash
# Check restart history
pm2 show mathquest-backend

# Adjust memory limits in ecosystem.config.js
{
    "max_memory_restart": "500M",  // Increase if needed
    "max_memory_restart": "300M"   // For frontend
}
```

## Database Connection Issues

### Symptom: "Can't reach database server" or connection timeouts

**Diagnosis:**
```bash
# Check database connectivity
psql -h localhost -U postgre -d mathquest -c "SELECT 1;"

# Check Prisma connection
cd backend && npx prisma db push --preview-feature

# Verify environment variables
cat backend/.env | grep DATABASE_URL
```

**Solutions:**

```bash
# 1. Restart PostgreSQL service
sudo systemctl restart postgresql

# 2. Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# 3. Verify connection string
DATABASE_URL="postgresql://postgre:dev123@localhost:5432/mathquest"

# 4. Reset database connection pool
pm2 restart mathquest-backend
```

### Symptom: Prisma migration errors

```bash
# Check migration status
cd backend && npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset --force
```

## Redis Connection Issues

### Symptom: "Redis connection failed" or caching not working

**Diagnosis:**
```bash
# Check Redis service
redis-cli ping

# Check Redis memory usage
redis-cli info memory

# Verify Redis URL in environment
cat backend/.env | grep REDIS_URL
```

**Solutions:**

```bash
# 1. Start Redis service
sudo systemctl start redis-server

# 2. Check Redis configuration
redis-cli config get maxmemory

# 3. Clear Redis cache (if needed)
redis-cli FLUSHALL

# 4. Restart application
pm2 restart mathquest-backend
```

## Socket.IO Connection Issues

### Symptom: Real-time features not working (timers, live updates)

**Diagnosis:**
```javascript
// Check Socket.IO connection in browser console
const socket = io('http://localhost:3007');
socket.on('connect', () => console.log('Connected'));
socket.on('connect_error', (err) => console.log('Connection error:', err));
```

**Solutions:**

```bash
# 1. Check Socket.IO server logs
pm2 logs mathquest-backend | grep socket

# 2. Verify CORS configuration
curl -H "Origin: http://localhost:3008" http://localhost:3007/api/socket.io/

# 3. Check Redis adapter (if using multiple servers)
redis-cli keys "socket.io*"

# 4. Restart Socket.IO server
pm2 restart mathquest-backend
```

### Symptom: WebSocket connections failing in production

```nginx
# Nginx configuration for WebSocket proxy
location /api/socket.io/ {
    proxy_pass http://127.0.0.1:3007/api/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## Authentication Issues

### Symptom: Users can't log in or JWT tokens are invalid

**Diagnosis:**
```bash
# Check JWT secret configuration
cat backend/.env | grep JWT_SECRET

# Verify token format in browser dev tools
# Application > Local Storage > auth_token
```

**Solutions:**

```bash
# 1. Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update environment file
echo "JWT_SECRET=your-new-secret-here" >> backend/.env

# 3. Clear browser cookies and local storage
# Browser Dev Tools > Application > Clear storage

# 4. Restart backend
pm2 restart mathquest-backend
```

### Symptom: Password reset emails not sending

```bash
# Check Brevo API configuration
cat backend/.env | grep BREVO

# Test email service
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":[{"email":"test@example.com"}],"templateId":1}'
```

## Build and Deployment Issues

### Symptom: Build fails with memory errors

```bash
# Use low-memory build mode
bash build-all.sh --low-memory

# Or set memory limits manually
NODE_OPTIONS="--max-old-space-size=1024" npm run build
```

### Symptom: Frontend build hangs or fails

```bash
# Clear Next.js cache
rm -rf frontend/.next

# Check Node.js version compatibility
node --version

# Rebuild with verbose logging
cd frontend && npm run build --verbose
```

### Symptom: PM2 fails to start services

```bash
# Check PM2 logs
pm2 logs

# Delete and recreate PM2 processes
pm2 delete all
pm2 start ecosystem.config.js

# Check file permissions
ls -la start-all.sh
chmod +x start-all.sh
```

## PWA and Service Worker Issues

### Symptom: Service worker JavaScript errors (`_ref is not defined`)

**Cause:** Bug in `@ducanh2912/next-pwa` library causing serialization issues with async cache plugins.

**Symptoms:**
```javascript
// Browser console error
sw-v3.js:1 Uncaught (in promise) ReferenceError: _ref is not defined
    at Object.cacheWillUpdate (sw-v3.js:1:12607)
```

**Solutions:**

```bash
# 1. Update service worker configuration in next.config.ts
# Change NetworkFirst to StaleWhileRevalidate without plugins
runtimeCaching: [
    {
        urlPattern: '/',
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'start-url'
        },
    },
],

# 2. Rebuild the frontend (postbuild script will automatically fix SW)
cd frontend && npm run build

# 3. Hard refresh browser or update service worker
# In DevTools: Application → Service Workers → Update/Unregister
```

**Note:** A postbuild script automatically removes any broken registerRoute from the generated service worker. This ensures the fix is applied consistently after each build. The bug can be reproduced using `node scripts/test-ref-bug.js` on an unfixed service worker.

## Performance Issues

### Symptom: Application is slow or unresponsive

**Diagnosis:**
```bash
# Check memory usage
curl http://localhost:3007/health/memory

# Monitor PM2 processes
pm2 monit

# Check database query performance
# Enable query logging in development
```

**Solutions:**

```bash
# 1. Restart services
pm2 restart all

# 2. Clear caches
redis-cli FLUSHALL

# 3. Check database connections
psql -h localhost -U postgre -d mathquest -c "SELECT count(*) FROM pg_stat_activity;"

# 4. Optimize memory usage
bash build-vps.sh && bash start-all.sh
```

### Symptom: High CPU usage

```bash
# Check process CPU usage
pm2 monit

# Profile Node.js application
cd backend && npm run monitor:memory

# Check for infinite loops in logs
pm2 logs --lines 100 | grep error
```

## Network and CORS Issues

### Symptom: CORS errors in browser console

```javascript
// Error: Access to XMLHttpRequest has been blocked by CORS policy
```

**Solutions:**

```bash
# 1. Check CORS configuration in server.ts
grep -n "cors" backend/src/server.ts

# 2. Verify frontend URL in environment
cat backend/.env | grep FRONTEND_URL

# 3. Update CORS origins for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['http://localhost:3000', 'http://localhost:3008'],
    credentials: true
};
```

### Symptom: Nginx proxy errors

```nginx
# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test proxy configuration
curl -H "Host: yourdomain.com" http://127.0.0.1/api/v1/health
```

## Development Environment Issues

### Symptom: Hot reload not working

```bash
# Check file watching limits
cat /proc/sys/fs/inotify/max_user_watches

# Increase watch limits if needed
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Symptom: TypeScript compilation errors

```bash
# Clear TypeScript cache
rm -rf backend/dist frontend/.next

# Check TypeScript configuration
cd backend && npx tsc --noEmit

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Database Migration Issues

### Symptom: Prisma schema changes not applied

```bash
# Check migration status
cd backend && npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Symptom: Database schema drift

```bash
# Check for schema differences
cd backend && npx prisma db push --preview-feature

# View current schema
npx prisma db pull

# Reset and reapply schema
npx prisma migrate reset --force
```

## Logging and Debugging

### Enable Debug Logging

```bash
# Set log level to debug
echo "LOG_LEVEL=debug" >> backend/.env

# Restart services
pm2 restart mathquest-backend

# View debug logs
pm2 logs mathquest-backend --lines 100
```

### Browser Debugging

```javascript
// Enable Socket.IO debug logging
localStorage.setItem('debug', 'socket.io-client:*');

// Monitor network requests
// Browser Dev Tools > Network > Filter by WS (WebSocket)

// Check console for errors
// Browser Dev Tools > Console
```

### Database Debugging

```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- View slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Emergency Recovery

### Complete System Reset

```bash
# Stop all services
pm2 stop all
pm2 delete all

# Clear caches
redis-cli FLUSHALL

# Reset database (CAUTION: destroys data)
cd backend && npx prisma migrate reset --force

# Rebuild application
bash build-vps.sh

# Restart services
bash start-all.sh
```

### Data Recovery

```bash
# Create database backup
pg_dump -U postgre -h localhost mathquest > backup.sql

# Restore from backup
psql -U postgre -h localhost mathquest &lt; backup.sql
```

## Getting Help

### Diagnostic Information to Collect

When reporting issues, please include:

1. **System Information:**
   ```bash
   uname -a
   node --version
   npm --version
   ```

2. **Service Status:**
   ```bash
   pm2 status
   pm2 logs --lines 20
   ```

3. **Memory and Performance:**
   ```bash
   curl http://localhost:3007/health/memory
   free -h
   ```

4. **Configuration:**
   ```bash
   cat backend/.env | grep -v PASSWORD
   ```

5. **Error Logs:**
   ```bash
   pm2 logs mathquest-backend --err --lines 50
   ```

### Support Resources

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check VuePress docs for detailed guides
- **Community**: Join discussions for common solutions
- **Logs**: Always include relevant log output with issues

## Prevention Best Practices

### Regular Maintenance

```bash
# Weekly maintenance script
#!/bin/bash
# Clear old logs
pm2 flush

# Check disk space
df -h

# Verify service health
curl http://localhost:3007/health

# Update dependencies
npm audit fix
```

### Monitoring Setup

```bash
# Install monitoring tools
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -U postgre mathquest > "backup_$DATE.sql"

# Keep last 7 days
ls backup_*.sql | head -n -7 | xargs rm -f
```

This troubleshooting guide should be updated as new issues are discovered and resolved.