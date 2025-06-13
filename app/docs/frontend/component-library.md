# MathQuest Component Library (Code-Driven Catalog)

This document catalogs the main React components in the MathQuest frontend, based on the actual codebase (`frontend/src/components/`).

## Navigation & Layout
- **AppNav.tsx / AppNav.back.tsx**: Main navigation bar, responsive, supports all authentication states.
- **AuthProvider.tsx**: Provides authentication context for anonymous, guest, student, and teacher users.

## Game & Quiz Interfaces
- **Lobby.tsx**: Tournament waiting room, shows connected players and controls.
- **Scoreboard.tsx**: Displays player rankings in real time.
- **ClassementPodium.tsx**: Podium for top 3 players.
- **QuestionDisplay.tsx**: Renders a quiz/tournament question (canonical format).
- **QuestionCard.tsx**: Interactive question card for quizzes/tournaments.
- **TournamentQuestionCard.tsx**: Specialized card for tournament questions.
- **DraggableQuestionsList.tsx**: Teacher dashboard, drag-and-drop question management.
- **SortableQuestion.tsx**: Individual draggable question for reordering.
- **QuestionSelector.tsx**: Select/filter questions for quizzes/tournaments.
- **QuizList.tsx**: List of available quizzes for selection.
- **TournamentTimer.tsx**: Timer for tournament questions.
- **AnswerFeedbackOverlay.tsx**: Shows feedback after answering a question.
- **GoodAnswer.tsx / WrongAnswer.tsx**: Animated feedback icons for correct/incorrect answers.

## UI & Utility Components
- **Snackbar.tsx**: Toast notifications for user feedback.
- **ConfirmationModal.tsx / ConfirmDialog.tsx**: Modal dialogs for confirmations and warnings.
- **CustomDropdown.tsx / MultiSelectDropdown.tsx**: Custom (multi-)select dropdowns.
- **AvatarSelector.tsx / ui/AvatarGrid.tsx**: Avatar selection grids for user profiles.
- **MathJaxWrapper.tsx**: Renders LaTeX/MathJax in questions and explanations.
- **ZoomControls.tsx**: UI for zooming content in/out.
- **Trophy.tsx**: Animated trophy icon for awards.
- **InfinitySpin.tsx**: Animated loading spinner.
- **CodeManager.tsx**: Handles tournament/quiz code generation and updates.

## Profile & Auth
- **profile/ProfileForm.tsx**: User profile editing form.
- **profile/AccountUpgradeForm.tsx / TeacherUpgradeForm.tsx**: Account upgrade flows.
- **auth/GuestForm.tsx / GuestUpgradeForm.tsx / StudentAuthForm.tsx**: Auth and registration forms.
- **auth/AuthModeToggle.tsx**: Switches between auth modes.

## Testing
- **__tests__/**: Unit tests for components (e.g., AppNav, BasicButton).

---

For detailed props and usage, see the source in `frontend/src/components/` and subfolders. This catalog is based on a direct scan of the codebase and reflects the current set of components.
