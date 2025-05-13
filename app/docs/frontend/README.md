# Frontend Documentation

This directory contains documentation for MathQuest's frontend application.

## Frontend Architecture

The frontend is built with:

- **Next.js** - React framework for server-rendered applications
- **React** - UI library
- **Socket.IO Client** - For real-time communication with the backend
- **TypeScript** - For type safety and better developer experience

## Key Components

- **Quiz Components** - Components for creating and participating in quizzes
- **Tournament Components** - Components for tournament creation and participation
- **Shared UI Components** - Reusable UI components used throughout the application
- **Socket Hooks** - Custom React hooks for socket communication

## State Management

The application uses a combination of:

- **React Context** - For global state management
- **React Hooks** - For local component state
- **Custom Hooks** - For encapsulating complex logic

## Routing Structure

The application uses Next.js App Router for routing:

- `/` - Home page
- `/teacher/...` - Teacher dashboard and quiz/tournament management
- `/student/...` - Student dashboard and quiz/tournament participation

## Related Documentation

- [Custom React Hooks](hooks.md)
- [UI Component Library](components.md)
- [Socket Integration](socket-integration.md)
