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
- [X] Ensure consistent naming conventions in type definitions  
- [X] Add runtime type validation utilities
- [X] Create type mapping utilities
- [X] Add schema validation for runtime type checking
- [ ] Remove redundant type definitions across codebase  
- [ ] Eliminate any `any` types throughout the codebase  

### 2. Standardize Communication Between Frontend and Backend
- [ ] Audit all socket events for consistency in naming and structure  
- [ ] Create proper typings for all socket events  
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
- [ ] Rename components/functions to clearly differentiate between quiz and tournament modes  
- [ ] Reorganize folder structure for better code discoverability  
- [ ] Create proper module boundaries with explicit exports  
- [ ] Update documentation to reflect the new organization  

### 6. Testing
- [ ] Develop unit tests for core business logic  
- [ ] Implement integration tests for critical user flows  
- [ ] Add automated tests for socket communications  
- [ ] Create test utilities for simulating tournament and quiz sessions  

## Lower Priority Tasks

### 7. Documentation
- [ ] Update all documentation to reflect recent changes  
- [ ] Document the shared type system  
- [ ] Create developer onboarding guide  
- [ ] Document application architecture and data flow  
- [ ] Finalize JavaScript cleanup plan and ensure all `.js` files are either converted to TypeScript or removed if unnecessary.  

### 8. Technical Debt
- [ ] Address incomplete features mentioned in docs  
- [ ] Refactor legacy code that doesn't follow current patterns  
- [ ] Review dependencies for security and performance issues  
- [ ] Improve build and deployment processes  

## Implementation Strategy

- Start with the type system: Fixing types will make all subsequent changes easier and prevent regressions  
- Move to socket communications: This will ensure stable data flow between frontend and backend  
- Complete refactoring efforts: Finish what's been started before moving to new improvements  
- Improve code quality: With solid foundations, focus on code quality and removing shortcuts  
- Add tests: With a stable codebase, add tests to prevent future regressions  
- Update documentation: Document the improved system for future developers
