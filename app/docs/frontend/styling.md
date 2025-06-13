# MathQuest Frontend Styling

This document explains the styling approach and conventions for the MathQuest frontend.

## Styling System
- Uses Tailwind CSS for utility-first styling.
- Custom styles in `frontend/src/styles/` as needed.
- Follows responsive and accessible design principles.

## Patterns
- Prefer Tailwind utility classes in JSX.
- Use custom CSS modules for complex or reusable styles.
- Theme and color palette defined in `tailwind.config.mjs`.

## Example
```jsx
<button className="bg-primary text-white rounded px-4 py-2">Start</button>
```

---

See `frontend/src/styles/` and `tailwind.config.mjs` for details.
