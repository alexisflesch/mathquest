# TODO: Implement Teacher Question Editor Page

## Location
- Create the page under: `teacher/questions/edit`
- Accessible only for users with the `"Teacher"` role.
- Add route protection (redirect non-teachers).

## Goal
Provide a full **question editor** to work with YAML-based question files.  
Teachers can:
- Import an existing YAML file
- Edit questions either in raw YAML or through a simplified UI
- See a live mobile-sized preview
- Export the result as a YAML file (download, share, or send by email)

The page **does not** modify the live database.  
It only works with YAML files as source + output.

---

## Layout

### Desktop (3 columns + nav)
- **Left Sidebar**
  - List of questions (by UID or title)
  - Buttons:
    - `+` Add new question (auto-generate UID)
    - 🗑️ Delete question (with confirmation)
  - Scrollable if many questions

- **Center (Edition Area)**
  - Tabs: `[ YAML | Form UI ]`
  - YAML tab → Monaco editor
    - Syntax highlighting for YAML
    - Autocomplete for LaTeX snippets (basic commands: `\frac`, `\sqrt`, etc.)
    - Show errors if YAML malformed
  - Form UI tab → Simplified editor
    - Sections: Statement, Answers, Metadata
    - Collapsible subsections for readability
    - Dropdowns, text inputs, toggles

- **Right (Preview Area)**
  - Render the currently selected question in **mobile-first layout**
  - Display inside a phone-like frame (fixed width)
  - Button: `🔍 Fullscreen preview`

- **Footer / Bottom Controls**
  - Import YAML (drag & drop OR file picker)
  - Export YAML (download file)
  - Copy raw YAML (clipboard button)

---

### Mobile (stacked tabs)
- **Top Tabs**: `[ Questions | Edit | Preview ]`
- `Questions` → list with add/delete
- `Edit` → only Form UI (no raw YAML editing on mobile)
- `Preview` → live question rendering
- **Footer controls**:
  - Import (file picker)
  - Export / Share (use `navigator.share` if available)

---

## Core Features

- **Question Management**
  - All edits are synced across YAML + Form UI + Preview
  - Switching question updates both editor and preview
  - Reordering questions (drag & drop in sidebar) [optional]

- **YAML Editor**
  - Monaco Editor integration
  - Custom completion provider for LaTeX snippets
  - Highlight YAML errors gracefully (don’t crash preview)

- **Form Editor**
  - One question at a time
  - Sections collapsible
  - Fields map to YAML structure

- **Preview**
  - Always mobile-size (simulate phone screen)
  - Toggle fullscreen preview
  - Dark/light toggle [optional]

- **Persistence**
  - Autosave current work in localStorage
  - Restore on reload

- **File I/O**
  - Import YAML → parse into question list
  - Export YAML → generate full file from current state
  - On mobile: allow email/share export

---

## Implementation Notes
- Place page in `teacher/questions/edit`.
- Protect with role check: `"Teacher"` only.
- YAML parsing: use `js-yaml`.
- Live preview: reuse the same rendering components used in the app for real gameplay.
- Local state management: React state or Zustand (your choice).
- Keep code modular: separate `SidebarQuestions`, `YamlEditor`, `FormEditor`, `PreviewPhone`, `FileControls`.

