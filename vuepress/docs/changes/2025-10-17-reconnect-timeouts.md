# Changelog — Socket Reconnect UX and Timeouts

Date: 2025-10-17

This change modernizes the teacher dashboard’s resilience to mobile network conditions and documents the updated Socket.IO server timeouts.

What changed
- Frontend: Teacher dashboard now shows a reconnect overlay during transient disconnections and auto re-joins upon reconnection.
- Backend: Socket.IO server pingTimeout increased to 90s and pingInterval to 45s to better tolerate mobile device sleep/network switches.

Details
- Component: frontend/src/components/TeacherDashboardClient.tsx
  - Added isReconnecting state and handlers for connect/disconnect/connect_error.
  - Overlay with spinner and “Reconnexion au serveur…” now takes precedence over the loading screen.
- Server: backend/src/sockets/index.ts
  - pingTimeout: 90000
  - pingInterval: 45000

Tests
- Frontend tests added/updated to cover reconnect UI and initial connect_error behavior.
  - src/components/__tests__/TeacherDashboardClient.reconnect-ui.test.tsx
  - src/components/__tests__/TeacherDashboardClient.connect_error.test.tsx
- Backend unit guard enforcing mobile-safe timeouts:
  - tests/unit/mobile-dashboard-timeout.test.ts

Acceptance
- All related frontend tests pass locally.
- Backend timeout guard test passes.

Notes
- No compatibility layer added; this is a clean modernization aligned with shared types and existing hook patterns.
