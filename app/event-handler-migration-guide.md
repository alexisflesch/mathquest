# Event Handler Migration Guide

This guide provides step-by-step instructions for converting JavaScript event handlers to TypeScript in the MathQuest backend.

## Prerequisites

- Ensure all types are defined in `sockets/types/` directory
- Review the template files in `sockets/templates/` directory

## Basic Structure

Each event handler should follow this basic structure:

```typescript
/**
 * handlerName.ts - Brief description
 * 
 * Detailed description of what the handler does
 */

import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { EventPayloadType } from '../types/socketTypes';
import { quizState } from '../quizState';
import { otherImports } from '../otherModule';

// Import logger
const createLogger = require('../../logger');
const logger = createLogger('HandlerName');

/**
 * Handle event_name event
 * 
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param prisma - Prisma database client
 * @param payload - Event payload with appropriate type
 */
async function handleEventName(
    io: Server,
    socket: Socket,
    prisma: PrismaClient,
    payload: EventPayloadType
): Promise<void> {
    // Implementation
}

export default handleEventName;
```

## Step-by-Step Migration Process

1. **Create the TypeScript file** with the same name as the JS file but with `.ts` extension

2. **Copy the JSDoc comments** from the original file to preserve documentation

3. **Add imports** for TypeScript types:
   ```typescript
   import { Server, Socket } from 'socket.io';
   import { PrismaClient } from '@prisma/client';
   import { appropriate types } from '../types/quizTypes';
   import { appropriate payload type } from '../types/socketTypes';
   ```

4. **Convert function signature** to include type annotations:
   ```typescript
   async function handlerName(
       io: Server, 
       socket: Socket, 
       prisma: PrismaClient, 
       { param1, param2 }: PayloadType
   ): Promise<void> {
   ```

5. **Add type annotations** for variables inside the function:
   ```typescript
   const someVariable: SomeType = ...;
   ```

6. **Fix null/undefined checks** to use proper TypeScript syntax:
   ```typescript
   // Before
   if (!someVar) { ... }
   
   // After (more explicit)
   if (someVar === null || someVar === undefined) { ... }
   // or keep if (!someVar) if appropriate
   ```

7. **Use proper TypeScript exports**:
   ```typescript
   export default handlerName;
   ```

## Common Patterns

### Socket Rooms

```typescript
io.to(`room_${id}`).emit('event_name', payload);
socket.join(`room_${id}`);
```

### State Updates

```typescript
quizState[quizId] = {
    ...quizState[quizId],
    updatedProperty: newValue
};
```

### Database Queries

```typescript
const result = await prisma.modelName.findUnique({
    where: { id: someId },
    select: { field1: true, field2: true }
});
```

## Testing the Migration

1. Ensure the TypeScript file compiles without errors
2. Test the event handler functionality to confirm it behaves the same as before
3. Update any imports in other files that reference this handler
4. Mark the file as converted in the migration tracker document
