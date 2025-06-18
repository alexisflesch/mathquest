# Archived Components

This directory contains components that were developed but never integrated into the main application.

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

### Technical Notes:
- Complete 4-state authentication system (anonymous, guest, student, teacher)
- Responsive design with collapsible sidebar
- Theme switching functionality
- User profile display with avatars
- All components properly typed with TypeScript

### If You Need to Restore:
1. Move folder back to `src/components/auth/NavbarStates/`
2. Update `layout.tsx` to import `NavbarStateManager` instead of `AppNav`
3. Test all authentication states and responsive behavior

---

**Archived during app modernization cleanup phase**
