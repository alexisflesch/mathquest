# Security Practices for MathQuest (AI Agent Edition)

This document outlines security best practices and requirements for the MathQuest project, with a focus on AI agent-driven development. All agents and contributors must follow these guidelines to ensure the safety and integrity of the platform.

## Authentication & Authorization
- Use JWT (JSON Web Tokens) for authenticating API and socket requests.
- Always validate tokens on the backend for every request and socket connection.
- Enforce role-based access control (RBAC):
  - Teachers can create/manage quizzes, games, and view analytics.
  - Students can join games and submit answers.
  - Admins (if present) can manage users and system settings.
- Never trust client-side data for authorization decisions.

## CORS & Transport Security
- Configure CORS to only allow trusted frontend origins.
- Use HTTPS in production to encrypt all traffic.
- Ensure Socket.IO and REST endpoints are not exposed to untrusted origins.

## Rate Limiting & Abuse Prevention
- Implement rate limiting on API and socket endpoints to prevent abuse.
- Monitor for suspicious activity (e.g., repeated failed logins, rapid event emission).

## Secrets & Environment Variables
- Never commit secrets (JWT keys, database passwords, etc.) to version control.
- Store all secrets in environment variables or a secure secrets manager.
- Rotate secrets regularly and after any suspected leak.

## Data Validation & Sanitization
- Use Zod schemas (or equivalent) to validate all incoming data (API and socket events).
- Sanitize user input to prevent injection attacks (SQL, XSS, etc.).

## Logging & Monitoring
- Log all authentication attempts, errors, and suspicious actions.
- Monitor logs for anomalies and potential security incidents.

## AI Agent-Specific Guidelines
- All code changes by agents must be reviewed for security implications.
- Agents must not introduce hardcoded credentials, open CORS policies, or bypass authentication checks.
- Security-related documentation must be kept up to date as the codebase evolves.

## Further Reading
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

All agents and contributors are responsible for maintaining these standards. If you discover a vulnerability, document it and notify the project lead immediately.
