---
title: UI — MathJax root position override to remove micro-scrollbar
date: 2025-10-19
tags:
  - frontend
  - mathjax
  - ui
---

# UI — MathJax root position override to remove micro-scrollbar

Context: Some MathJax CHTML renderings set `position: relative` on their root container (`mjx-container`/`.mjx-container`). In combination with constrained wrappers, this can trigger a tiny vertical scrollbar.

Change:
- In `app/frontend/src/app/globals.css`, we added a narrowly scoped rule that sets `position: static !important` on `mjx-container`/`.mjx-container` within `.question-text-in-live-page` and `.question-text-in-dashboards` contexts (and their card wrappers). This avoids the unwanted scrollbar while preserving MathJax layout and horizontal scrolling behavior.

Impact:
- Removes the stray vertical scrollbar observed in live/practice and dashboard question text.
- Does not affect other pages since the override is scoped to question text containers.

Notes:
- Horizontal overflow remains controlled by the question text container.
- If a future MathJax update changes container structure, revisit selector scope.
