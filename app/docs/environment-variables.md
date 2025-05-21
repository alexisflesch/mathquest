# Environment Variables Reference for MathQuest

This document lists all required and optional environment variables for running MathQuest. All agents and contributors must ensure these are set correctly in `.env` files or deployment environments.

## Core Variables

| Variable         | Description                                 | Example / Default                      | Required |
|------------------|---------------------------------------------|----------------------------------------|----------|
| DATABASE_URL     | PostgreSQL connection string                | postgresql://user:pass@host:5432/db    | Yes      |
| REDIS_URL        | Redis connection string                     | redis://localhost:6379                 | Yes      |
| PORT             | Backend server port                         | 3007                                   | Yes      |
| LOG_LEVEL        | Log verbosity (DEBUG, INFO, WARN, ERROR)    | info                                   | No       |
| NEXTAUTH_SECRET  | Secret for NextAuth (if used)               | your-secret-here                       | Yes*     |
| NEXT_PUBLIC_API_URL | Frontend API base URL                    | http://localhost:3007                  | Yes      |
| NEXT_PUBLIC_CLIENT_LOG_LEVEL | Client log level (DEBUG, INFO, WARN, ERROR, NONE) | DEBUG | No |

*`NEXTAUTH_SECRET` is required if using NextAuth for authentication.

## Usage
- Copy `example.env` to `.env` and fill in the required values.
- Never commit secrets to version control.
- For production, use a secrets manager or environment configuration system.

## Adding New Variables
- Document all new environment variables here and in `example.env`.
- Describe their purpose and any default values.

---

For questions or updates, see the [Setup Guide](./setup/README.md) or contact the project lead.
