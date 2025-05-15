# LEGACY Backend Documentation

**ARCHIVED - REFERS TO LEGACY CODE**

This documentation refers to the original MathQuest backend implementation that was archived on May 14, 2025. The code this documentation refers to is available in the `/backend-backup` directory.

These documents are kept for historical purposes only and should **not** be used as guidance for the current backend implementation.

## Backend Architecture

The backend is built with:

- **Node.js** - JavaScript runtime
- **Socket.IO** - For real-time communication with clients
- **TypeScript** - For type safety and better developer experience
- **Prisma** - ORM for database operations

## Key Components

- **Socket Handlers** - Handlers for socket events
- **Quiz Logic** - Business logic for quiz management
- **Tournament Logic** - Business logic for tournament management
- **Authentication** - User authentication and authorization
- **Database Access** - Data access layer using Prisma

## State Management

The backend maintains state for:

- Active quizzes
- Active tournaments
- Connected users
- User sessions

## Event Flow

1. Client emits event to server
2. Server processes event and updates state
3. Server emits events to relevant clients
4. Clients update their state based on received events

## Related Documentation

- [Socket Event Handlers](socket-handlers.md)
- [Quiz Logic](quiz-logic.md)
- [Tournament Logic](tournament-logic.md)
- [Database Schema](database-schema.md)
