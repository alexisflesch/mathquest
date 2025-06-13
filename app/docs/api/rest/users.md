# User Endpoints

### GET /api/v1/users/:userId
- **Description**: Get user by ID (public, no sensitive info).
- **Authentication**: Optional
- **Path Parameters**: `userId` (string)
- **Response**: `{ id, username, email, role, avatarEmoji, createdAt }`
- **Status Codes**: 200, 400, 404, 500
