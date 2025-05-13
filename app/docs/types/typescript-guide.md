# TypeScript Migration and Implementation Guide

*Last updated: May 12, 2025*

This document serves as the comprehensive guide for the TypeScript migration and implementation in the MathQuest project. It consolidates information from multiple previously separate documents.

## Table of Contents
1. [Migration Status and Progress](#migration-status-and-progress)
2. [Conversion Strategy](#conversion-strategy)
3. [Implementation Steps](#implementation-steps)
4. [Type Definitions](#type-definitions)
5. [Handler Migration](#handler-migration)
6. [Testing Strategy](#testing-strategy)
7. [Future Work](#future-work)
   - [Incremental Type Strictness](#incremental-type-strictness)
   - [ESLint and TypeScript Configuration](#eslint-and-typescript-build-configuration)
   - [Socket.IO TypeScript Integration](#socketio-typescript-integration)

## Migration Status and Progress

### Completed Work

#### Infrastructure Setup
- Created `tsconfig.backend.json` with appropriate compiler options
- Updated `package.json` with TypeScript-compatible scripts
- Installed necessary TypeScript dependencies

#### Type Definition Creation
- Created `sockets/types/quizTypes.ts` with core interface definitions
- Created `sockets/types/tournamentTypes.ts` with tournament interfaces
- Created `sockets/types/socketTypes.ts` with event payload types

#### Core Module Conversion
- Converted `quizState.js` → `quizState.ts`
- Converted `quizUtils.js` → `quizUtils.ts`
- Converted `tournamentUtils/tournamentState.js` → `tournamentUtils/tournamentState.ts`
- Fixed `quizEvents.js` → `quizEvents.ts` with proper ES imports
- Fixed `tournamentEvents.js` → `tournamentEvents.ts` with ES imports
- Fixed import/export patterns in all socket event handlers

#### Socket.IO Infrastructure
- Created centralized socket configuration in `frontend/src/config.ts`
- Enhanced Socket.IO server configuration in `backend/server.ts`
- Created comprehensive socket testing tools
- Added TypeScript interfaces for socket events
- Fixed socket connection issues after restructuring into separate directories

#### Event Handler Conversion
- Converted critical handlers:
  - `setQuestionHandler.js` → `setQuestionHandler.ts`
  - `timerActionHandler.js` → `timerActionHandler.ts`
  - `setTimerHandler.js` → `setTimerHandler.ts`
  - `lockHandler.js` → `lockHandler.ts`
  - `unlockHandler.js` → `unlockHandler.ts`
  - `endHandler.js` → `endHandler.ts`
  - `pauseHandler.js` → `pauseHandler.ts`
  - `resumeHandler.js` → `resumeHandler.ts`

### Next Steps

1. **Convert Quiz Event Handlers** (In Progress)
   - Continue with remaining handlers in `/sockets/quizEventHandlers/`:
     - Prioritize `closeQuestionHandler.js` next
     - Then `joinQuizHandler.js` and other authentication-related handlers
   - Use the template and guide created in `sockets/templates/`

2. **Convert Core Socket Registration** (Partially Completed)
   - Continue updating imports as more handlers are converted
   - Next, convert `tournamentEvents.js` to TypeScript

3. **Convert Tournament Handlers**
   - Convert handlers in `/sockets/tournamentEventHandlers/`
   - Convert tournament utilities in `/sockets/tournamentUtils/`

## Conversion Strategy

### File Organization
- Keep the same directory structure
- Rename files from `.js` to `.ts` during conversion
- Create types in dedicated `types/` directories
- Use path aliases for cleaner imports

### Type Definitions
- Define interfaces for all major data structures
- Use union types for related values
- Create type guards for runtime type checking
- Start with loose types and gradually make them stricter

## Implementation Steps

For each file to convert:

1. Create the TypeScript file in the same directory
2. Copy over the content and convert it to TypeScript
3. Update imports and exports to TypeScript syntax
4. Add appropriate type annotations
5. Test compilation and functionality
6. Update any references to the file in other modules

### Handler Migration Steps

1. **Create TypeScript file**
   - Create a new `.ts` file alongside the `.js` file
   - Copy content from the JavaScript file

2. **Update imports**
   - Convert CommonJS `require()` to ES6 `import`
   - Update paths using aliases where appropriate
   ```typescript
   // Before
   const { Server } = require('socket.io');
   const logger = require('../../logger');
   
   // After
   import { Server, Socket } from 'socket.io';
   import createLogger from '@logger';
   ```

3. **Add type annotations**
   - Add parameter types
   - Add return types
   - Add interface imports
   ```typescript
   // Before
   function handleSetQuestion(io, socket, data, quizState) {
     // handler code
   }
   
   // After
   import { SetQuestionPayload } from '../types/socketTypes';
   import { QuizState } from '../types/quizTypes';
   
   function handleSetQuestion(
     io: Server, 
     socket: Socket, 
     data: SetQuestionPayload, 
     quizState: QuizState
   ): void {
     // handler code
   }
   ```

4. **Update exports**
   - Convert CommonJS `module.exports` to ES6 `export default`
   ```typescript
   // Before
   module.exports = handleSetQuestion;
   
   // After
   export default handleSetQuestion;
   ```

5. **Fix null/undefined checks** to use proper TypeScript syntax:
   ```typescript
   // Before
   if (!someVar) { ... }
   
   // After (more explicit)
   if (someVar === null || someVar === undefined) { ... }
   // or keep if (!someVar) if appropriate
   ```

6. **Common TypeScript Patterns**

   **Socket Rooms**
   ```typescript
   io.to(`room_${id}`).emit('event_name', payload);
   socket.join(`room_${id}`);
   ```

   **State Updates**
   ```typescript
   quizState[quizId] = {
       ...quizState[quizId],
       updatedProperty: newValue
   };
   ```

   **Database Queries**
   ```typescript
   const result = await prisma.modelName.findUnique({
       where: { id: someId },
       select: { field1: true, field2: true }
   });
   ```

7. **Test and refine**
   - Run TypeScript compiler to check for errors
   - Test functionality
   - Refine types as needed
   - Mark the file as converted in the migration tracker

## Type Definitions

### Core Type Interfaces

```typescript
// Key interfaces from sockets/types/quizTypes.ts
export interface QuizState {
  id?: string;
  quizId?: string;
  currentQuestionUid: string | null;
  currentQuestionIdx?: number | null;
  questions: Question[];
  chrono: Chrono;
  locked: boolean;
  ended: boolean;
  // Additional properties defined
}

// Key interfaces from sockets/types/socketTypes.ts
export interface SetQuestionPayload {
  questionUid: string;
  quizId: string;
}

export interface TimerActionPayload {
  action: 'play' | 'pause' | 'stop';
  quizId: string;
}
```

## Testing Strategy

### Unit Testing
1. Compile TypeScript code with `tsc` to check for type errors
2. Test each handler's functionality in isolation
3. Verify type safety catches common errors

### Integration Testing
1. Run the server in development mode with `npm run dev:ts`
2. Test frontend-backend interactions
3. Verify functionality of converted handlers

### Manual Testing Procedure
- **Server**: Run with `npm run dev:ts`
- **Browser**: Access at http://localhost:3000
- **Tools**: Browser developer console for monitoring Socket.IO events

#### Testing Converted Handlers

1. **Core State Management**
   - Verify `quizState.ts` and `quizUtils.ts` integrate with remaining JS modules
   - Verify `tournamentUtils/tournamentState.ts` functions properly

2. **Quiz Management Handlers**
   - Test each converted handler:
     - Create a quiz
     - Set questions
     - Start/pause/resume timers
     - Handle student answers
     - End quiz
   - Verify state updates correctly
   - Check socket events are emitted properly

## Future Work

### Incremental Type Strictness

Once basic migration is complete:

1. Update `tsconfig.backend.json` to enable:
   ```json
   "strict": true,
   "noImplicitAny": true,
   "strictNullChecks": true
   ```

2. Address type issues one by one:
   - Fix `any` types with more specific types
   - Add explicit null checks
   - Add type guards for safer type assertions

### ESLint and TypeScript Build Configuration

The project is configured to run ESLint and TypeScript checks during the build process, ensuring code quality and type safety.

#### Next.js Configuration

In `frontend/next.config.ts`, we enforce linting and type checking:

```typescript
{
  eslint: {
    // Enforce strict linting
    dirs: ['.'],
  },
  typescript: {
    // Enforce strict type checking
  }
}
```

#### ESLint Configuration

The ESLint configuration is set up in `frontend/.eslintrc.json` with the following settings:

```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "plugins": ["react-hooks", "@typescript-eslint"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### Running Linting Manually

To run ESLint checks manually:

```bash
cd frontend
npm run lint
```

#### Future Considerations

Once the codebase is stabilized and unused variables/imports are cleaned up, consider:

1. Setting `ignoreDuringBuilds` back to `false` for both ESLint and TypeScript
2. Addressing all the warnings about unused variables and imports
3. Fixing any rule violations for React hooks dependencies

### Socket.IO TypeScript Integration

For detailed information on Socket.IO TypeScript integration, including best practices, configuration, and type safety guidelines, see [socket-guide.md](./socket-guide.md).
