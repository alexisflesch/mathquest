# Production Deployment Guide

This guide describes how to deploy MathQuest to a production environment, including environment setup, security, and performance best practices.

## 1. Prerequisites
- Node.js (LTS version recommended)
- PostgreSQL database (cloud or self-hosted)
- Redis (if using for caching or sessions)
- Docker (optional, for containerized deployment)
- Domain name and SSL certificate

## 2. Environment Configuration
- Copy `.env.example` to `.env` and fill in production values for all secrets and connection strings.
- Set `NODE_ENV=production`.
- Ensure all API keys and secrets are stored securely (never commit secrets to git).

## 3. Build & Deploy
- Build frontend: `cd frontend && npm install && npm run build`
- Build backend: `cd backend && npm install && npm run build`
- Run database migrations: `cd backend && npx prisma migrate deploy`
- Start backend server: `npm start` or use a process manager (e.g., PM2, systemd)
- Start frontend: Serve with Next.js or export as static site if possible

## 4. SSL & Security
- Use HTTPS for all traffic (set up SSL via your hosting provider or with Let's Encrypt)
- Set secure HTTP headers (consider using Helmet.js in backend)
- Enable CORS only for trusted domains
- Regularly update dependencies to patch vulnerabilities

## 5. Performance Optimization
- Enable frontend static asset caching
- Use a CDN for static files if possible
- Enable database connection pooling
- Monitor server resource usage and scale as needed

## 6. Monitoring & Logging
- Set up centralized logging (e.g., with Winston, Loggly, or cloud provider tools)
- Monitor application health and uptime (e.g., UptimeRobot, Datadog)
- Set up alerts for errors and downtime

## 7. Backup & Recovery
- Schedule regular PostgreSQL backups
- Store backups securely and test recovery procedures

## 8. Troubleshooting
- Check logs for errors
- Verify environment variables are set correctly
- Ensure database migrations have run

---

For more details, see the [Monitoring Guide](./monitoring.md) and [Troubleshooting Guide](../TROUBLESHOOTING.md).
