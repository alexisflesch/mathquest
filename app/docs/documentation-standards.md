# MathQuest Documentation Standards

This document outlines the standards and best practices for creating and maintaining documentation for the MathQuest application.

## Documentation Organization

All documentation is stored in the `/docs` directory and organized into logical categories:

```
docs/
├── overview/       # High-level project overview
├── setup/          # Setup and installation
├── architecture/   # System architecture
├── frontend/       # Frontend documentation
├── backend/        # Backend documentation
├── api/            # API documentation
├── sockets/        # Socket communication
├── types/          # Type system
├── project/        # Project management
└── archive/        # Archived documentation
```

Each category folder should contain:

- A `README.md` file that serves as an index for that category
- Topic-specific markdown files for detailed documentation
- Optional subfolders for more complex topics

## File Naming Conventions

- Use kebab-case for all documentation file names (e.g., `socket-guide.md`)
- Make file names descriptive and concise
- Avoid using spaces or special characters in file names
- Include `-guide` suffix for instructional documentation
- Include `-reference` suffix for reference documentation

## Document Structure

Each document should include:

1. **Title**: A clear, descriptive title at the top of the document
2. **Introduction**: A brief overview of what the document covers
3. **Main Content**: Organized into logical sections with clear headings
4. **Related Documentation**: Links to related documents
5. **Examples**: Code examples or usage examples where appropriate

## Markdown Guidelines

- Use Markdown formatting consistently
- Use heading levels (# through ######) to create a clear document hierarchy
- Use code blocks with language specifiers for code examples
- Use bullet points and numbered lists for clarity
- Use tables for structured information
- Use blockquotes for important notes or warnings

### Code Examples

```typescript
// Code examples should be properly formatted
function example(param: string): string {
  return `Example with ${param}`;
}
```

### Important Notes

> **Important:** Use blockquotes for important information that should stand out from the main text.

## Links and References

- Use relative links when linking to other documents within the MathQuest documentation
- Use absolute links when linking to external resources
- Include descriptive link text rather than using "click here" or similar phrases

Example:
```markdown
See the [Type Architecture](../types/type-architecture.md) document for more information.
```

## Documentation Updates

1. **When to Update Documentation**:
   - When adding new features
   - When modifying existing features
   - When fixing bugs that change behavior
   - When refactoring code that changes architecture

2. **Documentation Review**:
   - Documentation should be reviewed alongside code changes
   - Check for accuracy, clarity, and completeness

## Documentation Types

### Reference Documentation

Reference documentation should be comprehensive and accurate, focusing on:
- API endpoints and their parameters
- Type definitions and interfaces
- Component props and methods
- Configuration options

### Guides and Tutorials

Guides should be instructional and easy to follow:
- Include step-by-step instructions
- Provide complete code examples
- Explain concepts clearly
- Address common issues or pitfalls

### Architecture Documentation

Architecture documentation should explain:
- System components and their relationships
- Data flows and state management
- Design decisions and rationales
- Constraints and limitations

## Keeping Documentation Current

To ensure documentation remains up-to-date:

1. Treat documentation updates as part of the definition of "done" for any task
2. Regularly review documentation for accuracy
3. Archive obsolete documentation rather than deleting it
4. Date important documentation that might change over time
