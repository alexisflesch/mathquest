
## [2025-07-01] Phase: Dashboard Auth/Cookie Failure Audit

### Findings

- The failing dashboard page (`/teacher/dashboard/[code]`) uses a direct `fetch` to `/api/validate-dashboard-access` with `credentials: 'include'` and posts `{ pageType: 'dashboard', accessCode: code }`.
- The working teacher page (`/teacher/games`) uses the `makeApiRequest` helper for all API calls, which also sets `credentials: 'include'` and handles headers/tokens.
- The dashboard page does **not** use `makeApiRequest` and may miss any additional logic (e.g., token management, error normalization) provided by the helper.
- The API route `/api/validate-dashboard-access` forwards cookies to the backend, but if the incoming request lacks the correct cookies (due to domain, SameSite, or path issues), the backend will not see the session.
- Both the dashboard and working pages set `credentials: 'include'`, so the issue is not a missing option.
- The problem is isolated to the dashboard page; other authenticated teacher pages work as expected.

### Next Steps


### Resolution Steps

- [x] Compared the logic in `makeApiRequest` to the dashboard's fetch. Confirmed that only `makeApiRequest` sends the JWT from localStorage as an Authorization header, which is required for backend authentication in production.
- [x] Refactored the dashboard page to call the backend endpoint directly with `makeApiRequest`, bypassing the Next.js API route. This ensures the Authorization header is sent, matching the working teacher pages.
- [ ] Test if this resolves the authentication/cookie/session issue in production.

- [x] Tested: The dashboard page now passes backend API validation, but the socket join event (`JOIN_DASHBOARD`) still fails with `AUTHENTICATION_REQUIRED`.
- [x] Confirmed: Socket connections are established and events are received on other pages (e.g., lobby), so socket infrastructure is working.
- [x] Errors like `lobby_error` are domain/game state errors, not authentication/session errors.
- [ ] Audit the socket authentication logic for the dashboard join event and compare with working socket flows (e.g., lobby, games).
- [ ] Document all findings and next steps in `plan.md`.

**Root cause:**
- In local dev, cookies are often present and sent due to relaxed settings, so the proxy route works. In production, stricter cookie policies mean the backend never receives the session cookie, so authentication fails unless the JWT is sent in the Authorization header (which only happens with direct `makeApiRequest` calls).
