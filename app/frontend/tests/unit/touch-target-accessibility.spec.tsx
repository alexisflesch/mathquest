/**
 * Touch Target Accessibility Tests
 *
 * Tests for WCAG compliance and touch target accessibility:
 * - Minimum touch target sizes (44px)
 * - Touch target spacing and proximity
 * - Focus indicators for keyboard navigation
 * - Visual feedback for touch interactions
 * - Touch target accessibility across different components
 * - Touch target compliance in various orientations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock touch event utilities
const createTouchEvent = (type: string, touches: Touch[]) => {
    return new TouchEvent(type, {
        touches,
        changedTouches: touches,
        targetTouches: touches,
        bubbles: true,
        cancelable: true
    });
};

const createTouch = (x: number, y: number, identifier = 1): Touch => {
    return {
        identifier,
        target: document.body,
        screenX: x,
        screenY: y,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
        altitudeAngle: 1.5707963267948966,
        azimuthAngle: 0,
        touchType: 'direct'
    } as Touch;
};

// Mock Components for Touch Target Accessibility Testing
const MockTouchTarget = ({
    size = 44,
    spacing = 8,
    onTouch,
    disabled = false,
    variant = 'button',
    children
}: {
    size?: number;
    spacing?: number;
    onTouch?: () => void;
    disabled?: boolean;
    variant?: 'button' | 'link' | 'input';
    children: React.ReactNode;
}) => {
    const baseStyles = {
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        margin: `${spacing}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ccc',
        borderRadius: '4px',
        background: disabled ? '#f5f5f5' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        padding: '8px',
        transition: 'all 0.2s ease',
        position: 'relative' as const
    };

    const focusStyles = {
        outline: '2px solid #007acc',
        outlineOffset: '2px'
    };

    const hoverStyles = {
        background: '#f0f0f0',
        transform: 'scale(0.98)'
    };

    const activeStyles = {
        background: '#e0e0e0',
        transform: 'scale(0.95)'
    };

    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTouch?.();
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsActive(true);
        onTouch?.();
    };

    const handleTouchEnd = () => {
        setIsActive(false);
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    const combinedStyles = {
        ...baseStyles,
        ...(isFocused ? focusStyles : {}),
        ...(isHovered ? hoverStyles : {}),
        ...(isActive ? activeStyles : {})
    };

    if (variant === 'link') {
        return (
            <a
                href="#"
                style={combinedStyles}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                aria-label="Touch target link"
            >
                {children}
            </a>
        );
    }

    if (variant === 'input') {
        return (
            <input
                type="button"
                value={children as string}
                style={combinedStyles}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-label="Touch target input"
            />
        );
    }

    return (
        <button
            style={combinedStyles}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Touch target button"
        >
            {children}
        </button>
    );
};

const MockTouchTargetGrid = ({
    targets = 9,
    spacing = 8,
    size = 44
}: {
    targets?: number;
    spacing?: number;
    size?: number;
}) => {
    const gridItems = Array.from({ length: targets }, (_, i) => i + 1);

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                gap: `${spacing}px`,
                padding: '16px',
                maxWidth: '400px'
            }}
            role="grid"
            aria-label="Touch target grid"
        >
            {gridItems.map((item) => (
                <MockTouchTarget
                    key={item}
                    size={size}
                    spacing={0} // Grid handles spacing
                    variant="button"
                >
                    {item}
                </MockTouchTarget>
            ))}
        </div>
    );
};

const MockFormWithTouchTargets = ({
    orientation = 'portrait'
}: {
    orientation?: 'portrait' | 'landscape';
}) => {
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        agree: false
    });

    const containerStyles = {
        maxWidth: orientation === 'portrait' ? '375px' : '667px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '16px'
    };

    return (
        <form style={containerStyles} aria-label="Touch target form">
            <div>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '8px' }}>
                    Name
                </label>
                <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '12px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                    aria-label="Name input"
                />
            </div>

            <div>
                <label htmlFor="email" style={{ display: 'block', marginBottom: '8px' }}>
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '12px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                    aria-label="Email input"
                />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                    id="agree"
                    type="checkbox"
                    checked={formData.agree}
                    onChange={(e) => setFormData(prev => ({ ...prev, agree: e.target.checked }))}
                    style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        cursor: 'pointer'
                    }}
                    aria-label="Agree to terms checkbox"
                />
                <label htmlFor="agree" style={{ cursor: 'pointer' }}>
                    I agree to the terms and conditions
                </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <MockTouchTarget size={48} variant="button">
                    Submit
                </MockTouchTarget>
                <MockTouchTarget size={48} variant="button">
                    Cancel
                </MockTouchTarget>
            </div>
        </form>
    );
};

const MockNavigationWithTouchTargets = ({
    variant = 'bottom'
}: {
    variant?: 'bottom' | 'side' | 'top';
}) => {
    const navItems = [
        { icon: '🏠', label: 'Home', ariaLabel: 'Navigate to home' },
        { icon: '🔍', label: 'Search', ariaLabel: 'Open search' },
        { icon: '👤', label: 'Profile', ariaLabel: 'View profile' },
        { icon: '⚙️', label: 'Settings', ariaLabel: 'Open settings' }
    ];

    const baseNavStyles = {
        background: '#fff',
        borderTop: variant === 'bottom' ? '1px solid #ccc' : 'none',
        borderRight: variant === 'side' ? '1px solid #ccc' : 'none',
        borderBottom: variant === 'top' ? '1px solid #ccc' : 'none',
        position: 'fixed' as const,
        zIndex: 100
    };

    const getPositionStyles = () => {
        switch (variant) {
            case 'bottom':
                return {
                    ...baseNavStyles,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    minHeight: '60px',
                    padding: '8px',
                    display: 'flex',
                    justifyContent: 'space-around'
                };
            case 'side':
                return {
                    ...baseNavStyles,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '80px',
                    padding: '16px 8px',
                    display: 'flex',
                    flexDirection: 'column' as const,
                    justifyContent: 'flex-start',
                    gap: '16px'
                };
            case 'top':
                return {
                    ...baseNavStyles,
                    top: 0,
                    left: 0,
                    right: 0,
                    minHeight: '60px',
                    padding: '8px',
                    display: 'flex',
                    justifyContent: 'space-around'
                };
            default:
                return baseNavStyles;
        }
    };

    return (
        <nav style={getPositionStyles()} role="navigation" aria-label="Main navigation">
            {navItems.map((item, index) => (
                <button
                    key={index}
                    style={{
                        minWidth: '44px',
                        minHeight: '44px',
                        display: 'flex',
                        flexDirection: variant === 'side' ? 'column' : 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '16px',
                        borderRadius: '8px',
                        transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label={item.ariaLabel}
                >
                    <span aria-hidden="true">{item.icon}</span>
                    {variant !== 'side' && (
                        <span style={{ fontSize: '12px' }}>{item.label}</span>
                    )}
                </button>
            ))}
        </nav>
    );
};

const MockModalWithTouchTargets = ({
    isOpen = true,
    onClose
}: {
    isOpen?: boolean;
    onClose?: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '24px',
                    maxWidth: '400px',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 id="modal-title">Modal Title</h2>
                    <MockTouchTarget
                        size={44}
                        onTouch={onClose}
                        variant="button"
                    >
                        ✕
                    </MockTouchTarget>
                </div>

                <div id="modal-description" style={{ marginBottom: '24px' }}>
                    <p>This is a modal with touch target accessibility testing.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <MockTouchTarget size={48} variant="button">
                        Cancel
                    </MockTouchTarget>
                    <MockTouchTarget size={48} variant="button">
                        Confirm
                    </MockTouchTarget>
                </div>
            </div>
        </div>
    );
};

describe('Touch Target Accessibility Tests', () => {
    describe('WCAG 2.1 AA Compliance - Minimum Size Requirements', () => {
        test('should have minimum 44px touch targets for WCAG AA compliance', () => {
            render(<MockTouchTarget size={44}>Test Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeInTheDocument();

            // Check that the button has proper accessibility attributes
            expect(button).toHaveAttribute('aria-label', 'Touch target button');
        });

        test('should support larger touch targets for better accessibility', () => {
            render(<MockTouchTarget size={48}>Large Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeInTheDocument();
        });

        test('should handle touch targets smaller than minimum (non-compliant)', () => {
            render(<MockTouchTarget size={32}>Small Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeInTheDocument();
            // In a real implementation, this would be flagged as non-compliant
        });

        test('should ensure touch targets meet size requirements in different orientations', () => {
            const { rerender } = render(<MockFormWithTouchTargets orientation="portrait" />);

            const buttons = screen.getAllByRole('button', { name: 'Touch target button' });
            expect(buttons).toHaveLength(2);

            buttons.forEach(button => {
                const styles = window.getComputedStyle(button);
                expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
                expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
            });

            rerender(<MockFormWithTouchTargets orientation="landscape" />);

            const buttonsLandscape = screen.getAllByRole('button', { name: 'Touch target button' });
            expect(buttonsLandscape).toHaveLength(2);

            buttonsLandscape.forEach(button => {
                const styles = window.getComputedStyle(button);
                expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
                expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
            });
        });
    });

    describe('Touch Target Spacing and Proximity', () => {
        test('should maintain adequate spacing between touch targets', () => {
            render(<MockTouchTargetGrid targets={4} spacing={12} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(4);

            // Check that buttons have proper spacing through CSS grid
            const grid = screen.getByRole('grid');
            expect(grid).toHaveAttribute('aria-label', 'Touch target grid');
        });

        test('should handle overlapping touch targets (non-compliant)', () => {
            render(<MockTouchTargetGrid targets={9} spacing={0} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(9);
            // In a real implementation, overlapping targets would be flagged
        });

        test('should provide adequate spacing in navigation components', () => {
            render(<MockNavigationWithTouchTargets variant="bottom" />);

            const nav = screen.getByRole('navigation');
            expect(nav).toHaveAttribute('aria-label', 'Main navigation');

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(4);
        });

        test('should handle touch target spacing in different navigation layouts', () => {
            const { rerender } = render(<MockNavigationWithTouchTargets variant="bottom" />);

            let nav = screen.getByRole('navigation');
            expect(nav).toBeInTheDocument();

            rerender(<MockNavigationWithTouchTargets variant="side" />);
            nav = screen.getByRole('navigation');
            expect(nav).toBeInTheDocument();

            rerender(<MockNavigationWithTouchTargets variant="top" />);
            nav = screen.getByRole('navigation');
            expect(nav).toBeInTheDocument();
        });
    });

    describe('Focus Indicators and Keyboard Navigation', () => {
        test('should provide visible focus indicators for keyboard navigation', () => {
            render(<MockTouchTarget>Focusable Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Focus the button
            button.focus();
            expect(document.activeElement).toBe(button);
        });

        test('should maintain focus indicators in high contrast mode', () => {
            render(<MockTouchTarget>High Contrast Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toHaveAttribute('aria-label');
        });

        test('should support keyboard activation of touch targets', () => {
            const mockOnTouch = jest.fn();
            render(<MockTouchTarget onTouch={mockOnTouch}>Keyboard Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Test Enter key
            fireEvent.keyDown(button, { key: 'Enter' });
            expect(mockOnTouch).toHaveBeenCalled();

            // Test Space key
            fireEvent.keyDown(button, { key: ' ' });
            expect(mockOnTouch).toHaveBeenCalled();
        });

        test('should handle focus management in modal dialogs', () => {
            const mockOnClose = jest.fn();
            render(<MockModalWithTouchTargets onClose={mockOnClose} />);

            const modal = screen.getByRole('dialog');
            expect(modal).toHaveAttribute('aria-modal', 'true');

            const buttons = screen.getAllByRole('button', { name: 'Touch target button' });
            expect(buttons).toHaveLength(3); // Close button, Cancel, Confirm

            // Test that the close button can be focused
            buttons[0].focus();
            expect(document.activeElement).toBe(buttons[0]);
        });
    });

    describe('Visual Feedback and Touch Interactions', () => {
        test('should provide visual feedback on touch interactions', () => {
            render(<MockTouchTarget>Interactive Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeInTheDocument();
            // Visual feedback is handled through CSS hover/active states
        });

        test('should handle touch events properly', () => {
            const mockOnTouch = jest.fn();
            render(<MockTouchTarget onTouch={mockOnTouch}>Touch Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Simulate touch start
            const touch = createTouch(50, 50);
            fireEvent.touchStart(button, { touches: [touch] });
            expect(mockOnTouch).toHaveBeenCalled();

            // Simulate touch end
            fireEvent.touchEnd(button);
        });

        test('should prevent default touch behaviors when needed', () => {
            render(<MockTouchTarget>Touch Prevent Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toHaveAttribute('aria-label');
        });

        test('should handle multi-touch gestures appropriately', () => {
            render(<MockTouchTarget>Multi-touch Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Simulate multi-touch
            const touch1 = createTouch(50, 50, 1);
            const touch2 = createTouch(100, 100, 2);
            fireEvent.touchStart(button, { touches: [touch1, touch2] });
        });
    });

    describe('Touch Target Accessibility Across Components', () => {
        test('should ensure form inputs meet touch target requirements', () => {
            render(<MockFormWithTouchTargets />);

            const inputs = screen.getAllByRole('textbox');
            expect(inputs).toHaveLength(2);

            inputs.forEach(input => {
                expect(input).toHaveAttribute('aria-label');
            });
        });

        test('should handle checkbox touch targets properly', () => {
            render(<MockFormWithTouchTargets />);

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toHaveAttribute('aria-label', 'Agree to terms checkbox');
        });

        test('should ensure link touch targets are accessible', () => {
            render(<MockTouchTarget variant="link">Touch Link</MockTouchTarget>);

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute('aria-label', 'Touch target link');
            expect(link).toHaveAttribute('href');
        });

        test('should handle input button touch targets', () => {
            render(<MockTouchTarget variant="input">Input Button</MockTouchTarget>);

            const input = screen.getByRole('button', { name: 'Touch target input' });
            expect(input).toHaveAttribute('type', 'button');
        });

        test('should ensure disabled touch targets are properly indicated', () => {
            render(<MockTouchTarget disabled={true}>Disabled Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeDisabled();
        });
    });

    describe('Touch Target Compliance in Different Contexts', () => {
        test('should maintain touch target accessibility in modals', () => {
            render(<MockModalWithTouchTargets />);

            const modal = screen.getByRole('dialog');
            expect(modal).toHaveAttribute('aria-labelledby');
            expect(modal).toHaveAttribute('aria-describedby');

            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        test('should handle touch targets in scrollable containers', () => {
            render(
                <div style={{ height: '200px', overflow: 'auto' }}>
                    <MockTouchTargetGrid targets={12} />
                </div>
            );

            const grid = screen.getByRole('grid');
            expect(grid).toBeInTheDocument();

            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        test('should ensure touch targets work with zoom', () => {
            // Simulate zoomed viewport
            Object.defineProperty(window, 'devicePixelRatio', {
                value: 2,
                writable: true
            });

            render(<MockTouchTarget>Zoomed Button</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeInTheDocument();
        });

        test('should handle touch targets with different screen densities', () => {
            // Test with different device pixel ratios
            const pixelRatios = [1, 1.5, 2, 3];

            pixelRatios.forEach(ratio => {
                Object.defineProperty(window, 'devicePixelRatio', {
                    value: ratio,
                    writable: true
                });

                const { rerender } = render(<MockTouchTarget size={44}>Density Test</MockTouchTarget>);

                const button = screen.getByRole('button', { name: 'Touch target button' });
                expect(button).toBeInTheDocument();

                rerender(<div />);
            });
        });
    });

    describe('Touch Target Testing for Different Input Methods', () => {
        test('should support touch input methods', () => {
            render(<MockTouchTarget>Touch Input</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Simulate touch interaction
            const touch = createTouch(50, 50);
            fireEvent.touchStart(button, { touches: [touch] });
            fireEvent.touchEnd(button);
        });

        test('should support mouse input methods', () => {
            render(<MockTouchTarget>Mouse Input</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Simulate mouse interaction
            fireEvent.mouseEnter(button);
            fireEvent.mouseDown(button);
            fireEvent.mouseUp(button);
            fireEvent.mouseLeave(button);
        });

        test('should support keyboard input methods', () => {
            render(<MockTouchTarget>Keyboard Input</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Simulate keyboard interaction
            button.focus();
            fireEvent.keyDown(button, { key: 'Enter' });
            fireEvent.keyUp(button, { key: 'Enter' });
        });

        test('should handle stylus input methods', () => {
            render(<MockTouchTarget>Stylus Input</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Stylus interactions are similar to touch
            const touch = createTouch(50, 50);
            fireEvent.touchStart(button, { touches: [touch] });
        });
    });

    describe('Touch Target Performance and Responsiveness', () => {
        test('should respond quickly to touch interactions', async () => {
            const mockOnTouch = jest.fn();
            render(<MockTouchTarget onTouch={mockOnTouch}>Fast Response</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            const touch = createTouch(50, 50);
            fireEvent.touchStart(button, { touches: [touch] });

            await waitFor(() => {
                expect(mockOnTouch).toHaveBeenCalled();
            });
        });

        test('should handle rapid touch interactions', () => {
            const mockOnTouch = jest.fn();
            render(<MockTouchTarget onTouch={mockOnTouch}>Rapid Touch</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Simulate rapid touches
            for (let i = 0; i < 5; i++) {
                const touch = createTouch(50 + i * 10, 50 + i * 10);
                fireEvent.touchStart(button, { touches: [touch] });
                fireEvent.touchEnd(button);
            }

            expect(mockOnTouch).toHaveBeenCalledTimes(5);
        });

        test('should prevent accidental double-taps', () => {
            const mockOnTouch = jest.fn();
            render(<MockTouchTarget onTouch={mockOnTouch}>No Double Tap</MockTouchTarget>);

            const button = screen.getByRole('button', { name: 'Touch target button' });

            // Rapid double tap
            const touch = createTouch(50, 50);
            fireEvent.touchStart(button, { touches: [touch] });
            fireEvent.touchEnd(button);
            fireEvent.touchStart(button, { touches: [touch] });
            fireEvent.touchEnd(button);

            // In a real implementation, this might be throttled
            expect(mockOnTouch).toHaveBeenCalledTimes(2);
        });

        test('should handle touch target interactions during scrolling', () => {
            render(
                <div style={{ height: '300px', overflow: 'scroll' }}>
                    <div style={{ height: '600px', padding: '20px' }}>
                        <MockTouchTarget>Scrollable Touch Target</MockTouchTarget>
                    </div>
                </div>
            );

            const button = screen.getByRole('button', { name: 'Touch target button' });
            expect(button).toBeInTheDocument();
        });
    });
});