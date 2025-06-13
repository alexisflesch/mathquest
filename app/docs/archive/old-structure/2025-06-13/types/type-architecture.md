# MathQuest Type Architecture

## Overview

This document explains the architecture of shared types in the MathQuest application. The type system is designed around a central shared types repository that serves both frontend and backend code.

## Folder Structure

```
app/
├── shared/
│   └── types/                  # Central shared types repository
│       ├── index.ts            # Main entry point for all shared types
│       ├── question.ts         # Base question types
│       ├── quiz/               # Quiz-related types
│       │   ├── question.ts     # Extended question types
│       │   ├── state.ts        # Quiz state types
│       │   └── liveQuestion.ts # Live quiz question types
│       ├── socket/             # Socket-related types
│       │   └── payloads.ts     # Socket event payload types
│       ├── tournament/         # Tournament-related types
│       │   ├── participant.ts  # Participant types
│       │   └── state.ts        # Tournament state types
│       └── util/               # Utility types
│           └── logger.ts       # Logger interface types
```

## Import Patterns

### Frontend Imports

From frontend code, import shared types using:

```typescript
// Direct imports from shared types
import { Question, Answer } from '@shared/types';

// Or specific imports when needed
import { BaseQuestion } from '@shared/types/question';
```

### Backend Imports

From backend code, import shared types using:

```typescript
// Direct imports from shared types
import { Question, Answer } from '@shared/types';

// Or specific imports when needed
import { BaseQuestion } from '@shared/types/question';
```

## Type Hierarchy

### Question Types

1. **Base Types** (`question.ts`)
   - `Answer`: Core answer structure
   - `BaseQuestion`: Basic question structure

2. **Extended Types** (`quiz/question.ts`)
   - `Question`: Extends `BaseQuestion` with additional properties

### State Types

1. **Quiz State** (`quiz/state.ts`)
   - `BaseQuizState`: Common state properties
   - `ExtendedQuizState`: Backend-specific state properties
   - `Chrono`: Timer state
   - `QuestionTimer`: Question timer state

2. **Tournament State** (`tournament/state.ts`)
   - `TournamentState`: Tournament state properties

### Socket Related Types

1. **Event Constants** (`socket/events.ts`)
   - Constants for all socket event names ensuring consistency
   - Grouped by category: QUIZ_EVENTS, TOURNAMENT_EVENTS, LOBBY_EVENTS

2. **Payload Types** (`socket/payloads.ts`)
   - Interface definitions for all socket event payloads
   - Ensures consistent structure between frontend and backend

### Utility Types and Helpers

1. **Type Guards** (`util/typeGuards.ts`)
   - Runtime type checking utilities
   - Functions like `isQuestion`, `isAnswer`, etc.

2. **Type Error Helpers** (`util/typeErrors.ts`)
   - Standardized error handling for type-related issues
   - Functions like `assertType`, `assertDefined`, etc.

3. **Type Mapping Utilities** (`util/typeMapping.ts`)
   - Utilities for mapping between different structures
   - Functions like `mapToStandardQuestion`, `mapToStandardAnswer`

4. **Schema Validation** (`util/schemaValidation.ts`, `util/schemaDefinitions.ts`)
   - Lightweight schema validation for runtime type checking
   - Schema definitions for common types
   - Functions like `validateSchema`, `createValidator`

## Best Practices

1. **Use Re-exports**: Always import from `@shared/types` when possible
2. **Type Extensions**: Extend shared types rather than duplicating them
3. **Type Guards**: Use type guards when working with potentially inconsistent data
4. **Documentation**: Document any extensions to shared types
5. **Default Properties**: When reading potentially missing properties, use nullish coalescing

## Common Patterns

### Handling Question Text Fields

```typescript
// Example of accessing question text safely, preferring the standardized 'text' field:
const questionText = question.text || ''; // Standardized
```

### Working with Answer Options

```typescript
// Handle answer options which might be in different fields
const options = question.reponses || question.answers || [];
```

## Migration Strategy

When adding new types:

1. First add them to the shared types repository
2. Update any dependent types to use the shared types
3. Update documentation to reflect the new types

## Future Improvements

1. Create stronger validation utilities for runtime type checking
2. Add more specific types for socket event responses
3. Generate API documentation from the type definitions
