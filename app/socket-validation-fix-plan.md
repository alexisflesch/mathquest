# Socket Validation Fix Plan

## Critical Issues Identified (431 total)
- 48 missing Zod validation in socket handlers
- 158 hardcoded event names instead of SOCKET_EVENTS constants  
- 106 emitters not using shared types
- 15 missing type guards
- 52 undocumented handlers
- 52 handlers with `any`-typed payloads

## Fix Strategy

### Phase 1: Critical Security Issues (Priority 1)
1. **Missing Zod Validation (48 handlers)**
   - Add Zod validation to all socket handlers
   - Use shared schemas from `socketEvents.zod.ts`
   - Implement proper error handling and responses

2. **Any-typed Payloads (52 handlers)**
   - Replace `any` types with proper shared types
   - Add proper TypeScript interfaces
   - Ensure type safety throughout

### Phase 2: Type Safety & Consistency (Priority 2) 
3. **Emitters Not Using Shared Types (106 cases)**
   - Replace local types with shared payload types
   - Ensure all socket emissions use consistent interfaces
   - Update import statements to use shared types

4. **Missing Type Guards (15 handlers)**
   - Add runtime type validation functions
   - Implement proper type narrowing
   - Add validation for complex payload structures

### Phase 3: Code Quality & Maintainability (Priority 3)
5. **Hardcoded Event Names (158 occurrences)**
   - Replace string literals with SOCKET_EVENTS constants
   - Update all socket.on() and socket.emit() calls
   - Ensure consistent event naming

6. **Undocumented Handlers (52 handlers)**
   - Add JSDoc comments for all socket handlers
   - Document payload types and return values
   - Add usage examples where appropriate

## Implementation Files to Modify

### Backend Socket Handlers
- `/backend/src/sockets/handlers/teacherControl/*.ts`
- `/backend/src/sockets/handlers/student/*.ts` 
- `/backend/src/sockets/handlers/projector/*.ts`
- `/backend/src/sockets/handlers/tournament/*.ts`

### Frontend Socket Hooks
- `/frontend/src/hooks/useStudentGameSocket.ts`
- `/frontend/src/hooks/useEnhancedStudentGameSocket.ts`
- `/frontend/src/hooks/useTeacherDashboardSocket.ts`
- `/frontend/src/hooks/useProjectorSocket.ts`

### Shared Types Enhancement
- `/shared/types/socket/payloads.ts`
- `/shared/types/socketEvents.zod.ts`
- `/shared/types/socket/events.ts`

## Validation & Testing
- Run socket-payload-validator.js after each phase
- Ensure all tests pass after modifications
- Validate runtime behavior with manual testing
- Check for any breaking changes

## Success Metrics
- Zero missing Zod validation errors
- Zero hardcoded event names
- Zero `any`-typed payloads
- All emitters using shared types
- All handlers properly documented
- All type guards implemented
