# MathQuest App - AI Agent Coding Guidelines

Welcome to the MathQuest codebase! This project uses an AI agent to help automate and improve development. Please follow these guidelines to ensure high-quality, maintainable code:


## 🤖 AI Agent Usage
This project uses AI coding agents (e.g. GitHub Copilot, ChatGPT) to assist in development. To ensure consistent behavior:

- Always read this README before writing or modifying code.
- Avoid guessing or renaming variables. Stick to existing naming conventions.
- Do not make assumptions about side effects — check function signatures and schema definitions.
- Keep API contracts strict and centralized.


## Documentation
- All documentation is located in the `docs/` folder.
- The main documentation entry point is [`docs/README.md`](docs/README.md).
- When you need to figure something out, **always check the docs first**.
- If the answer is not in the docs, investigate the codebase, find the answer, and **add your findings to the docs**. Documentation should always be up to date.

## Coding Principles
- **Keep code DRY** (Don't Repeat Yourself). Reuse logic and avoid duplication.
- **Ask before making major changes** to the frontend or backend. Don't make disruptive changes without confirmation.
- **Write tests** for new features or bug fixes when necessary.
- **Don't patch over bugs**. Investigate, find the root cause, and fix it properly.
- **No backward compatibility**. The codebase should **not** support legacy versions or deprecated features. Always use the latest APIs and patterns.

## 🚨 Critical Development Rules

### Authentication & Cookies
- **NEVER use hardcoded cookie names** - always use constants from `src/constants/auth.ts`
- **ALWAYS update both client and server** when changing cookie names or auth flow
- **TEST the complete auth flow** after any auth-related changes:
  ```bash
  ./test-auth-flow.sh  # Run this script after auth changes
  ```
- **Check AuthProvider compatibility** when updating auth API endpoints

### API Contracts
- **ALWAYS use Zod schemas** for API request/response validation
- **NEVER change API response format** without updating all consumers
- **CREATE shared types** in `shared/types/` for API contracts
- **UPDATE documentation** when adding/changing API endpoints

### Testing Requirements
- **RUN integration tests** before committing auth/API changes
- **TEST in browser** after running automated tests
- **VERIFY complete user journeys** (login → dashboard → logout)
- **CHECK both authenticated and unauthenticated flows**

### Code Changes
- **SEARCH codebase** for all usages before renaming variables/constants
- **USE TypeScript strict mode** - no `any` types in new code
- **GREP for string literals** when changing identifiers:
  ```bash
  grep -r "oldCookieName" --include="*.ts" --include="*.tsx" .
  ```

### Architecture Rules
- **CENTRALIZE configuration** - no scattered constants
- **SINGLE source of truth** for auth state, cookie names, API endpoints
- **CONSISTENT naming** across frontend/backend/database
- **VALIDATE at boundaries** - all external data must be validated

## Workflow
- Use the documentation as your primary source of truth.
- Keep the codebase clean, maintainable, and well-documented.
- Communicate and confirm before making significant changes.
- **Run `./test-auth-flow.sh` after any authentication changes.**

## Debug Commands
```bash
# Test authentication flow
./test-auth-flow.sh

# Search for potential issues
grep -r "mathquest_teacher" --include="*.ts" --include="*.tsx" .
grep -r "hardcoded_cookie" --include="*.ts" --include="*.tsx" .

# Validate API contracts
npm run type-check
npm run test:integration
```

Happy coding!
