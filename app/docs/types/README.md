# Type System Documentation

This directory contains documentation for MathQuest's shared type system.

## Type System Architecture

The type system is organized around a central shared types repository that serves both frontend and backend code.

## Folder Structure

```
app/
├── shared/
│   └── types/                  # Central shared types repository
│       ├── index.ts            # Main entry point for all shared types
│       ├── question.ts         # Base question types
│       ├── quiz/               # Quiz-related types
│       ├── socket/             # Socket-related types
│       ├── tournament/         # Tournament-related types
│       └── util/               # Utility types
```

## Key Type Definitions

- **Question Types** - Types for quiz and tournament questions
- **State Types** - Types for quiz and tournament state
- **Socket Payload Types** - Types for socket event payloads
- **Utility Types** - Type utilities and helpers

## Type Utilities

The type system includes several utilities:

- **Type Guards** - Functions for runtime type checking
- **Type Error Helpers** - Utilities for consistent error handling
- **Type Mapping** - Utilities for mapping between different type structures
- **Schema Validation** - Lightweight schema validation utilities

## Related Documentation

- [Type Architecture](type-architecture.md) - Detailed overview of the type system
- [Shared Types Guide](shared-types-guide.md) - Guide to using the shared types
- [Schema Validation](schema-validation.md) - Guide to using schema validation
