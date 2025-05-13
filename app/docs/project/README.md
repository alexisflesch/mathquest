# Project Management Documentation

This directory contains project management documentation for the MathQuest application.

## Current Priorities

The project is currently focusing on these areas:

1. TypeScript migration and type system improvements
2. Standardizing communication between frontend and backend
3. Refactoring shared logic between quiz and tournament modes
4. Improving code quality and removing redundancy

## TODO List

See [TODO.md](TODO.md) for the current list of tasks and priorities.

## Migration Status

The project is undergoing several migrations and refactorings:

- **TypeScript Migration** - Converting JavaScript code to TypeScript
- **Type System Consolidation** - Creating a shared types repository
- **Socket Communication Standardization** - Standardizing socket event names and payloads
- **Code Quality Improvements** - Improving code quality and reducing duplication

See [migration-progress-summary.md](migration-progress-summary.md) for the current status of these efforts.

## Development Guidelines

- **Code Organization** - Code should be factored into small files (<500 lines)
- **Documentation** - All code should be well-documented
- **Testing** - All code should have corresponding tests
- **Code Review** - All pull requests should be reviewed by at least one other developer
- **Continuous Integration** - All code should pass CI checks before merging

## Release Process

1. Feature development in feature branches
2. Pull request and code review
3. Merge to development branch
4. QA testing
5. Release candidate creation
6. Production deployment

## Related Documentation

- [Contributing Guide](contributing.md)
- [Coding Standards](coding-standards.md)
- [Release Process](release-process.md)
