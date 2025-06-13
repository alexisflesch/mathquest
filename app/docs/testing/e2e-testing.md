# End-to-End (E2E) Testing Guide

This guide explains how to set up and run E2E tests for MathQuest using Playwright.

## 1. Tooling
- Playwright is used for browser-based E2E tests.
- Tests are located in `tests/` or `frontend/tests/`.

## 2. Setup
- Install dependencies: `npm install` in the root and frontend directories.
- Ensure the backend and frontend are running (use test or staging environment).

## 3. Writing Tests
- Use Playwright's API to script user flows (login, game, quiz, etc.).
- Use selectors that are stable (e.g., `data-testid`).
- Clean up state between tests.

## 4. Running Tests
- Run all E2E tests: `npx playwright test`
- View results in the Playwright HTML report (`playwright-report/index.html`).

## 5. CI Integration
- E2E tests should run automatically in the CI pipeline.
- Fail the build on E2E test failures.

## 6. Test Environment
- Use a dedicated test database and environment variables.
- Reset database state before each test run if possible.

## 7. Troubleshooting
- Check Playwright logs and screenshots for failures.
- Ensure all services are running and accessible.

---

See also: [Testing Strategy](./testing-strategy.md), [Frontend Testing](../frontend/testing.md).
