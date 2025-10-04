# Teacher question list: selected highlight

Changed: added a clearer background and a left accent bar for the selected question in the teacher question editor list.

Files modified:

- `src/app/teacher/questions/edit/components/QuestionList.tsx` — added a left accent `div` when a question is selected and adjusted background/text classes to increase contrast.

Rationale:

- Improve visual diff when selecting a question so teachers can more easily compare the selected question to others in the list.

Notes:

- This is a purely UI change. No API or shared types were modified.
- Accessibility: `aria-selected` remains on the element. The element has role `button` which doesn't officially support `aria-selected`—this existed before the change; consider switching to `role="option"` inside a `listbox` if strict a11y is required.
