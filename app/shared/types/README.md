# MathQuest Shared Types

This directory contains the central shared types repository for the MathQuest application. These types are used by both the frontend and backend to ensure consistency.

## Directory Structure

- `index.ts`: Main entry point that re-exports all types
- `question.ts`: Base question types
- `quiz/`: Quiz-related types
  - `question.ts`: Extended question types
  - `state.ts`: Quiz state types
  - `liveQuestion.ts`: Live quiz question types
- `socket/`: Socket-related types
  - `events.ts`: Socket event name constants
  - `payloads.ts`: Socket event payload types
- `tournament/`: Tournament-related types
  - `participant.ts`: Participant types
  - `state.ts`: Tournament state types
- `util/`: Utility types and functions
  - `logger.ts`: Logger interface types
  - `typeGuards.ts`: Type guards for runtime checks
  - `typeErrors.ts`: Error handling utilities
  - `typeMapping.ts`: Type conversion utilities
  - `schemaValidation.ts`: Schema validation utilities
  - `schemaDefinitions.ts`: Schema definitions for common types
- `examples/`: Usage examples

## Usage

Import shared types using the `@shared/types` alias:

```typescript
import { 
  Question, 
  Answer, 
  QUIZ_EVENTS, 
  isQuestion,
  mapToStandardQuestion 
} from '@shared/types';
```

For more specific imports, you can import directly from the individual files:

```typescript
import { BaseQuestion } from '@shared/types/question';
import { validateQuestion } from '@shared/types/util/schemaDefinitions';
```

## Documentation

For detailed documentation on using the shared types, see:

- `/docs/type-architecture.md`: Overview of the type architecture
- `/docs/shared-types-guide.md`: Guide to using shared types
- `/shared/types/examples/usage.tsx`: Example usage in code

## Development Guidelines

When extending or modifying the shared types:

1. Keep types minimal and focused
2. Avoid circular dependencies
3. Use clear, descriptive names
4. Add JSDoc comments for complex types
5. Export from `index.ts` for ease of use
6. Update the documentation when making significant changes

## Type Validation Tools

The shared types repository includes several tools for runtime type validation:

- **Type Guards**: Use functions like `isQuestion` for basic type checking
- **Type Mapping**: Use functions like `mapToStandardQuestion` to convert between type formats
- **Schema Validation**: Use the schema validation utilities for complex validation requirements
