
## [2025-07-01] Phase: Dashboard Auth/Cookie Failure Audit

### Findings

- The failing dashboard page (`/teacher/dashboard/[code]`) uses a direct `fetch` to `/api/validate-dashboard-access` with `credentials: 'include'` and posts `{ pageType: 'dashboard', accessCode: code }`.
- The working teacher page (`/teacher/games`) uses the `makeApiRequest` helper for all API calls, which also sets `credentials: 'include'` and handles headers/tokens.
- The dashboard page does **not** use `makeApiRequest` and may miss any additional logic (e.g., token management, error normalization) provided by the helper.
- The API route `/api/validate-dashboard-access` forwards cookies to the backend, but if the incoming request lacks the correct cookies (due to domain, SameSite, or path issues), the backend will not see the session.
- Both the dashboard and working pages set `credentials: 'include'`, so the issue is not a missing option.
- The problem is isolated to the dashboard page; other authenticated teacher pages work as expected.

### Next Steps

- [ ] Compare the logic in `makeApiRequest` to the dashboard's fetch and identify any missing critical logic (e.g., token handling, error normalization).
- [ ] Refactor the dashboard page to use `makeApiRequest` for the `/api/validate-dashboard-access` call for consistency.
- [ ] Test if this resolves the authentication/cookie/session issue in production.
- [ ] If not resolved, compare request/response headers and cookies in browser dev tools for both pages to identify any differences.
- [ ] Document all changes and findings in `plan.md`.
