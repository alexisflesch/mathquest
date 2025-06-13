# Student Endpoints

### POST /api/v1/student
- **Description**: Handles student actions (currently only `join`).
- **Request Body**:
  - `action`: string (must be `join`)
  - `username`: string (required)
  - `avatar`: string (optional, must be valid animal emoji)
  - `cookie_id`: string (optional, for tracking)
- **Response**:
  - On success: `{ message, user: { id, username, avatar } }`
  - On error: JSON error message
- **Status Codes**: 201, 400, 409, 500

#### Example Request
```json
{
  "action": "join",
  "username": "student42",
  "avatar": "🦉"
}
```
