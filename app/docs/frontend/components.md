<!-- filepath: /home/aflesch/mathquest/app/docs/frontend/components.md -->
# UI Component Library – MathQuest Frontend

_Last updated: 2025-06-01_

## Purpose
Catalog of reusable UI components in the MathQuest frontend. Use this as a reference for building or maintaining UI features.

## See Also
- [Frontend Architecture](./frontend-architecture.md)
- [Hooks Reference](./hooks.md)

---

## Location
All components are in `src/components/`.

## Core Categories

### Quiz Components
- **QuizList** – Lists available quizzes
- **QuestionDisplay** – Renders a quiz question
- **AnswerFeedbackOverlay** – Shows feedback after answering
- **QuestionSelector** – Allows teachers to pick questions
- **DraggableQuestionsList** – For reordering questions
- **GoodAnswer / WrongAnswer** – Feedback overlays

### Tournament Components
- **Lobby** – Tournament waiting room
- **Scoreboard** – Displays scores/leaderboard
- **TournamentTimer** – Countdown for tournament rounds
- **ClassementPodium** – Podium for top players
- **TournamentQuestionCard** – Tournament question UI

### Shared UI Components
- **AppNav** – Main navigation bar
- **Snackbar** – Toast notifications
- **ConfirmDialog** – Confirmation modal
- **AvatarSelector** – User avatar picker
- **CustomDropdown / MultiSelectDropdown** – Custom select inputs
- **ThemeSelector** – Theme switcher
- **ZoomControls** – For projection view
- **Trophy** – Trophy/award icon
- **MathJaxWrapper** – Math rendering support

---

## Example: AppNav
- **Props:** None (uses context internally)
- **Logic:** Responsive navigation bar, shows/hides menu items by role, displays user avatar, integrates theme switching and logout.

---

For detailed props and usage, see the source files in `src/components/`.
