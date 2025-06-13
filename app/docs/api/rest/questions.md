# Question Endpoints

### POST /api/v1/questions
- **Description**: Create a new question. Requires teacher authentication.
- **Authentication**: Teacher (JWT required)
- **Request Body**: Must match canonical shared type (see Zod schema in shared/types/quiz/question.zod)
- **Response**: `{ question: { ... } }`
- **Status Codes**: 201, 400, 401, 500

---

### GET /api/v1/questions/filters
- **Description**: Get available filter values (disciplines, grade levels, themes). Optional query params: `niveau`, `discipline`.
- **Authentication**: None
- **Response**: Filter values
- **Status Codes**: 200, 500

---

### GET /api/v1/questions/list
- **Description**: Get question UIDs with filtering (public, for students). Query: `niveau`, `discipline`, `themes`, `limit`.
- **Authentication**: None
- **Response**: Array of question UIDs
- **Status Codes**: 200, 500

---

### GET /api/v1/questions/:uid
- **Description**: Get a question by UID. Hidden questions only visible to teachers.
- **Authentication**: Optional
- **Path Parameters**: `uid` (string)
- **Response**: `{ question: { ... } }`
- **Status Codes**: 200, 404, 500

---

### GET /api/v1/questions
- **Description**: Get all questions with filtering and pagination. Requires teacher authentication. Query: `discipline`, `theme`, `themes`, `level`, `gradeLevel`, `author`, `difficulty`, `tags`, `questionType`, `includeHidden`, `page`, `pageSize`.
- **Authentication**: Teacher (JWT required)
- **Response**: Paginated questions
- **Status Codes**: 200, 500

---

### PUT /api/v1/questions/:uid
- **Description**: Update a question. Requires teacher authentication. Body must match canonical shared type (partial allowed).
- **Authentication**: Teacher (JWT required)
- **Path Parameters**: `uid` (string)
- **Response**: `{ question: { ... } }`
- **Status Codes**: 200, 400, 401, 404, 500

---

### DELETE /api/v1/questions/:uid
- **Description**: Delete a question. Requires teacher authentication.
- **Authentication**: Teacher (JWT required)
- **Path Parameters**: `uid` (string)
- **Response**: `{ success: true }`
- **Status Codes**: 200, 401, 404, 500
