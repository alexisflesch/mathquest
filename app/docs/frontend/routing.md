# MathQuest Frontend Routing

This document describes the routing structure and navigation patterns in the MathQuest frontend (Next.js).

## Routing Overview
- Uses Next.js file-based routing in `frontend/src/pages/`.
- Each file in `pages/` becomes a route (e.g., `pages/index.tsx` → `/`).
- Dynamic routes (e.g., `[gameId].tsx`) handle per-game and per-user navigation.

## Key Routes
- `/` — Home/landing page
- `/game/[accessCode]` — Student game interface
- `/teacher/[accessCode]` — Teacher dashboard
- `/lobby/[accessCode]` — Lobby join and waiting room
- `/login` — User authentication
- `/profile` — User profile/settings

## Navigation
- Uses Next.js `<Link>` for client-side navigation.
- Programmatic navigation via `useRouter()` hook.

## Example
```jsx
import Link from 'next/link';
<Link href="/game/ABC123">Join Game</Link>
```

---

See `frontend/src/pages/` for all available routes.
