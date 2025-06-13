# Game Template Endpoints

### GET /api/v1/game-templates
- **Description**: Get all game templates for the authenticated teacher.
- **Authentication**: Teacher (JWT required, or x-user-id/x-user-role headers)
- **Response**: `{ gameTemplates: [...], meta: { ... } }`
- **Status Codes**: 200, 401, 403, 500

---

### GET /api/v1/game-templates/:id
- **Description**: Get a specific game template by ID (teacher only).
- **Authentication**: Teacher (JWT required, or x-user-id/x-user-role headers)
- **Path Parameters**: `id` (string)
- **Response**: `{ gameTemplate: { ... } }`
- **Status Codes**: 200, 400, 401, 403, 404, 500

---

### POST /api/v1/game-templates
- **Description**: Create a new game template (teacher/admin only). Body must match canonical shared type.
- **Authentication**: Teacher (JWT required, or x-user-id/x-user-role headers)
- **Request Body**: `{ name, discipline, gradeLevel, themes, questions, questionUids, description, defaultMode }`
- **Response**: `{ gameTemplate: { ... } }`
- **Status Codes**: 201, 400, 401, 500

---

### PUT /api/v1/game-templates/:id
- **Description**: Update an existing game template (teacher only).
- **Authentication**: Teacher (JWT required)
- **Path Parameters**: `id` (string)
- **Request Body**: `{ name, discipline, gradeLevel, themes, description, defaultMode, questions }`
- **Response**: `{ message, gameTemplate }`
- **Status Codes**: 200, 400, 401, 404, 500

---

### DELETE /api/v1/game-templates/:id
- **Description**: Delete a game template (teacher only). Supports `force` query param.
- **Authentication**: Teacher (JWT required, or x-user-id/x-user-role headers)
- **Path Parameters**: `id` (string)
- **Query Parameters**: `force` (boolean, optional)
- **Response**: No content (204 on success)
- **Status Codes**: 204, 400, 401, 403, 404, 409, 500
