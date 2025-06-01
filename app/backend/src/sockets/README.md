# Sockets Subsystem - AI Agent Reference

This folder contains all real-time event logic for MathQuest, organized for clarity, maintainability, and AI agent reasoning.

## Structure

- **handlers/**: Main event handler logic, organized by domain:
  - **game/**: Student gameplay events (join, answer, next question, etc)
  - **teacherControl/**: Teacher dashboard events (set question, timer, lock answers, etc)
  - **tournament/**: Tournament event registration
  - **lobbyHandler.ts**: Lobby join/leave and participant tracking
  - **projectorHandler.ts**: Projector (read-only display) events
  - **shared***: Logic reused across domains (answers, leaderboard, game flow, etc)
- **middleware/**: Socket-level middleware (e.g., authentication)
- **utils/**: Room and socket utility functions
- **adapters/**: (Currently unused)

## Registration Pattern

Each handler domain exposes a registration function (e.g., `registerGameHandlers(io, socket)`) that wires up all relevant events for a connected socket. All event names use shared constants from `@shared/types/socket/events` for type safety and consistency.

## Best Practices

- Use shared event constants for all event names.
- Keep handler logic focused and domain-specific.
- Use TypeScript types for all payloads and state.
- Place shared logic in `shared*` files for reuse.
- Document new event flows and handler patterns for future agents.

---

*For detailed event flows and payloads, see `/docs/sockets/event-reference.md` and `/docs/backend/README.md`.*
