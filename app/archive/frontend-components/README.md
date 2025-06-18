# Archived Frontend Components

This directory contains frontend components and pages that were developed but are no longer used in the active application.

## NavbarStates-unused-2025-06-18/

**Date Archived**: June 18, 2025  
**Reason**: Alternative navigation system that was never integrated

### Contents:
- `NavbarStateManager.tsx` - Central orchestrator for 4-state auth navbar system
- `StudentNavbar.tsx` - Student-specific navigation component  
- `TeacherNavbar.tsx` - Teacher-specific navigation component
- `GuestNavbar.tsx` - Guest user navigation component
- `AnonymousNavbar.tsx` - Anonymous user navigation component

### Why Archived:
- The app uses `AppNav.tsx` as the main navigation system
- These components were never imported or used in the actual application
- They represent a complete alternative navigation architecture
- Code quality is good but functionality is redundant

---

## practice-session-page-unused-2025-06-18/

**Date Archived**: June 18, 2025  
**Reason**: Practice sessions moved to unified create-game flow

### Contents:
- `page.tsx` - Complete practice session page component

### Why Archived:
- Practice sessions are now handled at `/student/create-game?training=true`
- This page used URL parameters for configuration (obsolete approach)
- Navigation menus now point to the new unified flow
- Redundant with access code-based practice sessions at `/student/practice/[accessCode]`

### Technical Notes:
- Used `useSearchParams()` to extract practice configuration from URL
- Complete practice session implementation with socket-based backend
- MathJax support, answer feedback, statistics tracking
- 520 lines of well-written React/TypeScript code

### If You Need to Restore:
1. Move folder back to `src/app/student/practice/session/`
2. Update navigation menus to point to this route
3. Ensure URL parameter-based configuration still works
4. Test practice session flow end-to-end

---

**All components archived during app modernization cleanup phase**
