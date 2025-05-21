# Monitoring & Operations Guide for MathQuest

This guide provides best practices and requirements for monitoring, logging, and operating MathQuest in production. All AI agents and human maintainers should follow these guidelines to ensure reliability and observability.

## Logging
- Use the centralized logger utility for all server-side and client-side logging.
- Set `LOG_LEVEL` appropriately for the environment (DEBUG for development, ERROR or WARN for production).
- Aggregate logs using a log management tool (e.g., ELK stack, Datadog, or similar) for production deployments.

## Health Checks
- Implement health check endpoints for backend and database (e.g., `/api/health` returns 200 OK if healthy).
- Monitor health check endpoints with uptime monitoring tools.

## Monitoring
- Monitor server CPU, memory, and disk usage.
- Monitor Redis and PostgreSQL for connection count, latency, and errors.
- Track key application metrics (active games, connected users, error rates).
- Set up alerts for high error rates, downtime, or resource exhaustion.

## Scaling & Operations
- Use the Socket.IO Redis adapter for horizontal scaling.
- Ensure all environment variables are set correctly in production.
- Regularly back up the PostgreSQL database and Redis data (if persistence is enabled).
- Document all operational runbooks and incident response procedures.

## AI Agent-Specific Notes
- Agents must document any operational changes or new monitoring requirements.
- All monitoring and alerting configuration should be described in this guide.

---

For more details, see the [Setup Guide](./setup/README.md) and [Security Practices](./security.md).
