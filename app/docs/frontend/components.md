# UI Component Library – MathQuest Frontend

This document catalogs the main reusable UI components in the MathQuest frontend. Use this as a reference for building new features or maintaining the UI.

---

## Location
All components are in `src/components/`.

---

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

## Shared UI Components – Props & Logic

### AppNav
- **Props:** None (uses context internally)
- **Logic:**
  - Responsive navigation bar (sidebar for desktop, drawer for mobile)
  - Shows/hides menu items based on authentication and user role
  - Displays user avatar and username
  - Integrates theme switching and logout
  - Handles navigation for both teachers and students

### Snackbar
- **Props:**
  - `open: boolean` – Whether the snackbar is visible
  - `message: string` – Message to display
  - `type?: "success" | "error"` – Visual style (default: success)
  - `onClose?: () => void` – Callback when dismissed
  - `duration?: number` – Auto-dismiss time (ms, default: 2000)
  - `className?: string` – Custom CSS classes
- **Logic:**
  - Shows a temporary notification at the bottom of the screen
  - Auto-dismisses after `duration` ms
  - Calls `onClose` when dismissed

### ConfirmDialog
- **Props:**
  - `open: boolean` – Whether the dialog is visible
  - `title?: string` – Dialog title
  - `message: string` – Main message
  - `onConfirm: () => void` – Called on confirmation
  - `onCancel: () => void` – Called on cancel
  - `confirmText?: string` – Confirm button label (default: "Oui")
  - `cancelText?: string` – Cancel button label (default: "Non")
- **Logic:**
  - Modal overlay blocks background
  - Calls appropriate callback on user action

### AvatarSelector
- **Props:**
  - `onSelect?: (avatar: string) => void` – Called when an avatar is selected
  - `selected?: string` – Currently selected avatar filename
- **Logic:**
  - Displays a grid of avatar images
  - Highlights the selected avatar
  - Calls `onSelect` when user picks an avatar

### CustomDropdown
- **Props:**
  - `options: string[]` – List of options
  - `value: string` – Selected value
  - `onChange: (value: string) => void` – Called when selection changes
  - `placeholder?: string` – Placeholder text
  - `label?: string` – Optional label
  - `disabled?: boolean` – Disable interaction
  - `className?: string` – Custom CSS classes
- **Logic:**
  - Custom-styled dropdown with click-outside detection
  - Keyboard accessible

### MultiSelectDropdown
- **Props:**
  - `label?: string` – Optional label
  - `options: string[]` – List of options
  - `selected: string[]` – Selected values
  - `onChange: (selected: string[]) => void` – Called when selection changes
  - `placeholder?: string` – Placeholder text
  - `disabled?: boolean` – Disable interaction
  - `className?: string` – Custom CSS classes
- **Logic:**
  - Dropdown with checkboxes for multi-selection
  - Click-outside detection, keyboard accessible

### ThemeSelector
- **Props:** None
- **Logic:** Placeholder for future theme selection UI

### ZoomControls
- **Props:**
  - `zoomFactor: number` – Current zoom (e.g., 1.0 = 100%)
  - `onZoomIn: () => void` – Called to increase zoom
  - `onZoomOut: () => void` – Called to decrease zoom
  - `className?: string` – Custom CSS classes
- **Logic:**
  - Shows zoom in/out buttons and current zoom percentage
  - Disables buttons at min/max zoom

### Trophy
- **Props:**
  - `size?: number` – Icon size (default: 64)
  - `iconColor: string` – Icon color
  - `className?: string` – Custom CSS classes
- **Logic:**
  - Animated trophy icon using framer-motion

### MathJaxWrapper
- **Props:**
  - `children: React.ReactNode` – Content to render with MathJax
  - `zoomFactor?: number` – Optional zoom for math rendering
- **Logic:**
  - Wraps children in MathJax context for LaTeX rendering
  - Supports inline/block math, logging, and zoom

---

## Usage
- Import components from `src/components/` as needed.
- Most components are written in TypeScript and accept props for customization.
- For new UI, prefer extending existing components or following their patterns.

---

## See Also
- [Frontend Architecture](frontend-architecture.md)
- [Custom React Hooks](hooks.md)
