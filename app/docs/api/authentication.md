# Authentication Guide

This document explains the authentication and authorization mechanisms used in MathQuest, including how to obtain, use, and refresh JWT tokens.

## Overview

MathQuest uses **JWT (JSON Web Tokens)** for stateless authentication. Tokens are issued upon successful login or registration and must be included in the `Authorization` header for protected API requests.

## Authentication Flow

1. **User Registration**: Client sends registration data to `/api/auth/register`. On success, receives a JWT and user info.
2. **User Login**: Client sends credentials to `/api/auth/login`. On success, receives a JWT and user info.
3. **Token Usage**: For all protected endpoints, include the JWT in the `Authorization` header:
   ```http
   Authorization: Bearer <your_jwt_token>
   ```
4. **Token Refresh**: If the token is expired, use `/api/auth/refresh-token` to obtain a new one (if supported).
5. **Logout**: Invalidate the token on the client (and optionally on the server).

## Endpoints

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Log in and receive a JWT
- `POST /api/auth/refresh-token` — Refresh JWT (if implemented)
- `POST /api/auth/logout` — Log out (optional, may be client-side only)

## Token Structure

JWTs contain user identification and expiration information. They are signed using a server-side secret and should not be tampered with.

## Security Best Practices

- **Never expose your JWT secret** in client-side code or public repositories.
- **Always use HTTPS** in production to protect tokens in transit.
- **Store tokens securely** on the client (e.g., HTTP-only cookies or secure storage).
- **Implement token expiration** and require re-authentication as needed.

## Example Usage

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'
```

Response:
```json
{
  "token": "<jwt_token>",
  "user": {
    "id": "...",
    "username": "alice",
    ...
  }
}
```

---

_This document will be updated as authentication mechanisms evolve._
