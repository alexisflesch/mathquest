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

### **Unified Registration & Upgrade Endpoints** ✨ *NEW*
- **Universal Registration**: `POST /api/v1/auth/register`
  - Handles guest registration (username + avatar + cookieId)
  - Handles student registration (username + avatar + email + password)
  - Handles teacher registration (username + avatar + email + password + role: "TEACHER")
- **Universal Upgrade**: `POST /api/v1/auth/upgrade`
  - Handles guest→student upgrades (preserves username & avatar)
  - Handles guest→teacher upgrades (preserves username & avatar)
  - Handles student→teacher upgrades

### **Login Endpoints**
- **Teacher Login**: `POST /api/v1/auth` (action: "teacher_login")
- **Student Login**: `POST /api/v1/auth/student/login`

### **Profile Management**
- **Update Profile**: `PUT /api/v1/auth/profile` (username & avatar for authenticated users)
- **Check Auth Status**: `GET /api/v1/auth/status`

### **Password Management**
- **Request Password Reset**: `POST /api/v1/auth/reset-password`
- **Confirm Password Reset**: `POST /api/v1/auth/reset-password/confirm`

### **Legacy Endpoints** ⚠️ *DEPRECATED*
- ~~`POST /api/v1/teachers/register`~~ → Use `/auth/register` with `role: "TEACHER"`
- ~~`POST /api/v1/players/register`~~ → Use `/auth/register` (forwards to unified endpoint)
- ~~`POST /api/v1/auth/student/register`~~ → Use `/auth/register`

## Teachers

- **Get Profile**: `GET /api/v1/teachers/me`
- **Update Profile**: `PATCH /api/v1/teachers/me`

## Players

- **Legacy Player Registration**: `POST /api/v1/players/register` ⚠️ *DEPRECATED*
  - Forwards to unified `/auth/register` endpoint

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
- **4-State Authentication**: The system supports anonymous → guest → student/teacher progression with full profile preservation.
- **Profile Persistence**: Guest profiles are stored in database for reliable upgrades, preventing data loss.
- For detailed request/response examples, see `rest-api.md`.

---

*This document is up to date as of June 2, 2025. For implementation details of the authentication system, see `/docs/authentication-implementation-summary.md`. For further technical details, see code comments in `/src/api/v1/` and usage in frontend/backend logic.*
