# MathQuest Documentation Map

This document provides a visual map of the MathQuest documentation structure to help you quickly find the information you need.

## Documentation Structure Overview

```
docs/
├── README.md                           # Main documentation entry point
├── overview/                           # Project overview
│   ├── README.md                       # Overview index
│   └── project-overview.md             # Detailed project description
├── setup/                              # Setup instructions
│   └── README.md                       # Setup guide
├── architecture/                       # Architecture documentation
│   └── README.md                       # Architecture overview
├── frontend/                           # Frontend documentation
│   ├── README.md                       # Frontend overview
│   ├── frontend-architecture.md        # Detailed frontend architecture
│   └── hooks.md                        # Custom React hooks
├── backend/                            # Backend documentation
│   ├── README.md                       # Backend overview
│   ├── backend-architecture.md         # Detailed backend architecture
│   ├── timer-bugs.md                   # Timer-related issues and fixes
│   └── refactor-live-logic.md          # Live logic refactoring guide
├── api/                                # API documentation
│   ├── README.md                       # API overview
│   └── api-reference.md                # Detailed API reference
├── sockets/                            # Socket communication documentation
│   ├── README.md                       # Socket overview
│   └── socket-guide.md                 # Socket implementation guide
├── types/                              # Type system documentation
│   ├── README.md                       # Type system overview
│   ├── typescript-guide.md             # TypeScript guide
│   ├── type-architecture.md            # Type system architecture
│   └── shared-types-guide.md           # Shared types usage guide
├── project/                            # Project management documentation
│   ├── README.md                       # Project management overview
│   ├── TODO.md                         # Current task list
│   ├── migration-progress-summary.md   # Migration status
│   └── javascript-cleanup-plan.md      # JavaScript cleanup plan
└── archive/                            # Archived documentation
    └── [various archived documents]    # Historical documentation
```

## Key Documentation Paths

### For New Developers

1. Start here: [README.md](./README.md)
2. Learn about the project: [Project Overview](./overview/project-overview.md)
3. Set up your environment: [Setup Guide](./setup/README.md)
4. Understand the architecture: [Architecture Overview](./architecture/README.md)

### For Frontend Development

1. [Frontend Overview](./frontend/README.md)
2. [Frontend Architecture](./frontend/frontend-architecture.md)
3. [Custom React Hooks](./frontend/hooks.md)
4. [TypeScript Guide](./types/typescript-guide.md)

### For Backend Development

1. [Backend Overview](./backend/README.md)
2. [Backend Architecture](./backend/backend-architecture.md)
3. [API Reference](./api/api-reference.md)
4. [Socket Guide](./sockets/socket-guide.md)

### For TypeScript & Types

1. [Type System Overview](./types/README.md)
2. [TypeScript Guide](./types/typescript-guide.md)
3. [Type Architecture](./types/type-architecture.md)
4. [Shared Types Guide](./types/shared-types-guide.md)

### For Project Management

1. [Project Management Overview](./project/README.md)
2. [TODO List](./project/TODO.md)
3. [Migration Progress](./project/migration-progress-summary.md)

## Documentation Conventions

- Each folder contains a README.md file that serves as an index for that category
- Related documents are grouped together in the same folder
- Links between documents use relative paths for easy navigation
- Code examples are provided where appropriate to illustrate concepts
