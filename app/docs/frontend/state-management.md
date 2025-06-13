# MathQuest Frontend State Management

This document explains the state management patterns used in the MathQuest frontend.

## Overview
- Uses React context, hooks, and local state for most UI logic.
- Global state (e.g., user/session, game state) managed via React Context and custom hooks.
- Real-time state (game, lobby, leaderboard) synchronized via Socket.IO events.

## Patterns
- **Local State**: For UI-specific, ephemeral state (e.g., modal open/close).
- **Context Providers**: For global/shared state (e.g., AuthProvider, GameProvider).
- **Custom Hooks**: For encapsulating logic (e.g., `useGameState`, `useSocket`, `useTimer`).
- **Socket.IO Integration**: State updates in response to real-time events.

## Example
```jsx
const { gameState } = useGameState();
const { socket } = useSocket();
```

---

See `frontend/src/context/` and `frontend/src/hooks/` for implementation details.
