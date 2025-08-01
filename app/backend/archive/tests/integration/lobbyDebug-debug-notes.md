# Debugging Progress: lobbyDebug.test.ts

## Summary
- Open handles required thorough cleanup of sockets, Redis, Prisma, and any intervals.
- Payload mismatches needed consistent data in `join_lobby` and in `socket.data.user`.
- TypeScript errors were resolved by casting to `any` for Redis adapter.
- Persistent timeouts often traced to un-cleared intervals, leftover sockets, or adapter clients not closed.

## Action Items
- Verify no hidden timers in lobby handler code.
- Ensure each resource is closed in the right order (Socket.IO then Redis then Prisma).
- Use `jest --detectOpenHandles` and global error handlers to catch unhandled rejections.

_Last updated: 2025-06-09_
