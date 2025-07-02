## [2025-07-02] Phase: Dropdown Modernization (Light/Dark Theme Compliance)

### Goal
Modernize all dropdown components to use only canonical theme variables from `globals.css`, ensuring full readability and visual correctness in both light and dark modes. Remove all hard-coded colors and enforce strict modernization/documentation guidelines.

### Checklist
- [x] Identify all dropdown components and usages on `/student/create-game` and related pages.
- [x] Remove all hard-coded color classes from `MultiSelectDropdown`, `EnhancedSingleSelectDropdown`, and related dropdowns.
- [x] Add and use canonical CSS variables and utility classes from `globals.css` (e.g., `--dropdown`, `--dropdown-foreground`, `--dropdown-hover`, `--dropdown-hover-foreground`, `.text-dropdown-foreground`, `.text-dropdown-hover-foreground`, `.bg-dropdown-hover`).
- [x] Update dropdown option rendering to use only canonical theme classes, including `hover:text-dropdown-hover-foreground`.
- [x] Update parent component usages to remove conflicting text color classes.
- [x] Ensure all dropdowns and their options use only theme variables for color, background, and border.
- [x] Modernize `MultiSelectDropdown` to be fully theme-compliant.
- [x] Modernize `EnhancedSingleSelectDropdown` to be fully theme-compliant.
- [ ] Modernize `EnhancedMultiSelectDropdown` to be fully theme-compliant.
- [ ] Confirm all dropdowns (including those using `.enhanced-dropdown-option`) are readable and visually correct in both light and dark themes.
- [ ] Update documentation and log all actions in `plan.md` as required by modernization guidelines.

### Testing Steps
1. Open `/student/create-game` and any page using dropdowns.
2. Switch between light and dark themes.
3. Verify all dropdowns and their options are readable, with correct background and text color on normal, hover, and selected states.
4. Ensure no hard-coded colors are present (inspect elements if needed).
5. Confirm no parent class overrides break dropdown readability.

### Expected vs. Actual
- **Expected:** All dropdowns use only canonical theme variables, are fully readable, and visually correct in both light and dark themes.
- **Actual:** (Update after testing)

### Log
- 2025-07-02: Modernized `MultiSelectDropdown` and `EnhancedSingleSelectDropdown` to use only canonical theme classes for all states. Removed all hard-coded color styles. Next: update `EnhancedMultiSelectDropdown` and confirm all dropdowns are compliant.

## [2025-07-02] Phase: Dashboard GameControlStatePayload Modernization

### Goal
Add `gameInstanceName` to the canonical dashboard state payload, update Zod validation, and ensure all backend/frontend usage is aligned. Document all changes per modernization guidelines.

### Checklist
- [x] Update shared TypeScript interface for dashboard state payload to include `gameInstanceName`
- [x] Update Zod schema for dashboard state payload to require `gameInstanceName`
- [x] Ensure all backend/frontend usage is aligned with new field
- [x] Update dashboard page to display GameInstance name in the title
- [ ] Log/document all changes as per modernization guidelines

### Log
- 2025-07-02: Frontend dashboard now displays both template (activity) name and GameInstance name in the title, using canonical socket payload only. Legacy API fetch removed.
