# E2E Test Suites

This directory contains organized E2E test suites, split from the original monolithic `comprehensive-test-suite.spec.ts` file for better maintainability.

## Test Suites

### `authentication-navigation.spec.ts`
Tests guest authentication and basic navigation functionality.

**Tests:**
- Guest user authentication and access to main features

### `practice-mode.spec.ts`
Tests practice game creation and functionality.

**Tests:**
- Student practice game creation

### `quiz-creation-management.spec.ts`
Tests quiz template creation and game instantiation.

**Tests:**
- Teacher quiz template creation
- Teacher quiz instantiation from template

### `live-quiz-flow.spec.ts`
Tests the complete flow of quiz creation and navigation.

**Tests:**
- Complete quiz flow: teacher creates quiz, students join and play

### `tournament-mode.spec.ts`
Tests tournament creation and participation.

**Tests:**
- Tournament creation and participation

### `error-handling.spec.ts`
Tests error handling and edge cases.

**Tests:**
- Joining non-existent games
- API malformed request handling

### `teacher-controls.spec.ts`
Tests teacher controls and real-time quiz management features.

**Tests:**
- Simple guest authentication
- Teacher controls from live page (guest access)
- Quiz creation UI investigation

### `performance-reliability.spec.ts`
Tests performance and reliability aspects.

**Tests:**
- Multiple users joining simultaneously (skipped - TODO)

## Running Tests

Run individual suites:
```bash
npx playwright test suites/authentication-navigation.spec.ts
npx playwright test suites/teacher-controls.spec.ts
```

Run all suites:
```bash
npx playwright test suites/
```

Run specific test within a suite:
```bash
npx playwright test suites/teacher-controls.spec.ts --grep "live page"
```

## Organization Benefits

- **Maintainability**: Each file focuses on a specific feature area
- **Parallel Execution**: Smaller files can run in parallel more efficiently
- **Debugging**: Easier to isolate and fix issues in specific areas
- **CI/CD**: Can run specific suites based on changes
- **Readability**: Clear separation of concerns