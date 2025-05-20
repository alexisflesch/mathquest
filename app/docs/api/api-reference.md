# MathQuest API - Technical Reference

This document provides a comprehensive, route-by-route reference for all current API endpoints in `/src/api/v1/`. All endpoints use English naming and are versioned under `/api/v1/`.

---

## Table of Contents
- [Authentication](#authentication)
- [Teachers](#teachers)
- [Players](#players)
- [Questions](#questions)
- [Quiz Templates](#quiz-templates)
- [Game Templates](#game-templates)
- [Games](#games)
- [Game Control](#game-control)

---

## Authentication

- **Register Teacher**: `POST /api/v1/teachers/register`
- **Register Player**: `POST /api/v1/players/register`
- **Login Teacher**: `POST /api/v1/auth/login`

## Teachers

- **Get Profile**: `GET /api/v1/teachers/me`
- **Update Profile**: `PATCH /api/v1/teachers/me`

## Players

- **Register Player**: `POST /api/v1/players/register`

## Questions

- **Create Question**: `POST /api/v1/questions`
- **Get Questions**: `GET /api/v1/questions`
- **Get Question by ID**: `GET /api/v1/questions/:id`
- **Update Question**: `PUT /api/v1/questions/:id`
- **Delete Question**: `DELETE /api/v1/questions/:id`

## Quiz Templates

- **Create Quiz Template**: `POST /api/v1/quiz-templates`
- **Get Quiz Templates**: `GET /api/v1/quiz-templates`
- **Get Quiz Template by ID**: `GET /api/v1/quiz-templates/:id`

## Game Templates

- **Create Game Template**: `POST /api/v1/game-templates`

## Games

- **Create Game Instance**: `POST /api/v1/games`
- **Get Game Instance by Access Code**: `GET /api/v1/games/:accessCode`
- **Update Game Instance Status**: `PATCH /api/v1/games/:id/status`

## Game Control

- **Get Full Game State**: `GET /api/v1/game-control/:accessCode` (teacher only)

---

## Notes
- All endpoints use JSON for request and response bodies.
- Authentication is handled via JWT tokens in the Authorization header.
- All field names and endpoints are in English.
- Deprecated endpoints and French field names have been removed from the backend and are not documented here.
- For detailed request/response examples, see `rest-api.md`.

---

*This document is up to date as of 2025-05-20. For further details, see code comments in `/src/api/v1/` and usage in frontend/backend logic.*
