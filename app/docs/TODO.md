# MathQuest Refactoring TODO

FIRST OF ALL READ THE README.md FILE FOR BEST PRACTICES AND GUIDELINES

## High Priority Tasks

### 0. Read the docs
- [x] Read the documentation in `/docs` folder (ignoring `archive` subfolder) and understand the current state of the codebase. Update this document afterwards if necessary.
- [x] Ensure API documentation reflects the latest backend and frontend changes.

### 1. Fix Type System Issues
- [X] Fix immediate TypeScript build errors
- [X] Establish central shared types repository between frontend and backend: in doubt, ask for help
- [X] Create proper interfaces for all socket event payloads
- [X] Ensure consistent naming conventions in type definitions (English, standardized terms like `text`, `answers`, `time`, `explanation`, `level`, `title`, `username`, `isDeferred`, `userId`, `teacherId`, `socketTouserId`, `status`, `tournamentId`, `difficulty`)
- [ ] Add runtime type validation utilities
- [X] Create type mapping utilities (e.g., `filterQuestionForClient`)
- [ ] Add schema validation for runtime type checking
- [X] Remove redundant type definitions across codebase (e.g., frontend `Question` type, `QuizState.chrono`)
- [X] Eliminate `any` types throughout the codebase (Initial pass completed, ongoing review needed)
- [X] Standardize `question.text` for question content and `question.answers` for answers.
- [X] Ensure `answers` is a mandatory field in `BaseQuestion` and related types.
- [ ] Add deferred mode for students (self-paced, not real-time, can be completed later)

### Next Session Starting Point (May 13, 2025)

- **Review `live/[code]/page.tsx`:**
    - The `currentQuestion.question` in this file appears to be an object, not just the question text.
    - Investigate its structure: `uid: string; question: string; type: string; answers: string[];`
    - This was manually edited. Verify if `question.question` should be `question.text` and if `question.answers` (the string array) is correctly derived/used, especially in relation to `QuestionCard` which now expects a more structured `question` object or a string for text, and `answers` from the `FilteredQuestion` or `Question` types.
    - The `QuestionCard` itself has been updated to expect `question.text` and `question.answers` (from `FilteredQuestion` or `Question`). Ensure the data passed from `live/[code]/page.tsx` to `QuestionCard` aligns with these expectations.
- **Verify `student/practice/session/page.tsx`:**
    - This file was updated to use `text` and `answers` in its `CurrentQuestion` interface and in the props passed to `QuestionCard`.
    - Double-check that `QuestionCard` correctly receives and processes these props. The error `Object literal may only specify known properties, and 'text' does not exist in type 'TournamentQuestion'` was seen before `QuestionCard` was fully updated. This should be resolved now, but verification is good.
- **Continue `any` type removal and type consolidation:**
    - Perform a global search for any remaining `any` types.
    - Review files that import from `@shared/types` to ensure they are using the latest definitions correctly.
- **Address remaining French terms:**
    - Search for terms like `choix_multiple`, `choix_simple`, `entrainement`, `recommencer`, `charger`, etc., in UI-facing strings and potentially in type/enum values if they haven't been anglicized yet.
- **Backend review:**
    - Although a `grep` for `any` was done, a more thorough review of backend files might be needed, especially in `socketEventHandlers` and `tournamentUtils`, to ensure they correctly use the updated shared types (e.g., sending `question.text` and `question.answers`). `sendTournamentQuestion.ts` was updated, but other areas might need attention.

### 2. Standardize Communication Between Frontend and Backend
- [ ] Audit all socket events for consistency in naming and structure
- [X] Create proper typings for all socket events (Initial pass done, ongoing refinement)
- [ ] Optimize payloads to reduce unnecessary data transfer
- [ ] Implement proper error handling for all socket communications

### 3. Complete Current Refactoring Efforts
- [ ] Finish shared logic extraction between quiz mode and tournament mode
- [ ] Complete the refactoring of scoring mechanics
- [ ] Implement proper question presentation logic across all modes
- [ ] Standardize timer and question lifecycle management
- [ ] Eliminate duplicated code between quiz and tournament logic

## Medium Priority Tasks

### 4. Improve Code Quality
- [ ] Remove excessive logging statements
- [ ] Replace all "patch" code with proper fixes
- [ ] Implement proper null checks throughout the codebase
- [ ] Add input validation for all user inputs
- [ ] Standardize error handling throughout the application

### 5. Naming and Organization
- [X] Rename components/functions to clearly differentiate between quiz and tournament modes (Ongoing, e.g. `QuestionCard` vs `TournamentQuestionCard` - though `QuestionCard` seems to be the primary one now)
- [ ] Reorganize folder structure for better code discoverability
- [ ] Create proper module boundaries with explicit exports
- [X] Update documentation to reflect the new organization (Ongoing for type changes)

### 6. Testing
- [ ] Develop unit tests for core business logic
- [ ] Implement integration tests for critical user flows
- [ ] Add automated tests for socket communications
- [ ] Create test utilities for simulating tournament and quiz sessions

## Lower Priority Tasks

### 7. Documentation
- [X] Update all documentation to reflect recent changes (Specifically `type-architecture.md`, `shared-types-guide.md` for `question.text` and other renames)
- [X] Document the shared type system (Initial documentation updated)
- [ ] Create developer onboarding guide
- [ ] Document application architecture and data flow
- [ ] Finalize JavaScript cleanup plan and ensure all `.js` files are either converted to TypeScript or removed if unnecessary.

### 8. Technical Debt
- [ ] Address incomplete features mentioned in docs
- [ ] Refactor legacy code that doesn\'t follow current patterns
- [ ] Review dependencies for security and performance issues
- [ ] Improve build and deployment processes

## Implementation Strategy

- Start with the type system: Fixing types will make all subsequent changes easier and prevent regressions
- Move to socket communications: This will ensure stable data flow between frontend and backend
- Complete refactoring efforts: Finish what\'s been started before moving to new improvements
- Improve code quality: With solid foundations, focus on code quality and removing shortcuts
- Add tests: With a stable codebase, add tests to prevent future regressions
- Update documentation: Document the improved system for future developers
