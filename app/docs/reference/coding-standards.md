# Coding Standards

This document defines the coding conventions for MathQuest to ensure consistency and maintainability.

## 1. TypeScript & JavaScript
- Use TypeScript for all new code.
- Prefer `const` and `let` over `var`.
- Use explicit types for function signatures and exports.
- Enable strict mode in `tsconfig.json`.

## 2. React
- Use functional components and hooks.
- Name components with PascalCase.
- Use prop types and default values.
- Keep components small and focused.

## 3. File Organization
- Group files by feature/module.
- Use `index.ts` for module entry points.
- Place tests next to the code they test (`*.test.ts` or `*.spec.ts`).

## 4. Imports & Exports
- Use absolute imports where possible.
- Prefer named exports over default exports.
- Group imports: external, shared, local.

## 5. Linting & Formatting
- Use ESLint and Prettier for code style enforcement.
- Fix all lint errors before committing.

## 6. Naming Conventions
- Use camelCase for variables and functions.
- Use PascalCase for types and components.
- Use UPPER_SNAKE_CASE for constants.

---

For more, see [naming conventions](./naming-conventions.md) and [shared/type-system.md](../shared/type-system.md).
