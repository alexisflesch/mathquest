# REST API Documentation

This document outlines the REST API endpoints available in the MathQuest application.

## Authentication

### Register Teacher
- **URL:** `/api/v1/auth/register`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Responses:**
  - `201 Created`: Teacher registered successfully
  - `400 Bad Request`: Invalid input
  - `409 Conflict`: Email already exists

### Login Teacher
- **URL:** `/api/v1/auth/login`
- **Method:** `POST`
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "token": "string",
    "teacher": {
      "id": "string",
      "username": "string",
      "email": "string"
    }
  }
  ```
- **Responses:**
  - `200 OK`: Login successful
  - `401 Unauthorized`: Invalid credentials

## Teacher Management

### Get Teacher Profile
- **URL:** `/api/v1/teachers/me`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "string",
    "username": "string",
    "email": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
  ```
- **Responses:**
  - `200 OK`: Profile retrieved successfully
  - `401 Unauthorized`: Not authenticated

### Update Teacher Profile
- **URL:** `/api/v1/teachers/me`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Responses:**
  - `200 OK`: Profile updated successfully
  - `400 Bad Request`: Invalid input
  - `401 Unauthorized`: Not authenticated
  - `409 Conflict`: Email already exists

## Questions

### Create Question
- **URL:** `/api/v1/questions`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "content": "string",
    "type": "string",
    "difficulty": "string",
    "timeLimit": "number",
    "options": [
      {
        "content": "string",
        "isCorrect": "boolean"
      }
    ],
    "explanation": "string",
    "tags": ["string"],
    "theme": "string"
  }
  ```
- **Responses:**
  - `201 Created`: Question created successfully
  - `400 Bad Request`: Invalid input
  - `401 Unauthorized`: Not authenticated

### Get Questions
- **URL:** `/api/v1/questions`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `theme`: Filter by theme
  - `difficulty`: Filter by difficulty
  - `type`: Filter by question type
  - `page`: Page number
  - `limit`: Items per page
- **Response:**
  ```json
  {
    "questions": [
      {
        "id": "string",
        "content": "string",
        "type": "string",
        "difficulty": "string",
        "timeLimit": "number",
        "creatorTeacherId": "string",
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "meta": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  }
  ```
- **Responses:**
  - `200 OK`: Questions retrieved successfully
  - `401 Unauthorized`: Not authenticated

### Get Question by ID
- **URL:** `/api/v1/questions/:id`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "string",
    "content": "string",
    "type": "string",
    "difficulty": "string",
    "timeLimit": "number",
    "options": [
      {
        "id": "string",
        "content": "string",
        "isCorrect": "boolean"
      }
    ],
    "explanation": "string",
    "tags": ["string"],
    "theme": "string",
    "creatorTeacherId": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
  ```
- **Responses:**
  - `200 OK`: Question retrieved successfully
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Question not found

### Update Question
- **URL:** `/api/v1/questions/:id`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** Same as Create Question
- **Responses:**
  - `200 OK`: Question updated successfully
  - `400 Bad Request`: Invalid input
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not authorized to update this question
  - `404 Not Found`: Question not found

### Delete Question
- **URL:** `/api/v1/questions/:id`
- **Method:** `DELETE`
- **Headers:** `Authorization: Bearer <token>`
- **Responses:**
  - `204 No Content`: Question deleted successfully
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not authorized to delete this question
  - `404 Not Found`: Question not found

## Quiz Templates

### Create Quiz Template
- **URL:** `/api/v1/quiz-templates`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "name": "string",
    "description": "string",
    "themes": ["string"],
    "questionIds": ["string"]
  }
  ```
- **Responses:**
  - `201 Created`: Quiz template created successfully
  - `400 Bad Request`: Invalid input
  - `401 Unauthorized`: Not authenticated

### Get Quiz Templates
- **URL:** `/api/v1/quiz-templates`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `theme`: Filter by theme
  - `page`: Page number
  - `limit`: Items per page
- **Response:**
  ```json
  {
    "quizTemplates": [
      {
        "id": "string",
        "name": "string",
        "themes": ["string"],
        "creatorTeacherId": "string",
        "createdAt": "datetime",
        "updatedAt": "datetime",
        "questionCount": "number"
      }
    ],
    "meta": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "pages": "number"
    }
  }
  ```

### Get Quiz Template by ID
- **URL:** `/api/v1/quiz-templates/:id`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "themes": ["string"],
    "questions": [
      {
        "id": "string",
        "content": "string",
        "type": "string",
        "position": "number"
      }
    ],
    "creatorTeacherId": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
  ```

## Game Templates

### Create Game Template
- **URL:** `/api/v1/game-templates`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "name": "string",
    "discipline": "string",
    "gradeLevel": "string",
    "themes": ["string"],
    "description": "string",
    "defaultMode": "quiz | tournament | practice",
    "questions": [
      {
        "questionUid": "string",
        "sequence": "number"
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Game template created successfully",
    "gameTemplate": {
      "id": "string",
      "name": "string",
      "discipline": "string",
      "gradeLevel": "string",
      "themes": ["string"],
      "description": "string",
      "defaultMode": "quiz | tournament | practice",
      "questions": [
        {
          "id": "string",
          "sequence": "number",
          "question": {
            "id": "string",
            "text": "string",
            "type": "multiple-choice | true-false | open-ended",
            "options": ["string"],
            "correctAnswer": "string",
            "explanation": "string",
            "points": "number",
            "timeLimit": "number"
          }
        }
      ],
      "creatorId": "string",
      "createdAt": "datetime"
    }
  }
  ```

### Update Game Template
- **URL:** `/api/v1/game-templates/:id`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "name": "string",
    "discipline": "string",
    "gradeLevel": "string",
    "themes": ["string"],
    "description": "string",
    "defaultMode": "quiz | tournament | practice",
    "questions": [
      {
        "questionUid": "string",
        "sequence": "number"
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Game template updated successfully",
    "gameTemplate": {
      "id": "string",
      "name": "string",
      "discipline": "string",
      "gradeLevel": "string",
      "themes": ["string"],
      "description": "string",
      "defaultMode": "quiz | tournament | practice",
      "questions": [
        {
          "id": "string",
          "sequence": "number",
          "question": {
            "id": "string",
            "text": "string",
            "type": "multiple-choice | true-false | open-ended",
            "options": ["string"],
            "correctAnswer": "string",
            "explanation": "string",
            "points": "number",
            "timeLimit": "number"
          }
        }
      ],
      "creatorId": "string",
      "updatedAt": "datetime"
    }
  }
  ```
- **Responses:**
  - `200 OK`: Game template updated successfully  
  - `401 Unauthorized`: Not authenticated
  - `404 Not Found`: Template not found or no permission to update
  - `500 Internal Server Error`: Server error

## Game Instances

### Create Game Instance
- **URL:** `/api/v1/games`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "quizTemplateId": "string",
    "name": "string",
    "playMode": "class | tournament",
    "settings": {
      "timeMultiplier": "number",
      "showLeaderboard": "boolean"
    }
  }
  ```
- **Response:**
  ```json
  {
    "id": "string",
    "accessCode": "string",
    "name": "string",
    "status": "pending",
    "playMode": "class | tournament",
    "settings": {
      "timeMultiplier": "number",
      "showLeaderboard": "boolean"
    },
    "quizTemplateId": "string",
    "initiatorTeacherId": "string",
    "createdAt": "datetime"
  }
  ```

### Get Game Instance by Access Code
- **URL:** `/api/v1/games/:accessCode`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "id": "string",
    "accessCode": "string",
    "name": "string",
    "status": "pending | active | completed",
    "playMode": "class | tournament",
    "settings": {
      "timeMultiplier": "number",
      "showLeaderboard": "boolean"
    },
    "quizTemplateId": "string",
    "initiatorTeacherId": "string",
    "createdAt": "datetime"
  }
  ```

### Get Game Instance for Editing
- **URL:** `/api/v1/games/instance/:id/edit`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Gets a game instance by ID with full template data including questions for editing purposes
- **Response:**
  ```json
  {
    "gameInstance": {
      "id": "string",
      "name": "string",
      "accessCode": "string",
      "status": "pending | active | paused | completed | archived",
      "playMode": "quiz | tournament | practice",
      "settings": {},
      "initiatorUserId": "string",
      "createdAt": "datetime",
      "gameTemplate": {
        "id": "string",
        "name": "string",
        "themes": ["string"],
        "discipline": "string",
        "gradeLevel": "string",
        "questions": [
          {
            "id": "string",
            "sequence": "number",
            "question": {
              "id": "string",
              "text": "string",
              "type": "multiple-choice | true-false | open-ended",
              "options": ["string"],
              "correctAnswer": "string",
              "explanation": "string",
              "points": "number",
              "timeLimit": "number"
            }
          }
        ]
      }
    }
  }
  ```
- **Responses:**
  - `200 OK`: Game instance retrieved successfully
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not authorized to edit this game (not the creator)
  - `404 Not Found`: Game not found

### Update Game Instance
- **URL:** `/api/v1/games/instance/:id`
- **Method:** `PUT`
- **Headers:** `Authorization: Bearer <token>`
- **Description:** Updates basic game instance information (name, play mode, settings)
- **Body:**
  ```json
  {
    "name": "string",
    "playMode": "quiz | tournament | practice",
    "settings": {}
  }
  ```
- **Response:**
  ```json
  {
    "gameInstance": {
      "id": "string",
      "name": "string",
      "playMode": "quiz | tournament | practice",
      "settings": {},
      "status": "pending",
      "accessCode": "string",
      "gameTemplate": {
        "name": "string",
        "themes": ["string"],
        "discipline": "string",
        "gradeLevel": "string"
      }
    }
  }
  ```
- **Responses:**
  - `200 OK`: Game instance updated successfully
  - `400 Bad Request`: Invalid input or game not in pending status
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not authorized to update this game
  - `404 Not Found`: Game not found

### Update Game Instance Status
- **URL:** `/api/v1/games/:id/status`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "active | completed"
  }
  ```
- **Responses:**
  - `200 OK`: Status updated successfully
  - `401 Unauthorized`: Not authenticated
  - `403 Forbidden`: Not authorized to update this game
  - `404 Not Found`: Game not found

## Implementation Notes

- All endpoints return JSON responses
- Authentication is handled via JWT tokens in the Authorization header
- Pagination is supported on list endpoints
- Error responses include a message field with details
