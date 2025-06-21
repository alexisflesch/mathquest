# InfoModal Component Usage Guide

## Overview
`InfoModal` is a simple, consistent modal component for displaying information pop-ups across the MathQuest application.

## When to Use
- ✅ Practice session stats
- ✅ Access code displays  
- ✅ Simple information dialogs
- ✅ Success/completion messages
- ❌ Complex forms or selections (use existing specialized modals)
- ❌ Confirmation dialogs (use existing ConfirmationModal)

## Basic Usage

```tsx
import InfoModal from '@/components/SharedModal';

function MyComponent() {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button onClick={() => setShowModal(true)}>
                Show Info
            </button>

            <InfoModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Information"
                size="md"
            >
                <p>Your content goes here</p>
            </InfoModal>
        </>
    );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Whether the modal is visible |
| `onClose` | `() => void` | - | Function called when modal should close |
| `title` | `string \| React.ReactNode` | `undefined` | Modal title (can be text or JSX) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Modal width |
| `showCloseButton` | `boolean` | `true` | Show X button in header |
| `closeOnBackdrop` | `boolean` | `true` | Close when clicking backdrop |
| `closeOnEscape` | `boolean` | `true` | Close when pressing Escape |
| `className` | `string` | `''` | Additional CSS classes |
| `children` | `React.ReactNode` | - | Modal content |

## Examples

### Simple Stats Display
```tsx
<InfoModal
    isOpen={showStats}
    onClose={() => setShowStats(false)}
    title="Session Statistics"
    size="md"
>
    <div className="space-y-3">
        <div className="flex justify-between">
            <span>Questions:</span>
            <span className="font-semibold">10</span>
        </div>
        <div className="flex justify-between">
            <span>Correct:</span>
            <span className="font-semibold text-green-600">8</span>
        </div>
    </div>
</InfoModal>
```

### Access Code Display
```tsx
<InfoModal
    isOpen={showAccessCode}
    onClose={() => setShowAccessCode(false)}
    title="Activité créée !"
    size="md"
>
    <div className="space-y-4">
        {/* Access code display */}
        <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg p-4">
            <div className="text-sm mb-2 font-medium text-[color:var(--success)]">
                Code d'accès pour vos élèves :
            </div>
            <div className="flex items-center gap-2">
                <code className="bg-[color:var(--card)] px-3 py-2 rounded border text-lg font-mono font-bold text-[color:var(--success)] flex-1">
                    {accessCode}
                </code>
                <button
                    onClick={copyCode}
                    className="p-2 text-[color:var(--success)] hover:bg-[color:var(--muted)] rounded"
                    title="Copier le code"
                >
                    <Copy size={16} />
                </button>
                <button
                    onClick={shareCode}
                    className="p-2 text-[color:var(--success)] hover:bg-[color:var(--muted)] rounded"
                    title="Partager le code"
                >
                    <Share2 size={16} />
                </button>
            </div>
        </div>
        <p className="text-[color:var(--muted-foreground)] text-sm">
            Partagez ce code avec vos élèves pour qu'ils puissent rejoindre l'activité.
        </p>
    </div>
</InfoModal>
```

### Custom Title with Icon
```tsx
<InfoModal
    isOpen={showResults}
    onClose={() => setShowResults(false)}
    title={
        <div className="flex items-center gap-3">
            <BarChart3 size={24} />
            <span>Practice Results</span>
        </div>
    }
>
    <p>Great job on completing the practice session!</p>
</InfoModal>
```

## Features

### Consistent Behavior
- ✅ Escape key closes modal
- ✅ Clicking backdrop closes modal  
- ✅ Smooth animations
- ✅ Body scroll lock when open
- ✅ Dark theme compatible

### Responsive Design
- ✅ Works on mobile and desktop
- ✅ Proper padding and spacing
- ✅ Accessible focus management

### Consistent Styling
- ✅ Uses CSS custom properties for theming
- ✅ Consistent border radius and shadows
- ✅ Proper z-index layering

## Migration from Old Patterns

### From feedback-overlay pattern:
```tsx
// OLD ❌
{showModal && (
    <div className="feedback-overlay" onClick={closeModal}>
        <div className="feedback-overlay-inner">
            <div className="feedback-card">
                {/* content */}
            </div>
        </div>
    </div>
)}

// NEW ✅  
<InfoModal isOpen={showModal} onClose={closeModal} title="Title">
    {/* content */}
</InfoModal>
```

### From custom modal implementations:
```tsx
// OLD ❌
{showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        <div className="modal-content">
            {/* content */}
        </div>
    </div>
)}

// NEW ✅
<InfoModal isOpen={showModal} onClose={closeModal}>
    {/* content */}
</InfoModal>
```

## Best Practices

1. **Use for simple information only** - Don't replace complex workflows
2. **Keep content concise** - Modal should be scannable quickly  
3. **Provide clear close actions** - Always allow easy dismissal
4. **Use semantic titles** - Help users understand the content purpose
5. **Consider mobile users** - Test on small screens

## Styling Notes

The modal automatically adapts to your app's theme using CSS custom properties:
- `--card` - Background color
- `--foreground` - Text color  
- `--border` - Border color
- `--muted-foreground` - Secondary text color

No additional styling should be needed in most cases.
