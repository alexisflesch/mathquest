# Quiz Templates API

This document describes the REST API endpoints for managing quiz templates (game templates) in MathQuest.

## Base Path
`/api/v1/quiz-templates`

---

## Endpoints

### Create a New Quiz Template
- **POST** `/api/v1/quiz-templates`
- **Auth:** Teacher (required)
- **Body:**
  - `name` (string, required)
  - `gradeLevel` (string, optional)
  - `themes` (array of string, required)
  - `discipline` (string, optional)
  - `description` (string, optional)
  - `defaultMode` (string, optional)
  - `questions` (array, optional)
- **Response:** `201 Created` with created template object
- **Errors:** `400`, `401`, `500`

### Get a Quiz Template by ID
- **GET** `/api/v1/quiz-templates/:id`
- **Auth:** Teacher (required)
- **Query:** `includeQuestions` (boolean, optional)
- **Response:** `200 OK` with template object
- **Errors:** `401`, `403`, `404`, `500`

### List Quiz Templates (with Filtering & Pagination)
- **GET** `/api/v1/quiz-templates`
- **Auth:** Teacher (required)
- **Query:**
  - `discipline` (string, optional)
  - `themes` (string or array, optional)
  - `gradeLevel` (string, optional)
  - `page` (number, default 1)
  - `pageSize` (number, default 20)
- **Response:** `200 OK` with paginated list
- **Errors:** `401`, `500`

### Update a Quiz Template
- **PUT** `/api/v1/quiz-templates/:id`
- **Auth:** Teacher (required)
- **Body:** Partial template fields
- **Response:** `200 OK` with updated template
- **Errors:** `401`, `403`, `404`, `500`

### Delete a Quiz Template
- **DELETE** `/api/v1/quiz-templates/:id`
- **Auth:** Teacher (required)
- **Response:** `200 OK` with `{ success: true }`
- **Errors:** `401`, `403`, `404`, `500`

### Add a Question to a Quiz Template
- **POST** `/api/v1/quiz-templates/:id/questions`
- **Auth:** Teacher (required)
- **Body:**
  - `questionUid` (string, required)
  - `sequence` (number, optional)
- **Response:** `200 OK` with updated template
- **Errors:** `401`, `403`, `404`, `500`

### Remove a Question from a Quiz Template
- **DELETE** `/api/v1/quiz-templates/:id/questions/:questionUid`
- **Auth:** Teacher (required)
- **Response:** `200 OK` with updated template
- **Errors:** `401`, `403`, `404`, `500`

### Update Question Sequence in a Quiz Template
- **PUT** `/api/v1/quiz-templates/:id/questions-sequence`
- **Auth:** Teacher (required)
- **Body:**
  - `updates` (array of objects, required)
- **Response:** `200 OK` with updated template
- **Errors:** `401`, `403`, `404`, `500`

---

## Notes
- All endpoints require teacher authentication.
- All responses are JSON.
- See `todo-remove-legacy.md` for any legacy fields or endpoints (none found in this module as of last audit).
