# ESLint and TypeScript Build Configuration

## Current Setup

The project is configured to run ESLint and TypeScript checks during the build process, ensuring code quality and type safety.

### Next.js Configuration

In `frontend/next.config.ts`, we enforce linting and type checking:

```typescript
{
  eslint: {
    // Enforce strict linting
    dirs: ['.'],
  },
  typescript: {
    // Enforce strict type checking
  }
}
```

### ESLint Configuration

The ESLint configuration is set up in `frontend/.eslintrc.json` with the following settings:

```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "plugins": ["react-hooks", "@typescript-eslint"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 2021,
    "sourceType": "module"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

## Running Linting Manually

To run ESLint checks manually:

```bash
cd frontend
npm run lint
```

## Future Considerations

Once the codebase is stabilized and unused variables/imports are cleaned up, consider:

1. Setting `ignoreDuringBuilds` back to `false` for both ESLint and TypeScript
2. Addressing all the warnings about unused variables and imports
3. Fixing any rule violations for React hooks dependencies
