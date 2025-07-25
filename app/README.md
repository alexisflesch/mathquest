# 🎯 MathQuest - Real-Time Educational Quiz Platform

> **A modern, type-safe, real-time quiz platform built with Next.js, Node.js, and WebSockets**  
> **✨ Featuring complete type safety, runtime validation, and zero legacy patterns**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](#)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socket.io&logoColor=white)](#)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-1B222D?logo=prisma&logoColor=white)](#)

---

## 🚀 **Quick Start**

```bash
# 1. Install dependencies
npm install

# 2. Start development servers
npm run dev
```

🌐 **Access**: Frontend (http://localhost:3000) | Backend (http://localhost:5000)  
📚 **Documentation**: [Complete Documentation Hub](#-documentation-hub) | [Instructions](instructions.md)

---

## 🎉 **PROJECT STATUS: MODERNIZATION COMPLETE**

**✅ Type Safety & Socket Event Modernization Completed (June 14, 2025)**

**MathQuest has achieved complete modernization with zero legacy patterns:**

### **🏆 Major Achievements**
- **✅ 100% Type Safety**: Zero TypeScript compilation errors across all modules
- **✅ Runtime Validation**: All API endpoints and socket handlers use Zod validation  
- **✅ Canonical Field Names**: All legacy names converted (`nom`→`name`, `niveau`→`gradeLevel`, etc.)
- **✅ Shared Type System**: Single source of truth for all data structures
- **✅ Socket Modernization**: All 17 socket handlers modernized with strict validation
- **✅ Contract Enforcement**: Zero type mismatches between frontend/backend

### **🚀 Technical Excellence**
- **Backend API**: 11/11 endpoints use shared types with runtime validation
- **Socket Events**: 17/17 handlers use Zod validation and standardized error handling
- **Database**: 100% canonical field naming alignment
- **Error Handling**: Standardized `ErrorPayload` and `ErrorResponse` patterns

### **📊 Validation Coverage**
- **API Boundaries**: 100% validated with `validateRequestBody()` middleware
- **Socket Boundaries**: 100% validated with `schema.safeParse()` patterns
- **Legacy Patterns**: 0 remaining (comprehensive elimination verified)

**🎯 Result**: Production-ready codebase with strict type safety, comprehensive runtime validation, and zero technical debt.

📋 **Documentation**: [Complete Modernization Report](MODERNIZATION_COMPLETE.md) | [Technical Details](plan.md) | [Implementation Log](log.md)

---


## 🏗️ **Project Architecture**

```
app/
├── frontend/          # Next.js 14 + React + TypeScript
├── backend/           # Node.js + Express + Socket.IO + Prisma  
├── shared/            # Shared TypeScript types & constants
├── tests/             # E2E tests with Playwright
└── docs/              # Comprehensive documentation
```

**Key Features**: Real-time multiplayer quizzes • Tournament mode • Teacher dashboard • Student interface • Practice mode

## 📂 **Project Configuration Files**

### **Root Level**
- `package.json` - Root dependencies and workspace scripts
- `tsconfig.json` / `tsconfig.base.json` / `tsconfig.check.json` - TypeScript configurations
- `eslint.config.mjs` - ESLint configuration
- `playwright.config.ts` - End-to-end test configuration

### **Backend Configuration**
- `backend/package.json` - Backend dependencies and scripts
- `backend/tsconfig.json` - Backend TypeScript configuration
- `backend/.env` / `.env.test` - Environment variables (not in git)
- `backend/eslint.config.mjs` - Backend-specific ESLint rules
- `backend/jest.config.js` - Backend testing configuration
- `backend/nodemon.json` - Development server configuration
- `backend/.prettierrc.json` - Code formatting rules

### **Frontend Configuration**
- `frontend/package.json` - Frontend dependencies and scripts
- `frontend/tsconfig.json` / `tsconfig.jest.json` - Frontend TypeScript configurations
- `frontend/.env` / `.env.example` - Environment variables (not in git)
- `frontend/next.config.ts` - Next.js configuration
- `frontend/tailwind.config.mjs` - Tailwind CSS configuration
- `frontend/postcss.config.mjs` - PostCSS configuration
- `frontend/jest.config.js` - Frontend testing configuration
- `frontend/eslint.config.mjs` / `.eslintrc.*` - ESLint configurations

---

## 📚 **Documentation Hub**

### **🚀 Essential Guides**
- [⚡ Quick Start Guide](docs/QUICK_START.md) - Get running in 5 minutes  
- [👨‍💻 Developer Onboarding](docs/guides/developer-onboarding.md) - Complete new developer setup
- [📋 Project Instructions](instructions.md) - AI agent guidelines & modernization rules

### **🏛️ Architecture & API**
- [🏗️ System Architecture](docs/architecture/overview.md) - High-level system design
- [🔌 WebSocket Events](docs/api/socket-events.md) - Real-time events catalog
- [📋 Data Contracts](docs/api/data-contracts.md) - TypeScript interfaces & validation

### **💻 Development Guides**  
- [⚛️ Frontend Guide](docs/frontend/) - React components, state management, testing
- [⚙️ Backend Guide](docs/backend/) - Services, handlers, database integration
- [🔗 Shared Types](docs/shared/) - Type system, constants, validation schemas

### **🚀 Operations**
- [🧪 Testing Strategy](docs/testing/) - Unit, integration, E2E testing
- [🚀 Deployment Guide](docs/deployment/) - Production setup & monitoring
- [📖 Reference](docs/reference/) - Coding standards, troubleshooting, glossary

---
## 🤖 **AI Agent Guidelines**

This project uses AI coding agents to assist development. **Critical guidelines**:

- Always read this README before writing or modifying code.
- Avoid guessing or renaming variables. Stick to existing naming conventions.
- Do not make assumptions about side effects — check function signatures and schema definitions.
- Keep API contracts strict and centralized.
- Don't go through the codebase to figure out how things work. Use the documentation first, then the code if needed.


## 🛠️ **Development Commands**

```bash
# Development
npm run dev                 # Start both frontend & backend
npm run dev:frontend        # Start frontend only (port 3000)  
npm run dev:backend         # Start backend only (port 5000)

# Building & Type Checking
npm run build              # Build both frontend & backend
npm run type-check         # Check types in all modules
npm run type-check:all     # Comprehensive type checking

# Testing & Quality
npm run test               # Run all tests
npm run lint               # Lint all code
./test-auth-flow.sh        # Test authentication flow
```

---

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
