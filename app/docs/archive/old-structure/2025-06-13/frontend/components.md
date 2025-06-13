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
- **ConfirmationModal** – Confirmation modal for destructive actions
- **AvatarSelector** – User avatar picker
- **CustomDropdown / MultiSelectDropdown** – Custom select inputs with improved responsive design
- **ThemeSelector** – Theme switcher
- **ZoomControls** – For projection view
- **Trophy** – Trophy/award icon
- **MathJaxWrapper** – Math rendering support
- **InfinitySpin** – Branded loading spinner with infinity symbol animation

---

## Example: CustomDropdown & MultiSelectDropdown
- **Props:** 
  - `options: string[]` - Available options to select from
  - `value: string` (CustomDropdown) or `selected: string[]` (MultiSelectDropdown) - Current selection
  - `onChange: (value) => void` - Selection change handler
  - `placeholder?: string` - Placeholder text
  - `label?: string` - Optional label
  - `disabled?: boolean` - Disable the dropdown
  - `className?: string` - Additional CSS classes
- **Features:**
  - Responsive flexbox layout prevents text wrapping issues
  - Classical gray chevron icons from lucide-react with smooth rotation animation
  - Proper text truncation and responsive behavior on smaller screens  
  - Consistent styling with theme variables
  - Click-outside detection for automatic closing
- **Usage:** Use for form inputs where standard HTML select doesn't provide enough control

## Example: AppNav
- **Props:** None (uses context internally)
- **Logic:** Responsive navigation bar, shows/hides menu items by role, displays user avatar, integrates theme switching and logout.

## Example: InfinitySpin
- **Props:** 
  - `size?: number` (default: 100) - Size in pixels
  - `baseColor?: string` (default: "#ccc") - Base path color
  - `trailColor?: string` (default: "#3b82f6") - Animated trail color
- **Logic:** SVG-based infinity symbol with animated trail effect. Branded loading component used throughout the app for consistent UX.
- **Usage:** Replace generic loading spinners with this component for brand consistency.

---

## Loading Patterns

### Standard Loading States
The MathQuest frontend uses consistent loading patterns across all pages:

1. **Global App Loading** (`layout.tsx`): Full-screen `InfinitySpin` (150px) with app logo during auth initialization
2. **Page Loading** (`loading/page.tsx`): Identical to global loading, used for page transitions
3. **Component Loading**: Smaller `InfinitySpin` (20-48px) for individual components
4. **Modal Loading**: Medium `InfinitySpin` (24px) with loading text for modal operations
5. **Button Loading**: Inline loading state with disabled button and loading text

### Implementation Guidelines
- Always use `InfinitySpin` instead of generic spinners for brand consistency
- Size guidelines:
  - Full page: 150px
  - Main content areas: 48px
  - Component sections: 20-32px
  - Modals/buttons: 20-24px
- Include descriptive loading text when space allows
- Disable interactive elements during loading states

---

For detailed props and usage, see the source files in `src/components/`.
