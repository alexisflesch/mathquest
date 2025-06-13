# Frontend Layout Guidelines

## Overview
This document establishes consistent layout standards for the MathQuest frontend application to ensure a cohesive user experience across all pages while maintaining excellent mobile responsiveness.

## Core Layout System

### Main Content Wrapper
All pages should use the `.main-content` class defined in `globals.css`:

```tsx
<main className="main-content">
  {/* Page content */}
</main>
```

The `.main-content` class provides:
- Responsive padding (1rem on mobile, 1.5rem on larger screens)
- Proper sidebar margin handling
- Centered content with max-width constraints
- Consistent spacing across all pages

### Card Max-Width Standards

Based on content type and use case, use these standardized max-width values:

#### Authentication & Forms (`max-w-md` - 28rem)
- Login pages
- Registration forms
- Password reset forms
- Small focused forms

#### Compact Content (`max-w-lg` - 32rem)
- Profile settings
- Simple configuration pages
- Narrow content areas

#### Standard Content (`max-w-2xl` - 42rem)
- Student practice sessions
- Quiz taking interface
- Reading-focused content
- Default for most content pages

#### Dashboard Content (`max-w-4xl` - 56rem)
- Teacher dashboards
- Analytics pages
- Multi-column layouts
- Data-heavy interfaces

#### Tools & Creation (`max-w-5xl` - 64rem)
- Quiz creation interface
- Complex forms with multiple sections
- Advanced teacher tools
- Content creation pages

#### Full Width (`max-w-full`)
- Landing pages with hero sections
- Marketing content
- Wide data tables (use responsively)

### Card Structure Pattern

Use this consistent card structure:

```tsx
<main className="main-content">
  <div className="max-w-[size] mx-auto">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Card content */}
    </div>
  </div>
</main>
```

## Spacing & Padding Standards

### Container Padding
- **Main content**: Use `.main-content` class (1rem mobile, 1.5rem desktop)
- **Cards**: `p-6` (1.5rem) for standard cards, `p-4` (1rem) for compact cards
- **Forms**: `p-6` for form containers, `p-4` for form sections
- **Buttons**: Use Tailwind button classes with consistent padding

### Margins & Spacing
- **Section spacing**: `mb-6` (1.5rem) between major sections
- **Element spacing**: `mb-4` (1rem) between related elements
- **Tight spacing**: `mb-2` (0.5rem) for closely related items
- **Form elements**: `mb-4` between form fields

## Color System

### Never Hard-Code Colors
Always use CSS variables from `globals.css`. Available color tokens:

#### Background Colors
```css
bg-background          /* Main page background */
bg-card               /* Card backgrounds */
bg-popover           /* Overlay backgrounds */
bg-primary           /* Primary buttons/elements */
bg-secondary         /* Secondary elements */
bg-muted             /* Subtle backgrounds */
bg-accent            /* Accent elements */
```

#### Text Colors
```css
text-foreground      /* Primary text */
text-muted-foreground /* Secondary text */
text-primary         /* Primary brand text */
text-secondary       /* Secondary brand text */
text-accent          /* Accent text */
text-destructive     /* Error/warning text */
```

#### Border Colors
```css
border-border        /* Standard borders */
border-input         /* Form input borders */
border-ring          /* Focus rings */
border-primary       /* Primary borders */
border-secondary     /* Secondary borders */
```

### Common Color Patterns
```tsx
// Standard card
className="bg-card text-card-foreground border-border"

// Primary button
className="bg-primary text-primary-foreground hover:bg-primary/90"

// Secondary button  
className="bg-secondary text-secondary-foreground hover:bg-secondary/80"

// Muted text
className="text-muted-foreground"

// Error state
className="text-destructive border-destructive"
```

## Responsive Design Principles

### Mobile-First Approach
- Start with mobile layout (320px+)
- Use Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- Test on mobile devices regularly

### Breakpoint Usage
- **sm (640px+)**: Small adjustments, larger touch targets
- **md (768px+)**: Tablet layouts, show more content
- **lg (1024px+)**: Desktop layouts, multi-column content
- **xl (1280px+)**: Large desktop optimizations
- **2xl (1536px+)**: Extra large screens

### Touch-Friendly Design
- Minimum 44px touch targets on mobile
- Adequate spacing between interactive elements
- Consider thumb reach zones

## Component Patterns

### Navigation
- Use consistent navigation patterns
- Maintain proper focus states
- Ensure keyboard accessibility

### Forms
- Consistent form field styling
- Proper error states
- Clear validation feedback
- Accessible labels and descriptions

### Loading States
- Consistent loading indicators
- Skeleton screens for content
- Proper loading text

### Error States
- Clear error messages
- Consistent error styling using `text-destructive`
- Actionable error recovery

## Accessibility Standards

### Semantic HTML
- Use proper heading hierarchy (h1, h2, h3...)
- Semantic elements (main, section, article, nav)
- Proper ARIA labels where needed

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus trapping in modals

### Color Contrast
- Ensure sufficient contrast ratios
- Don't rely on color alone for information
- Test with color blindness simulators

## Performance Considerations

### Image Optimization
- Use Next.js Image component
- Proper alt text for accessibility
- Responsive image sizing

### CSS Optimization
- Leverage Tailwind's purging
- Minimize custom CSS
- Use CSS variables for theming

### Bundle Size
- Import only needed components
- Use dynamic imports for large components
- Monitor bundle size regularly

## Best Practices Checklist

### Before Creating a New Page:
- [ ] Choose appropriate max-width from standards above
- [ ] Use `.main-content` wrapper class
- [ ] Follow card structure pattern
- [ ] Use color variables, never hard-coded colors
- [ ] Test on mobile devices
- [ ] Verify accessibility compliance
- [ ] Check contrast ratios
- [ ] Validate HTML semantics

### During Development:
- [ ] Follow consistent spacing patterns
- [ ] Use appropriate breakpoints
- [ ] Implement proper loading states
- [ ] Add error handling
- [ ] Test keyboard navigation
- [ ] Verify focus management

### Before Deployment:
- [ ] Cross-browser testing
- [ ] Mobile responsiveness verification
- [ ] Accessibility audit
- [ ] Performance testing
- [ ] Color theme testing (light/dark)

## Common Anti-Patterns to Avoid

### Layout Issues
- ❌ Hard-coding widths instead of using max-width classes
- ❌ Inconsistent padding across similar components
- ❌ Missing responsive breakpoints
- ❌ Not using the `.main-content` wrapper

### Color Issues
- ❌ Hard-coding colors like `#ffffff` or `rgb(255,255,255)`
- ❌ Not supporting dark mode
- ❌ Insufficient color contrast
- ❌ Using arbitrary color values

### Spacing Issues
- ❌ Inconsistent margins between elements
- ❌ Not following the spacing scale
- ❌ Missing spacing on mobile devices
- ❌ Overcrowded interfaces

## Migration Guide

### For Existing Pages:
1. Audit current layout against these standards
2. Replace hard-coded colors with CSS variables
3. Standardize max-width values to approved sizes
4. Ensure `.main-content` wrapper is used
5. Verify mobile responsiveness
6. Test accessibility compliance

### Priority Order:
1. High-traffic pages (dashboard, practice sessions)
2. Teacher tools (quiz creation, management)
3. Authentication flows
4. Secondary pages

## Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Accessibility Guidelines**: https://web.dev/accessibility/
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/

---

*Last updated: June 4, 2025*
*For questions or suggestions, please create an issue in the project repository.*
