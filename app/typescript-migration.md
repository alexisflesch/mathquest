# TypeScript Migration for MathQuest Backend

## Important Guidelines
- Keep code DRY
- Don't "patch", fix the root cause
- Comment out existing patches when converting to TypeScript
- Ask for confirmation if unsure
- README.md contains main doc along with:
  - `hook.md`: Core hooks in MathQuest
  - `backend.md`: Backend architecture
  - `frontend.md`: Frontend architecture

## Phase 1: Preparation and Analysis

### 1.1 Project Setup (Completed)
- [x] Create a new branch `typescript-migration`
- [x] Install TypeScript and required dev dependencies:
  ```bash
  npm install --save-dev @types/express @types/socket.io ts-node-dev
  ```
  Note: TypeScript and @types/node were already installed.
  
- [x] Configure `tsconfig.backend.json` with appropriate settings:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "CommonJS",
      "allowJs": true,
      "checkJs": false,
      "outDir": "./dist",
      "rootDir": "./",
      "strict": false,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"],
        "@logger": ["logger.js"]
      }
    },
    "include": ["sockets/**/*.ts", "sockets/**/*.js", "server.js", "logger.js", "db/**/*.js"],
    "exclude": ["node_modules", "dist", "src"]
  }
  ```
  
- [x] Set up build scripts in `package.json`:
  ```json
  "scripts": {
    "dev": "LOG_LEVEL=DEBUG node server.js",
    "dev:ts": "LOG_LEVEL=DEBUG ts-node-dev --project tsconfig.backend.json server.js",
    "build": "next build",
    "build:backend": "tsc --project tsconfig.backend.json",
    "start": "next start",
    "start:backend": "node dist/server.js"
  }
  ```

### 1.2 Codebase Analysis (Completed)
- [x] Create inventory of all files to be converted
- [x] Identify core modules and dependencies between them
- [x] Document key data structures and their usage patterns
- [x] Map socket events and their handlers
- [x] Analyze third-party dependencies and their TypeScript support

### 1.3 Type Definition Planning (Completed)
- [x] Design interface for `QuizState` object
- [x] Design interface for `QuestionTimer` and related structures
- [x] Create type definitions for quiz event payloads
- [x] Define types for tournament data structures
- [x] Plan shared type directory structure

## Phase 2: Core Infrastructure Migration

### 2.1 Create Type Definitions (Completed)
- [x] Create `sockets/types/` directory
- [x] Create `sockets/types/quizTypes.ts` with:
  ```typescript
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
  ```
- [x] Create `sockets/types/tournamentTypes.ts` with tournament interfaces
- [x] Create `sockets/types/socketTypes.ts` with event payload types
  ```
- [ ] Define socket event types in `types/socketTypes.ts`
- [ ] Create utility type helpers (e.g., for socket.io events)

### 2.2 Migrate Core State Management
- [ ] Convert `quizState.js` → `quizState.ts`
- [x] Convert `quizState.js` → `quizState.ts` with TypeScript types
- [x] Convert `quizUtils.js` → `quizUtils.ts` with proper type annotations
- [x] Convert `tournamentUtils/tournamentState.js` → `tournamentUtils/tournamentState.ts`
- [x] Update exports to use TypeScript syntax

### 2.3 Setup Socket Infrastructure
- [ ] Convert socket initialization code to TypeScript
- [ ] Type socket.io event registration
- [ ] Create typed event emitter wrappers

## Phase 3: Incremental Module Migration (4-6 weeks)

### 3.1 Migrate Event Handlers
- [ ] Convert timer-related handlers first (highest impact)
- [ ] Convert quiz state management handlers
- [ ] Convert tournament-related handlers
- [ ] Convert user authentication handlers

### 3.2 Migrate API Routes
- [ ] Convert Express route definitions to TypeScript
- [ ] Add request and response typing
- [ ] Type middleware functions

### 3.3 Database Interactions
- [ ] Add types for database models
- [ ] Type Prisma client interactions
- [ ] Convert database utility functions

## Phase 4: Testing and Refinement (2-3 weeks)

### 4.1 Testing
- [ ] Setup Jest or Mocha with TypeScript
- [ ] Create unit tests for core modules
- [ ] Add integration tests for key workflows
- [ ] Implement CI pipeline for TypeScript build

### 4.2 Type Refinement
- [ ] Enable stricter TypeScript options incrementally:
  ```json
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
  ```
- [ ] Address issues revealed by stricter typing
- [ ] Refine generic types and utility types
- [ ] Add JSDoc comments for improved documentation

### 4.3 Performance Optimization
- [ ] Review compiled JavaScript output
- [ ] Optimize TypeScript code for performance
- [ ] Address any TypeScript-specific bottlenecks

## Phase 5: Deployment and Monitoring (1-2 weeks)

### 5.1 Build System
- [ ] Finalize production build process
- [ ] Setup source maps for debugging
- [ ] Configure TypeScript for production optimization

### 5.2 Deployment
- [ ] Test TypeScript build in staging environment
- [ ] Create deployment documentation
- [ ] Plan production rollout strategy

### 5.3 Post-Deployment
- [ ] Monitor for TypeScript-related issues
- [ ] Document any runtime differences
- [ ] Collect metrics on performance impact

## Risk Management

### Potential Challenges
- Complex socket.io event typing
- Dynamic access patterns that are difficult to type
- Third-party libraries without good type definitions
- Runtime behavior differences in edge cases

### Mitigation Strategies
- Gradual strictness increase in TypeScript configuration
- Thorough testing after each module conversion
- Maintain ability to revert to JavaScript for problematic modules
- Use `any` types strategically during initial conversion, refine later

## Success Criteria
- All JavaScript files converted to TypeScript
- No TypeScript compilation errors with `strict: true`
- All tests passing
- No regression in functionality
- Improved code clarity and maintainability
- Prevention of issues like the quizState import bug

## Resources
- TypeScript Documentation: https://www.typescriptlang.org/docs/
- socket.io TypeScript Guide: https://socket.io/docs/v4/typescript/
- Express with TypeScript: https://expressjs.com/en/advanced/typescript.html
