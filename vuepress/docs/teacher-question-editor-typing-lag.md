---
title: Teacher Question Editor - Typing Lag Investigation
---

# Typing lag investigation (Teacher Question Editor)

Summary of findings and quick remediation performed on {date}.

## Background

Users reported heavy typing lag on the teacher question editor (`/teacher/questions/edit`). The editor is a Monaco YAML editor kept in-sync with a parsed `questions` model and a form-mode `QuestionEditor` preview. While reproducing the problem we identified several per-keystroke work items that can block the main thread.

## Root causes identified

- Synchronous writes to `localStorage` on every keystroke (main-thread blocking).
- Full-document YAML parsing (`js-yaml`) on every keystroke to sync form state and to compute per-question problems.
- Full-document YAML serialization (`yaml.dump`) on every field change in the form to keep YAML in sync.
- Monaco completion providers and validation that scan the whole model frequently.
- MathJax re-typesetting in the preview when its input changes (or when the component re-renders).
- Excessive console.debug logging in multiple components (previously removed/gated).

## Changes applied in this PR/branch

- Debounced writing to `localStorage` for the editor autosave (500ms debounce). File updated:
  - `app/frontend/src/app/teacher/questions/edit/TeacherQuestionEditorPageClient.tsx`
- Memoized MathJax rendering to avoid repeated re-typesetting when the rendered content hasn't changed:
  - `app/frontend/src/components/MathJaxWrapper.tsx`
- Documentation entry describing findings and commands to run the reproduction test (this file).

## Files referenced

- `TeacherQuestionEditorPageClient.tsx` — page-level wiring of YAML <-> questions, autosave logic, parsing/serializing.
- `MonacoYamlEditor.tsx` — Monaco integration: completion providers, validation and per-keystroke handling (not modified here, but a target for future optimization).
- `QuestionEditor.tsx` — form-mode editor which currently triggers whole-document serialization when fields change.
- `MathJaxWrapper.tsx` — client-side MathJax typesetting (memoized to avoid re-typesetting identical content).

## How to run the reproduction test

From the `app/frontend` directory run the Jest test that was added during the investigation:

```bash
cd app/frontend
npm test -- --testPathPattern=MonacoYamlEditor.lag-reproduction.test.tsx --colors
```

This test mounts a mocked Monaco editor, simulates many rapid editor updates, and asserts that noisy logging is bounded.

## Recommended next experiments (priority order)

1. Temporarily disable full-document `yaml.load` parsing on every keystroke; move parsing to a debounced worker and only update the `questions` form model after a short delay.
2. Avoid `yaml.dump` on every form-field change; batch or debounce serialization and only sync the YAML view when user pauses editing or explicitly requests it.
3. Move expensive validation and marker creation into a Web Worker (Monaco supports worker-based diagnostics).
4. Profile MathJax typesetting time and consider caching rendered nodes or switching to KaTeX for faster render times where possible.

## Notes

These changes are intentionally conservative: they reduce main-thread work and avoid changing UX contracts. The more invasive fixes (worker-based parsing, structural changes to sync logic) should be implemented in follow-up phases with TDD and test coverage.
