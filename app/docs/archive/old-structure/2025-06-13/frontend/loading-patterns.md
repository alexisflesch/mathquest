# Loading Patterns & InfinitySpin Component

_Last updated: 2025-06-08_

## Purpose
Documentation of loading states and the InfinitySpin component across the MathQuest frontend. Provides guidelines for consistent loading UX and identifies areas for improvement.

## See Also
- [Component Library](./components.md)
- [Frontend Architecture](./frontend-architecture.md)

---

## InfinitySpin Component

### Overview
The `InfinitySpin` component is a custom SVG-based loading spinner featuring an animated infinity symbol. It provides branded loading states throughout the MathQuest application.

### Location
`src/components/InfinitySpin.tsx`

### Props
```typescript
interface InfinitySpinProps {
  size?: number;        // Size in pixels (default: 100)
  baseColor?: string;   // Base path color (default: "#ccc")
  trailColor?: string;  // Animated trail color (default: "#3b82f6")
}
```

### Features
- SVG-based infinity symbol with smooth animation
- Customizable size and colors
- Vertical scaling (1.5x) for better visual proportion
- CSS keyframe animation with 1.5s duration
- Responsive and accessible

### Usage Examples
```tsx
// Full page loading
<InfinitySpin size={150} />

// Component loading
<InfinitySpin size={32} />

// Modal loading
<InfinitySpin size={24} />
```

---

## Current Loading Implementations

### ✅ Properly Implemented (Using InfinitySpin)

1. **Global App Loading** (`layout.tsx`)
   - Location: `LoadingScreen` component
   - Size: 150px
   - Context: Authentication initialization
   - Additional elements: App logo, loading text, decorative math symbols

2. **Loading Page** (`loading/page.tsx`)
   - Location: Dedicated loading page
   - Size: 150px
   - Context: Page transitions
   - Identical to global loading screen

3. **Teacher Games Page** (`teacher/games/page.tsx`)
   - Locations:
     - Game instances loading: 20px
     - Modal creation loading: 24px
     - Main page loading: 48px
   - Context: Game management operations

4. **Navigation Loading** (`NavbarStateManager.tsx`)
   - Uses InfinitySpin for navbar loading states
   - Size: Default (100px)
   - Context: Authentication state loading

---

## 🔄 Migration Completed ✅

### Successfully Migrated to InfinitySpin

All critical pages and components have been successfully migrated from generic loading spinners to the branded InfinitySpin component:

1. **✅ Login Page** (`app/login/page.tsx`) - 48px InfinitySpin
2. **✅ Home Page** (`app/page.tsx`) - 48px InfinitySpin  
3. **✅ Lobby Page** (`app/lobby/[code]/page.tsx`) - 48px InfinitySpin
4. **✅ Live Game Page** (`app/live/[code]/page.tsx`) - 48px InfinitySpin
5. **✅ Confirmation Modal** (`components/ConfirmationModal.tsx`) - 16px white trail
6. **✅ Teacher Games New Page** (`app/teacher/games/new/page.tsx`) - 80px InfinitySpin with improved layout

### UI Component Improvements ✅

**Dropdown Components Fixed:**
- **✅ MultiSelectDropdown**: Replaced colorful chevrons with classical gray ChevronDown icons from lucide-react
- **✅ CustomDropdown**: Improved responsive layout with flexbox to prevent text wrapping 
- **✅ Both components**: Added smooth rotation animation for chevrons and better text truncation

**Key Improvements:**
- Replaced Unicode `▼` with proper `ChevronDown` icon from lucide-react
- Fixed layout issues where text would wrap to new line with chevron on separate line
- Normalized chevron colors to neutral gray (`text-gray-600 dark:text-gray-400`)
- Added smooth 180° rotation animation when dropdown opens/closes
- Improved responsive behavior with `truncate`, `flex-1`, and `min-w-0` classes
- Better alignment with `justify-between` flexbox layout

---

## 📋 Migration Guidelines (For Future Components)

When adding new loading states or updating existing ones, follow these patterns:

### Size Recommendations
- **Full Page Loading**: 150px (with app branding)
- **Main Content Areas**: 48px 
- **Component Sections**: 32px
- **Card/List Items**: 20px
- **Modal Content**: 24px
- **Button Loading**: 16-20px

### Implementation Best Practices

1. **Consistent Branding**
   - Always use InfinitySpin instead of generic spinners
   - Maintain consistent sizing across similar contexts

2. **User Experience**
   - Include descriptive loading text when space allows
   - Disable interactive elements during loading
   - Use appropriate sizes for the context

3. **Performance**
   - Wrap loading states in proper React hooks
   - Avoid unnecessary re-renders during loading
   - Consider skeleton loading for complex layouts

4. **Accessibility**
   - Include aria-label attributes for screen readers
   - Ensure loading states are announced properly
   - Maintain proper focus management

---

## 🔄 Migration Complete ✅

### Phase 1: Critical Pages (Priority: High) - ✅ COMPLETED
- [x] **Login page loading spinner** - Migrated to `InfinitySpin` (48px)
- [x] **Home page loading spinner** - Migrated to `InfinitySpin` (48px)  
- [x] **Lobby page loading spinners** - Migrated to `InfinitySpin` (48px)
- [x] **Live game page loading spinner** - Migrated to `InfinitySpin` (48px)

### Phase 2: Component Updates (Priority: Medium) - ✅ COMPLETED
- [x] **Confirmation modal button loading** - Migrated to `InfinitySpin` (16px, white trail)
- [x] **Game edit page loading states** - Migrated all instances:
  - Main loading: `InfinitySpin` (48px)
  - Button loading: `InfinitySpin` (16px, white trail)

### Migration Summary
All generic loading spinners have been successfully replaced with the branded `InfinitySpin` component:

1. **DaisyUI spinners** (`loading-spinner` classes) → `InfinitySpin`
2. **CSS animate-spin** (custom border animations) → `InfinitySpin`
3. **Consistent sizing** applied across all contexts
4. **Proper color variants** (white trail for dark backgrounds)

### Files Updated
- ✅ `/app/login/page.tsx`
- ✅ `/app/page.tsx` 
- ✅ `/app/lobby/[code]/page.tsx`
- ✅ `/app/live/[code]/page.tsx`
- ✅ `/components/ConfirmationModal.tsx`
- ✅ `/app/teacher/games/new/page.tsx` - **FINAL UPDATE COMPLETED** ✨
- ✅ `/app/teacher/games/[id]/edit/page.tsx`

### Phase 3: Enhancements (Priority: Low)
- [ ] Add skeleton loading for complex layouts
- [ ] Implement loading state management hook
- [ ] Add loading analytics/performance tracking

---

## Code Examples

### Before (Generic Spinner)
```tsx
// ❌ Generic DaisyUI spinner
<div className="loading loading-spinner loading-lg"></div>

// ❌ Custom CSS animation
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
```

### After (InfinitySpin)
```tsx
// ✅ Branded loading component
import InfinitySpin from '@/components/InfinitySpin';

<InfinitySpin size={48} />

// ✅ With loading text
<div className="flex items-center justify-center">
  <InfinitySpin size={24} />
  <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
</div>
```

### Loading State Hook Pattern
```tsx
const [isLoading, setIsLoading] = useState(false);

// In component JSX
{isLoading && (
  <div className="flex items-center justify-center py-4">
    <InfinitySpin size={32} />
  </div>
)}
```

---

## Future Improvements

### Phase 3: Enhancements (Priority: Low) - PENDING
- [ ] Add skeleton loading for complex layouts
- [ ] Implement loading state management hook
- [ ] Add loading analytics/performance tracking

### Recommended Enhancements

1. **Loading State Management Hook**
   ```tsx
   // Custom hook for consistent loading state management
   function useLoadingState() {
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     
     const withLoading = async <T>(operation: () => Promise<T>): Promise<T> => {
       setIsLoading(true);
       setError(null);
       try {
         const result = await operation();
         return result;
       } catch (err) {
         setError(err instanceof Error ? err.message : 'An error occurred');
         throw err;
       } finally {
         setIsLoading(false);
       }
     };
     
     return { isLoading, error, withLoading };
   }
   ```

2. **Skeleton Loading Components**
   - Create skeleton versions of complex UI components
   - Use for game lists, question cards, and leaderboards
   - Provides better perceived performance than simple spinners

3. **Progressive Loading Patterns**
   - Implement intersection observer for lazy loading
   - Use for long lists of games or questions
   - Reduce initial bundle size and improve performance

4. **Loading Analytics**
   - Track loading times across different components
   - Identify performance bottlenecks
   - Monitor user experience metrics
