# 👨‍💻 Developer Onboarding Guide

Welcome to MathQuest! This guide will get you fully set up as a productive contributor to the project.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** with npm
- **PostgreSQL 12+** 
- **Git** configured with your credentials
- **VS Code** (recommended) with suggested extensions
- Basic familiarity with **TypeScript**, **React**, and **Node.js**

## 🚀 Initial Setup

### 1. Complete Quick Start
First, follow the [Quick Start Guide](../QUICK_START.md) to get the basic development environment running.

### 2. Install Development Tools
```bash
# Install global tools (optional but recommended)
npm install -g @prisma/cli
npm install -g typescript
npm install -g nodemon
```

### 3. VS Code Setup
Install recommended extensions:
- **TypeScript and JavaScript Language Features**
- **Prisma** - Database schema and query assistance
- **ESLint** - Code quality and formatting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - CSS class suggestions
- **Jest** - Test runner integration

## 🏗️ Architecture Deep Dive

### High-Level System Design
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│    Backend      │◄──►│   Database      │
│ (Next.js/React) │    │ (Node.js/Express│    │ (PostgreSQL)    │
│                 │    │  + Socket.IO)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO, Prisma ORM
- **Database**: PostgreSQL with Prisma schema
- **Shared**: TypeScript types, Zod validation, shared constants
- **Testing**: Jest (unit), Playwright (E2E)
- **Dev Tools**: ESLint, Prettier, TypeScript strict mode

### Data Flow
1. **User Interaction** → React components trigger events
2. **State Management** → React context and hooks manage local state
3. **API Communication** → HTTP requests for CRUD operations
4. **Real-time Updates** → Socket.IO for live quiz interactions
5. **Database Operations** → Prisma ORM handles PostgreSQL queries

## 📁 Project Structure Deep Dive

```
app/
├── frontend/              # Next.js React Application
│   ├── src/
│   │   ├── app/          # Next.js 14 App Router pages
│   │   ├── components/   # Reusable React components
│   │   ├── contexts/     # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and configurations
│   │   └── types/        # Frontend-specific TypeScript types
│   ├── public/           # Static assets
│   └── *.config.*        # Frontend configuration files
│
├── backend/               # Node.js Express Server
│   ├── src/
│   │   ├── controllers/  # Express route handlers
│   │   ├── middleware/   # Express middleware functions
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic services
│   │   ├── sockets/      # Socket.IO event handlers
│   │   └── types/        # Backend-specific TypeScript types
│   ├── prisma/           # Database schema and migrations
│   │   ├── schema.prisma # Database schema definition
│   │   └── migrations/   # Database migration files
│   └── *.config.*        # Backend configuration files
│
├── shared/                # Shared Code Between Frontend & Backend
│   ├── constants/        # Shared constants and enums
│   ├── types/            # Shared TypeScript interfaces
│   ├── utils/            # Shared utility functions
│   └── validation/       # Zod schemas for data validation
│
├── tests/                 # End-to-End Tests
│   ├── auth/             # Authentication flow tests
│   ├── gameplay/         # Quiz and tournament tests
│   └── fixtures/         # Test data and helpers
│
├── docs/                  # Project Documentation
│   ├── api/              # API documentation
│   ├── architecture/     # System design docs
│   ├── frontend/         # Frontend-specific docs
│   ├── backend/          # Backend-specific docs
│   └── guides/           # Developer guides
│
└── scripts/               # Development & Maintenance Scripts
    ├── fix-*.sh          # Codebase maintenance scripts
    └── test-*.sh         # Verification scripts
```

## 🛠️ Development Workflow

### Daily Development Cycle
```bash
# 1. Start development environment
npm run dev

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
npm run type-check      # Verify TypeScript
npm run lint           # Check code quality  
npm run test           # Run tests

# 4. Commit changes
git add .
git commit -m "feat: descriptive commit message"

# 5. Push and create PR
git push origin feature/your-feature-name
```

### Code Quality Checks
Always run before committing:
```bash
npm run type-check:all  # Full TypeScript validation
npm run lint           # ESLint validation
npm run test           # Jest test suite
npm run test:e2e       # End-to-end tests (optional)
```

## 🎯 Development Standards

### TypeScript Guidelines
- **Strict mode enabled** - No `any` types in new code
- **Explicit return types** for functions
- **Use shared types** from `shared/types/` for cross-boundary data
- **Zod validation** for all external data (API requests, user input)

### React Best Practices
- **Functional components** with hooks
- **TypeScript interfaces** for all component props
- **Custom hooks** for reusable logic
- **React Context** for global state (auth, theme)
- **Tailwind CSS** for styling (no custom CSS files)

### Backend Standards
- **Express.js** with TypeScript
- **Prisma ORM** for all database operations
- **Zod schemas** for request/response validation
- **Socket.IO** for real-time features
- **Structured logging** with consistent format

### API Design
- **RESTful endpoints** for CRUD operations
- **Consistent response format** across all endpoints
- **Proper HTTP status codes**
- **Zod validation** for all requests/responses
- **Error handling** with structured error responses

## 🔄 Common Development Tasks

### Adding a New API Endpoint
1. **Define Zod schema** in `shared/validation/`
2. **Create route handler** in `backend/src/routes/`
3. **Add service logic** in `backend/src/services/`
4. **Update frontend types** if needed
5. **Add tests** for the new endpoint

### Creating a New Component
1. **Create component file** in `frontend/src/components/`
2. **Define TypeScript interface** for props
3. **Use Tailwind CSS** for styling
4. **Add to component export** if reusable
5. **Write Jest tests** if complex logic

### Database Changes
1. **Update Prisma schema** in `backend/prisma/schema.prisma`
2. **Generate migration** with `npx prisma migrate dev`
3. **Update TypeScript types** that reference the schema
4. **Test database operations** thoroughly

### Adding Real-time Features
1. **Define Socket.IO events** in `shared/types/socket.ts`
2. **Create backend handlers** in `backend/src/sockets/`
3. **Add frontend listeners** using custom hooks
4. **Test real-time flow** end-to-end

## 🧪 Testing Strategy

### Test Types
- **Unit Tests** (Jest) - Individual functions and components
- **Integration Tests** (Jest) - API endpoints and database operations
- **End-to-End Tests** (Playwright) - Complete user workflows

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests  
npm run test:integration

# End-to-end tests
npm run test:e2e

# All tests
npm run test
```

### Writing Tests
- **Test behavior, not implementation**
- **Use descriptive test names**
- **Mock external dependencies**
- **Test both success and error cases**

## 🔍 Debugging

### Frontend Debugging
- **React Developer Tools** browser extension
- **VS Code debugger** with breakpoints
- **Console logging** with structured format
- **Network tab** for API request inspection

### Backend Debugging
- **VS Code debugger** with `npm run dev:debug`
- **Structured logging** throughout the application
- **Database query logging** with Prisma
- **Postman/Insomnia** for API testing

### Database Debugging
- **Prisma Studio** - `npx prisma studio`
- **PostgreSQL logs** for query analysis
- **Database migrations** - `npx prisma migrate status`

## 📚 Learning Resources

### Core Technologies
- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- **React**: [React Documentation](https://react.dev/)
- **Next.js**: [Next.js Documentation](https://nextjs.org/docs)
- **Prisma**: [Prisma Documentation](https://www.prisma.io/docs/)
- **Socket.IO**: [Socket.IO Documentation](https://socket.io/docs/)

### Project-Specific Docs
- **[Architecture Overview](../architecture/overview.md)** - System design
- **[API Reference](../api/)** - Complete API documentation
- **[Frontend Guide](../frontend/)** - React patterns and components
- **[Backend Guide](../backend/)** - Server architecture and services

## 🤝 Contributing Guidelines

### Pull Request Process
1. **Create feature branch** from `main`
2. **Make focused changes** - one feature per PR
3. **Add/update tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all checks pass** (tests, linting, type checking)
6. **Write descriptive PR description**

### Commit Message Format
```
type(scope): description

feat(auth): add OAuth2 login support
fix(quiz): resolve timer synchronization issue
docs(api): update socket event documentation
refactor(backend): simplify user service logic
```

### Code Review Checklist
- [ ] **Functionality** - Does the code work as intended?
- [ ] **Tests** - Are there appropriate tests?
- [ ] **Performance** - Are there any performance concerns?
- [ ] **Security** - Are there any security vulnerabilities?
- [ ] **Documentation** - Is the code well-documented?

## 🆘 Getting Help

### Documentation Resources
- **[Complete Documentation Hub](../README.md)** - All project documentation
- **[Troubleshooting Guide](../troubleshooting/)** - Common issues and solutions
- **[FAQ](../reference/faq.md)** - Frequently asked questions

### Team Communication
- **Code Reviews** - Ask questions during PR reviews
- **Documentation** - Contribute to and improve project docs
- **Issue Tracking** - Report bugs and suggest features

## 🎉 Welcome to the Team!

You're now ready to contribute effectively to MathQuest! Remember:

- **Documentation first** - Always check docs before diving into code
- **Ask questions** - Better to ask than to assume
- **Test thoroughly** - Quality is more important than speed
- **Keep learning** - Technology evolves, and so should we

Happy coding! 🚀📚
