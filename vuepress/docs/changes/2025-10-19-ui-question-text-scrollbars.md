---
title: UI — Remove vertical scrollbars in question text
date: 2025-10-19
tags:
  - frontend
  - mathjax
  - ui
  - tests
---

# UI — Remove vertical scrollbars in question text

Context: Question text areas occasionally showed vertical scrollbars in dashboards and selection views, particularly with MathJax content. Investigation showed that the expanded question text container didn’t explicitly own horizontal scrolling, and nested MathJax wrappers could contribute to fractional height overflow.

Changes:
- Component: `app/frontend/src/components/QuestionDisplay.tsx`
  - Added explicit inline styles to expanded question text containers (`.question-text-in-dashboards`): `overflowX: 'auto'`, `overflowY: 'visible'`, `maxHeight: 'none'`. This ensures horizontal scrolling is owned by the question text block and prevents internal vertical scrollbars.

Tests:
- Added: `app/frontend/src/components/__tests__/QuestionDisplay.scroll-structure.test.tsx`
  - Verifies the expanded question text element has inline `overflowX: auto` and no vertical scroll, preventing regressions.

Notes:
- Global MathJax-related overrides remain in `globals.css` and `mathjax-overrides.css` to keep MathJax containers vertically unconstrained and to avoid nested scroll regions. The inline style in `QuestionDisplay` tightly scopes the horizontal scroll behavior to the rendered question text block.

Validation:
- Jest: run the focused test in the frontend package; it passes after the component change.
