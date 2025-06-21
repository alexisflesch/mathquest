# SharedModal Component Guide

The `SharedModal` component provides a unified, consistent modal system for the MathQuest application. It replaces the various custom modal implementations with a single, feature-rich component that supports multiple variants.

## 🎯 Goals

- **Consistency**: All modals across the app have the same look, feel, and behavior
- **Accessibility**: Proper focus management, keyboard navigation, and ARIA support
- **Flexibility**: Support for different modal types while maintaining consistency
- **Performance**: Smooth animations and optimized rendering
- **Dark Theme**: Full compatibility with light and dark themes

## 🚀 Usage

### Basic SharedModal

```tsx
import { SharedModal } from '@/components/SharedModal';

function MyComponent() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <SharedModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="My Modal"
            variant="info"
            size="md"
        >
            <p>Modal content goes here</p>
        </SharedModal>
    );
}
```

### InfoModal (Convenience Component)

```tsx
import { InfoModal } from '@/components/SharedModal';

function StatsModal() {
    return (
        <InfoModal
            isOpen={showStats}
            onClose={() => setShowStats(false)}
            title={
                <div className="flex items-center gap-3">
                    <BarChart3 size={24} />
                    <span>Statistics</span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-4">
                <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-bold">85%</span>
                </div>
                {/* More stats... */}
            </div>
        </InfoModal>
    );
}
```

### ConfirmationModal (Convenience Component)

```tsx
import { ConfirmationModal } from '@/components/SharedModal';

function DeleteConfirmation() {
    return (
        <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDelete}
            title="Delete Activity"
            message="Are you sure you want to delete this activity? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
            isLoading={isDeleting}
        />
    );
}
```

### SelectionModal (Convenience Component)

```tsx
import { SelectionModal } from '@/components/SharedModal';

function ModeSelection() {
    const modes = [
        {
            id: 'quiz',
            name: 'Quiz',
            description: 'For classroom use',
            icon: <Target size={22} />,
            action: () => startActivity('quiz')
        },
        {
            id: 'tournament',
            name: 'Tournament',
            description: 'Live or deferred competition',
            icon: <Users size={22} />,
            action: () => startActivity('tournament')
        }
    ];

    return (
        <SelectionModal
            isOpen={showModeSelection}
            onClose={() => setShowModeSelection(false)}
            title="Start Activity"
            description="Choose a game mode"
            options={modes}
            isLoading={isStarting}
        />
    );
}
```

## 🎨 Variants

### 1. `confirmation`
- **Use Case**: Delete confirmations, destructive actions
- **Styling**: Red/orange accent colors for danger/warning
- **Features**: Loading states, type-specific button styling

### 2. `selection`
- **Use Case**: Mode selection, option picking
- **Styling**: Primary color accents, option-focused layout
- **Features**: Multiple options with icons and descriptions

### 3. `info`
- **Use Case**: Displaying information, stats, details
- **Styling**: Neutral colors, readable layout
- **Features**: Flexible content, multiple sizes

### 4. `feedback`
- **Use Case**: Answer explanations, educational content
- **Styling**: Primary border, educational focus
- **Features**: Enhanced for learning context

## 📏 Sizes

- `sm`: max-width 384px (24rem)
- `md`: max-width 448px (28rem) - **Default**
- `lg`: max-width 512px (32rem)  
- `xl`: max-width 576px (36rem)

## ⚙️ Props

### SharedModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls modal visibility |
| `onClose` | `() => void` | - | Close handler |
| `variant` | `'confirmation' \| 'selection' \| 'info' \| 'feedback'` | `'info'` | Modal variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size |
| `title` | `string \| ReactNode` | - | Modal title (optional) |
| `showCloseButton` | `boolean` | `true` | Show X close button |
| `closeOnBackdrop` | `boolean` | `true` | Close on backdrop click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `isLoading` | `boolean` | `false` | Show loading state |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `ReactNode` | - | Modal content |

## 🎭 Features

### Accessibility
- **Focus Management**: Automatically focuses modal when opened
- **Keyboard Navigation**: Escape key closes modal
- **ARIA Attributes**: Proper dialog roles and labels
- **Screen Reader Support**: Descriptive content for assistive technology

### Animations
- **Entry**: Scale up from 90% with fade in
- **Exit**: Scale down to 90% with fade out
- **Backdrop**: Smooth fade in/out
- **Timing**: 200ms for smooth feel without delay

### Behavior
- **Body Scroll Lock**: Prevents background scrolling when modal is open
- **Event Bubbling**: Proper stop propagation to prevent unwanted closes
- **Loading Protection**: Disables interactions when loading
- **Multiple Modal Support**: Can stack modals if needed

## 🔄 Migration Guide

### From Custom Modal to SharedModal

**Before:**
```tsx
{showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={handleClose}>
        <div className="bg-white rounded-lg p-6 max-w-md mx-auto mt-20">
            <h2>My Modal</h2>
            <p>Content here</p>
            <button onClick={handleClose}>Close</button>
        </div>
    </div>
)}
```

**After:**
```tsx
<InfoModal
    isOpen={showModal}
    onClose={handleClose}
    title="My Modal"
    size="md"
>
    <p>Content here</p>
</InfoModal>
```

### From ConfirmationModal to SharedModal

**Before:**
```tsx
<ConfirmationModal
    isOpen={showConfirm}
    title="Delete Item"
    message="Are you sure?"
    onConfirm={handleDelete}
    onCancel={() => setShowConfirm(false)}
    type="danger"
/>
```

**After:** (Same interface, just import from SharedModal)
```tsx
import { ConfirmationModal } from '@/components/SharedModal';
// Usage remains the same
```

## 🎯 Best Practices

### 1. Choose the Right Variant
- Use `confirmation` for destructive actions
- Use `selection` for choosing between options
- Use `info` for displaying information
- Use `feedback` for educational content

### 2. Size Selection
- `sm`: Simple confirmations, alerts
- `md`: Standard forms, information
- `lg`: Complex forms, detailed content  
- `xl`: Rich content, multiple sections

### 3. Title Design
- Keep titles concise and descriptive
- Use ReactNode for icon + text combinations
- Consider context (e.g., "Delete Activity" vs "Delete")

### 4. Content Structure
- Use consistent spacing with `space-y-*` classes
- Align with existing design system colors
- Keep content scannable and focused

### 5. Loading States
- Always provide loading states for async operations
- Disable interactions during loading
- Use descriptive loading text

## 🚀 Future Enhancements

- **Step-based Modals**: Support for multi-step wizards
- **Custom Animations**: Variant-specific animation styles
- **Portal Support**: Render in different DOM locations
- **Auto-sizing**: Dynamic sizing based on content
- **Persistent Modals**: Modals that persist across navigation

## 🔗 Related Components

- **Snackbar**: For temporary notifications
- **Toast**: For success/error messages  
- **Popover**: For contextual information
- **Dropdown**: For selection lists
