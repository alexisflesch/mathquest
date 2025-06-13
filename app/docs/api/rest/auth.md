# Authentication Endpoints

### POST /api/v1/auth
- **Description**: Handles authentication actions (login, teacher login, teacher registration).
- **Request Body**:
  - `action`: string (`login`, `teacher_login`, `teacher_register`, etc.)
  - `email`: string (required for login)
  - `password`: string (required for login)
  - `username`: string (required for registration)
  - `adminPassword`: string (required for teacher registration)
  - `avatar`: string (optional, for registration)
- **Response**:
  - On success: User info, JWT token, and role-specific fields
  - On error: JSON error message
- **Authentication**: None (for login/register)

#### Example: Login
```json
{
  "action": "login",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Example: Teacher Registration
```json
{
  "action": "teacher_register",
  "username": "teacher1",
  "email": "teacher1@example.com",
  "password": "securepass",
  "adminPassword": "admin123",
  "avatar": "🦉"
}
```
