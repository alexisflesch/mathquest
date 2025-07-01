## [2025-07-01] Phase: Dashboard Auth/Cookie Failure Audit

### Findings

- The failing dashboard page (`/teacher/dashboard/[code]`) uses a direct `fetch` to `/api/validate-dashboard-access` with `credentials: 'include'` and posts `{ pageType: 'dashboard', accessCode: code }`.
- The working teacher page (`/teacher/games`) uses the `makeApiRequest` helper for all API calls, which also sets `credentials: 'include'` and handles headers/tokens.
- The dashboard page does **not** use `makeApiRequest` and may miss any additional logic (e.g., token management, error normalization) provided by the helper.
- The API route `/api/validate-dashboard-access` forwards cookies to the backend, but if the incoming request lacks the correct cookies (due to domain, SameSite, or path issues), the backend will not see the session.
- Both the dashboard and working pages set `credentials: 'include'`, so the issue is not a missing option.
- The problem is isolated to the dashboard page; other authenticated teacher pages work as expected.


### Next Steps

- [ ] **System-wide audit:** Identify all socket event handlers that require authentication and depend on `socket.data.user` or `socket.data.userId`.
- [ ] **Unify authentication:** Ensure the authentication mechanism (JWT or session token) is accessible to both API requests and socket connections in production. Prefer a secure, non-HttpOnly cookie or explicit token handoff for sockets.
- [ ] **Fix login/session flow:** After successful login, set a JWT or equivalent token in a way that both API and socket layers can access (e.g., a cookie readable by JS, or explicit token in app state).
- [ ] **Update socket clients:** Update all socket connection initializations to send the token in the handshake (`auth.token`).
- [ ] **Test all flows:** Retest all authenticated socket flows (dashboard, games, lobby, etc.) in production-like conditions.
- [ ] **Document findings and changes:** Update this plan and related docs with all findings, changes, and test results.


### Resolution Steps

- [x] Compared the logic in `makeApiRequest` to the dashboard's fetch. Confirmed that only `makeApiRequest` sends the JWT from localStorage as an Authorization header, which is required for backend authentication in production.
- [x] Refactored the dashboard page to call the backend endpoint directly with `makeApiRequest`, bypassing the Next.js API route. This ensures the Authorization header is sent, matching the working teacher pages.
- [x] Tested: The dashboard page now passes backend API validation, but the socket join event (`JOIN_DASHBOARD`) still fails with an authentication error.
- [x] Confirmed: Socket connections are established and events are received on other pages (e.g., lobby), so socket infrastructure is working.
- [x] Errors like `lobby_error` are domain/game state errors, not authentication/session errors.
- [x] Captured error object for dashboard join event:

  ```json
  {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required to join dashboard"
  }
  ```

- [ ] Audit the backend event handler for `JOIN_DASHBOARD` to ensure it uses `socket.data.user` for authorization and logs errors with sufficient detail.
- [ ] Add or improve backend debug logging for the dashboard join event to capture incoming payload, user state, and error details.
- [ ] Compare the dashboard join socket flow with working socket flows (e.g., lobby, games) to identify discrepancies.
- [ ] Document all new findings and next steps in `plan.md`.
- [x] Add console logging to `universalLogin` to verify backend response and ensure JWT is stored in `sessionStorage` after login.
- [x] Confirm that the backend login response includes a `token` property for all user types.

**Root cause:**
- In local dev, cookies are often present and sent due to relaxed settings, so the proxy route works. In production, stricter cookie policies mean the backend never receives the session cookie, so authentication fails unless the JWT is sent in the Authorization header (which only happens with direct `makeApiRequest` calls).
