# API Documentation

This directory contains documentation for MathQuest's API endpoints.

## API Overview

MathQuest primarily uses Socket.IO for real-time communication between the frontend and backend. There are also some REST endpoints for non-real-time operations.

## Socket.IO API

The Socket.IO API is divided into several namespaces and events:

- **Quiz Events** - Events for quiz creation, management, and participation
- **Tournament Events** - Events for tournament creation, management, and participation
- **Lobby Events** - Events for listing and joining quizzes and tournaments

See [socket-events.md](socket-events.md) for a complete list of events and their payloads.

## REST API

The REST API provides endpoints for:

- Authentication
- User management
- Quiz management (CRUD operations)
- Tournament management
- Question management

See [rest-api.md](rest-api.md) for a complete list of endpoints and their request/response formats.

## API Usage Examples

- [Authentication Example](examples/authentication.md)
- [Quiz Management Example](examples/quiz-management.md)
- [Tournament Example](examples/tournament.md)
