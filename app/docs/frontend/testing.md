# MathQuest Frontend Testing

This document describes the testing strategy and tools for the MathQuest frontend.

## Testing Tools
- **Jest**: Unit and integration testing framework.
- **React Testing Library**: For testing React components in a user-centric way.
- **Playwright**: For end-to-end (E2E) browser testing.

## Patterns
- Write tests for all components and hooks.
- Use mocks for API and Socket.IO interactions.
- Maintain high coverage for critical UI and logic.

## Example
```jsx
import { render, screen } from '@testing-library/react';
import GameBoard from '../src/components/GameBoard';

test('renders game board', () => {
  render(<GameBoard />);
  expect(screen.getByText(/Game/)).toBeInTheDocument();
});
```

---

See `frontend/jest.config.js` and `frontend/tests/` for test setup and examples.
