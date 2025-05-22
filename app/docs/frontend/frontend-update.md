# Frontend Update TODO – Reconnecting to New Backend

The backend has been completely rewritten. The frontend must be updated to reconnect and interoperate with the new backend, using the new API payloads, socket event names, and strict typing conventions. This document tracks the required tasks and progress.

---

## TODO List

### 0. Testing
- [x] Set up Jest and React Testing Library for unit and component tests
    - [x] Install dependencies: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest`
    - [x] Add a Jest config (e.g., `jest.config.js` or use `npx ts-jest config:init`)
    - [x] Add a test script to `package.json`: `"test": "jest"`
    - [x] Create a `__tests__/` folder in `src/components/` and add a sample test file
    - [x] Ensure tests run with `npm test`
    - [x] (Optional) Add coverage reporting: `"test:coverage": "jest --coverage"`

### 1. General
- [ ] Review all backend API and socket documentation in `/docs/backend` (especially payloads, event names, and type definitions)
- [ ] Identify all places in the frontend that interact with backend APIs or sockets
- [ ] Ensure all shared types are aligned with backend (preferably using zod for validation)
- [ ] Remove or refactor any legacy code that is incompatible with the new backend

### 2. Self-Paced (Practice) Mode
- [ ] Update frontend logic for practice mode to use new backend endpoints and socket events
- [ ] Update payloads and state management to match new backend types
- [ ] Test end-to-end: joining, answering, feedback, and completion

### 3. Tournament Mode
- [ ] Update tournament creation/joining flows to use new backend APIs
- [ ] Update all real-time tournament socket events (lobby, start, questions, answers, leaderboard, etc.)
- [ ] Update payloads and state management to match new backend types
- [ ] Test end-to-end: lobby, live play, leaderboard, and results

### 4. Quiz Mode (Teacher Dashboard & Projection View)
- [ ] Update teacher dashboard to use new backend APIs and socket events
- [ ] Update projection/classroom view to use new backend events and payloads
- [ ] Ensure dashboard and projection stay in sync with backend state
- [ ] Test all flows: quiz creation, question navigation, timer, stats, and results

### 5. Shared Types & Validation
- [ ] Use zod schemas for runtime validation of backend payloads (where feasible)
- [ ] Ensure all shared types are imported from a single source of truth (ideally shared between frontend and backend)
- [ ] Document any type mismatches or required migrations

### 6. Additional Considerations
- [ ] Update error handling and user feedback for new backend error formats
- [ ] Update authentication/authorization flows if backend changes require it
- [ ] Update or add tests for all updated flows
- [ ] Update documentation as changes are made (README, components.md, socket.md, etc.)

---

## References
- Backend API & Socket Docs: `/docs/backend/`
- Shared Types & Zod: `/docs/backend/type-architecture.md`, `/docs/backend/shared-types-guide.md`
- Frontend Docs: `README.md`, `components.md`, `socket.md`

---

## See Also
- [Main Frontend README](../README.md)

---

## Notes
- If you discover additional areas that require updates, add them to this list.
- Use strict typing and validation to catch integration issues early.
- Coordinate with backend team as needed for clarifications or missing docs.
