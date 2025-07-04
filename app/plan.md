# Modernization Reference: Terminated Questions Payloads

## Payloads containing terminated questions info

- **Socket Event Payloads:**
  - `DASHBOARD_JOINED` (emitted to teacher dashboard on join)
  - `SHOW_CORRECT_ANSWERS` (emitted to teacher dashboard on trophy click or state update)

- **Canonical Shared Type:**
  - `terminatedQuestions: Record<string, boolean>`
  - Defined in: `@shared/types/socket/dashboardPayloads.ts` and validated in Zod schemas in `@shared/types/socketEvents.zod.ts`

- **Example usage:**
  - `{ ...otherFields, terminatedQuestions: { [questionUid: string]: true } }`

- **Notes:**
  - All payloads and types are canonical, Zod-validated, and must be kept in sync across backend and frontend.

## Modernization Checklist: Terminated Questions State (Teacher Dashboard)

- [x] Add and style `.question-finished` in `globals.css` for terminated questions.
- [x] Trace flow of `terminatedQuestions` from backend payload through React state in `TeacherDashboardClient.tsx`.
- [x] Pass `terminatedQuestions` as prop from `TeacherDashboardClient.tsx` to `DraggableQuestionsList.tsx`.
- [x] Update `DraggableQuestionsList.tsx` to check if a question is terminated and apply the `question-finished` class.
- [x] Update `SortableQuestion.tsx` and its props to accept and forward a `className` prop to `QuestionDisplay`.
- [x] Ensure the class is applied to the rendered question element in `QuestionDisplay.tsx`.
- [x] Fix TypeScript error in `DraggableQuestionsList.tsx` by refactoring to use a `props` object and destructuring inside the function.
- [x] Add debug logging in `DraggableQuestionsList.tsx` to verify the state of `terminatedQuestions` and `isTerminated` for each question.
- [x] Patch the `SHOW_CORRECT_ANSWERS` socket event handler in `TeacherDashboardClient.tsx` to update `terminatedQuestions` in `quizState` when present in the payload, using canonical types and Zod validation.
- [x] Update the canonical shared type and Zod schema for `ShowCorrectAnswersPayload` to require both `show` and `terminatedQuestions`.
- [x] Patch backend to always emit both `show` and `terminatedQuestions` in every `SHOW_CORRECT_ANSWERS` event, including on dashboard page load and trophy reset.
- [x] Audit backend and confirm it emits canonical UIDs in `terminatedQuestions`.
- [x] Audit frontend and patch all question mapping/state to use only canonical `uid` from the shared `Question` type (never `q-1`, `id`, or index).
- [x] Enforce canonical UID in `mapToCanonicalQuestion` (throw error if missing).
- [x] Validate that the UI updates correctly and the `.question-finished` class is applied as soon as the backend sends the updated state, both on page load and after user actions.
- [x] Update documentation and this checklist to reflect the final, clean implementation and checklist completion.

---

## Phase Exit Criteria

- [x] All question state and mapping in the teacher dashboard uses canonical `uid` only.
- [x] No legacy or fallback IDs are used anywhere in the dashboard code.
- [x] `.question-finished` is applied to the correct question element as soon as the backend sends the state.
- [x] All changes are documented and validated.

---
