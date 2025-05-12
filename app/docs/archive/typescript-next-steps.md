# TypeScript Migration Next Steps

## Priority tasks for continuing the migration

1. **Convert Quiz Event Handlers** (In Progress)
   - ✅ Converted critical handlers:
     - `setQuestionHandler.js` → `setQuestionHandler.ts`
     - `timerActionHandler.js` → `timerActionHandler.ts`
     - `setTimerHandler.js` → `setTimerHandler.ts`
     - `lockHandler.js` → `lockHandler.ts`
     - `unlockHandler.js` → `unlockHandler.ts`
     - `endHandler.js` → `endHandler.ts`
     - `pauseHandler.js` → `pauseHandler.ts`
     - `resumeHandler.js` → `resumeHandler.ts`
   - Continue with remaining handlers in `/sockets/quizEventHandlers/`:
     - Prioritize `closeQuestionHandler.js` next
     - Then `joinQuizHandler.js` and other authentication-related handlers
   - Use the template and guide created in `sockets/templates/` and `event-handler-migration-guide.md`

2. **Convert Core Socket Registration** (Partially Completed)
   - ✅ Converted `quizEvents.js` to TypeScript with mixed imports
   - ✅ Updated imports in `quizEvents.ts` for pause and resume handlers
   - Continue updating imports as more handlers are converted
   - Next, convert `tournamentEvents.js` to TypeScript

3. **Convert Tournament Handlers**
   - Convert handlers in `/sockets/tournamentEventHandlers/`
   - Convert tournament utilities in `/sockets/tournamentUtils/`

4. **Enable TypeScript Compilation**
   - ✅ Test TypeScript compilation with `npm run build:backend` 
   - ✅ Fixed compilation errors in converted handlers
   - ✅ Improved QuizState interface with additional properties
   - ✅ Run the server with `npm run dev:ts` to test in development mode 
   - ✅ Server running successfully with TypeScript support

5. **Refine Types**
   - Make types more specific where possible
   - Add missing type annotations
   - Incrementally enable stricter TypeScript options

## Implementation Steps

For each file to convert:

1. Create the TypeScript file in the same directory
2. Copy over the content and convert it to TypeScript
3. Update imports and exports to TypeScript syntax
4. Add appropriate type annotations
5. Test compilation and functionality
6. Update any references to the file in other modules
7. Mark the file as converted in the tracker document

## Incremental Type Strictness

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

## Testing Strategy

1. Compile TypeScript code with `tsc` to check for type errors
2. Run the server in development mode to verify functionality
3. Test each feature in the UI
4. Monitor error logs for any issues
