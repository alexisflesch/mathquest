# Architecture Documentation

This directory contains documentation about MathQuest's overall architecture and design.

## Key Documents

- [System Architecture](system-architecture.md) - High-level overview of the system
- [Component Design](component-design.md) - Detailed design of key components
- [Data Flow](data-flow.md) - How data flows through the system

## Architectural Decisions

The MathQuest application is structured as a monorepo with the following key components:

1. **Frontend** - Next.js application with React components
2. **Backend** - Node.js server with Socket.IO for real-time communication
3. **Shared** - Shared types and utilities used by both frontend and backend

## Related Documentation

- [Frontend Architecture](../frontend/README.md)
- [Backend Architecture](../backend/README.md)
- [Type System](../types/README.md)
