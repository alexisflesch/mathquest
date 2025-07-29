# plan.md

## Phase: GameModeToggle Mobile & Icon Modernization

### Goals
- Fix tab overflow on mobile for the three game mode tabs.
- Replace emoji icons with lucide-react icons, matching those used in the teacher/games "create new gameInstance" modal.

### Checklist
- [x] Review and document the current GameModeToggle implementation.
- [x] Identify the correct lucide-react icons used in the teacher/games modal (Users, Target, Dumbbell).
- [x] Replace emoji icons with lucide-react icons in GameModeToggle.
- [x] Refactor the tab layout to prevent overflow/cropping on mobile (ensure full visibility and usability).
- [x] Test on mobile viewport for correct appearance and interaction (active tab expands, others are icon-only, separators shown).
- [x] Update documentation and log changes.

### Log
- Updated GameModeToggle:
  - Only the active tab shows its label, others are icon-only.
  - Active tab expands to fit label, others stay compact.
  - Vertical separators added between tabs.
  - No overflow or scrollbars on mobile.
