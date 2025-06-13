# Adding New Features: Developer Guide

This guide describes the recommended workflow for adding new features to MathQuest.

## 1. Plan the Feature
- Review requirements and discuss with the team if needed.
- Check for existing related code and documentation.
- Update or create relevant documentation sections.

## 2. Branching & Setup
- Create a new feature branch from `main` (e.g., `feature/your-feature-name`).
- Pull the latest changes before starting.

## 3. Development
- Write code following project coding standards.
- Add or update unit, integration, and E2E tests.
- Update documentation for any new APIs, components, or flows.

## 4. Code Review
- Open a pull request (PR) with a clear description.
- Request review from at least one team member.
- Address feedback and make necessary changes.

## 5. Testing
- Ensure all tests pass locally and in CI.
- Manually test new features in the app.

## 6. Merge & Deploy
- Merge PR after approval and passing tests.
- Monitor deployment and logs for issues.

## 7. Post-Release
- Update documentation if further changes are made.
- Communicate new features to the team.

---

For more, see [coding standards](../reference/coding-standards.md) and [testing strategy](../testing/testing-strategy.md).
