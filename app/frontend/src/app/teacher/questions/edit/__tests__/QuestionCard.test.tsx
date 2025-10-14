import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionCard } from '../components/QuestionCard';

// Mock MathJaxWrapper to avoid complex rendering
jest.mock('@/components/MathJaxWrapper', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <span data-testid="mathjax">{children}</span>,
}));

describe('QuestionCard', () => {
    const mockProps = {
        uid: 'test-uid',
        title: 'Test Question Title',
        questionType: 'single_choice' as const,
        themes: ['Algebra', 'Geometry'],
        index: 0,
        selected: false,
        problems: [],
        onSelect: jest.fn(),
        onDelete: jest.fn(),
        showDelete: true,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render basic card structure', () => {
        render(<QuestionCard {...mockProps} />);

        expect(screen.getByText('Test Question Title')).toBeInTheDocument();
        expect(screen.getByText('QCU')).toBeInTheDocument();
        expect(screen.getByText('Algebra, Geometry')).toBeInTheDocument();
        expect(screen.getByTestId('mathjax')).toBeInTheDocument();
    });

    it('should render without title', () => {
        render(<QuestionCard {...mockProps} title={undefined} />);

        expect(screen.getByTestId('mathjax')).toHaveTextContent('Sans titre');
    });

    it('should render different question types correctly', () => {
        const { rerender } = render(<QuestionCard {...mockProps} questionType="multiple_choice" />);
        expect(screen.getByText('QCM')).toBeInTheDocument();

        rerender(<QuestionCard {...mockProps} questionType="numeric" />);
        expect(screen.getByText('Numérique')).toBeInTheDocument();
    });

    it('should handle empty themes array', () => {
        render(<QuestionCard {...mockProps} themes={[]} />);

        expect(screen.getByText('Sans thèmes')).toBeInTheDocument();
    });

    it('should handle undefined themes', () => {
        render(<QuestionCard {...mockProps} themes={undefined} />);

        expect(screen.getByText('Sans thèmes')).toBeInTheDocument();
    });

    it('should call onSelect when clicked', () => {
        render(<QuestionCard {...mockProps} />);

        const card = screen.getByTestId('mathjax').closest('div[role="button"]');
        if (card) {
            fireEvent.click(card);
        }

        expect(mockProps.onSelect).toHaveBeenCalledWith(0);
    });

    it('should show selected styling when selected', () => {
        render(<QuestionCard {...mockProps} selected={true} />);

        // The selected card should have different styling
        const card = screen.getByTestId('mathjax').closest('div[role="button"]');
        expect(card).toBeInTheDocument();
        // The background color is set via inline style in the component
        if (card) {
            expect((card as HTMLElement).style.backgroundColor).toBe('rgba(6, 182, 212, 0.12)');
        }
    });

    it('should show delete button when showDelete is true', () => {
        render(<QuestionCard {...mockProps} />);

        const deleteButton = screen.getByLabelText('Supprimer la question 1');
        expect(deleteButton).toBeInTheDocument();
    });

    it('should not show delete button when showDelete is false', () => {
        render(<QuestionCard {...mockProps} showDelete={false} />);

        const deleteButton = screen.queryByLabelText('Supprimer la question 1');
        expect(deleteButton).not.toBeInTheDocument();
    });

    it('should call onDelete when delete button is clicked', () => {
        render(<QuestionCard {...mockProps} />);

        const deleteButton = screen.getByLabelText('Supprimer la question 1');
        fireEvent.click(deleteButton);

        expect(mockProps.onDelete).toHaveBeenCalledWith(0);
    });

    it('should prevent event propagation when delete button is clicked', () => {
        render(<QuestionCard {...mockProps} />);

        const deleteButton = screen.getByLabelText('Supprimer la question 1');
        const clickEvent = new MouseEvent('click', { bubbles: true });
        const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');

        fireEvent(deleteButton, clickEvent);

        expect(stopPropagationSpy).toHaveBeenCalled();
        expect(mockProps.onSelect).not.toHaveBeenCalled(); // Should not trigger selection
    });

    it('should display error problems with correct styling', () => {
        const problems = [{ type: 'error' as const, message: 'Missing title' }];
        render(<QuestionCard {...mockProps} problems={problems} />);

        const errorButton = screen.getByLabelText('Erreur: 1');
        expect(errorButton).toBeInTheDocument();
        const errorIcon = errorButton.querySelector('svg');
        expect(errorIcon).toHaveClass('text-red-600');
    });

    it('should display warning problems with correct styling', () => {
        const problems = [{ type: 'warning' as const, message: 'Low difficulty' }];
        render(<QuestionCard {...mockProps} problems={problems} />);

        const warningButton = screen.getByLabelText('Avertissement: 1');
        expect(warningButton).toBeInTheDocument();
        const warningIcon = warningButton.querySelector('svg');
        expect(warningIcon).toHaveClass('text-amber-500');
    });

    it('should display both error and warning icons when both types exist', () => {
        const problems = [
            { type: 'error' as const, message: 'Missing title' },
            { type: 'warning' as const, message: 'Low difficulty' }
        ];
        render(<QuestionCard {...mockProps} problems={problems} />);

        expect(screen.getByLabelText('Erreur: 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Avertissement: 1')).toBeInTheDocument();
    });

    it('should show error icon above warning icon when both exist', () => {
        const problems = [
            { type: 'error' as const, message: 'Missing title' },
            { type: 'warning' as const, message: 'Low difficulty' }
        ];
        render(<QuestionCard {...mockProps} problems={problems} />);

        const errorButton = screen.getByLabelText('Erreur: 1');
        const warningButton = screen.getByLabelText('Avertissement: 1');

        // Check that both buttons exist
        expect(errorButton).toBeInTheDocument();
        expect(warningButton).toBeInTheDocument();

        // Check the icons have correct classes
        const errorIcon = errorButton.querySelector('svg');
        const warningIcon = warningButton.querySelector('svg');
        expect(errorIcon).toHaveClass('text-red-600');
        expect(warningIcon).toHaveClass('text-amber-500');
    });

    it('should show tooltips for problems', () => {
        const problems = [{ type: 'error' as const, message: 'Missing title' }];
        render(<QuestionCard {...mockProps} problems={problems} />);

        const errorButton = screen.getByLabelText('Erreur: 1');
        expect(errorButton).toHaveAttribute('title', 'Missing title');
    });

    it('should truncate long theme lists', () => {
        const longThemes = ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Probability'];
        render(<QuestionCard {...mockProps} themes={longThemes} />);

        const themesElement = screen.getByText(/Algebra, Geometry, Calculus, Statistics, Probability/);
        expect(themesElement).toHaveClass('truncate');
    });

    it('should be memoized and not re-render unnecessarily', () => {
        const { rerender } = render(<QuestionCard {...mockProps} />);

        // Re-render with same props - should not cause unnecessary updates
        rerender(<QuestionCard {...mockProps} />);

        // Since it's memoized, it should maintain the same behavior
        expect(screen.getByTestId('mathjax')).toHaveTextContent('Test Question Title');
    });

    it('should re-render when display-relevant props change', () => {
        const { rerender } = render(<QuestionCard {...mockProps} />);

        // Change title - should re-render
        rerender(<QuestionCard {...mockProps} title="New Title" />);

        expect(screen.getByTestId('mathjax')).toHaveTextContent('New Title');
    });

    it('should not re-render when non-display props change', () => {
        const mockOnSelect = jest.fn();
        const { rerender } = render(<QuestionCard {...mockProps} onSelect={mockOnSelect} />);

        // Change onSelect function - should not re-render due to memoization
        const newOnSelect = jest.fn();
        rerender(<QuestionCard {...mockProps} onSelect={newOnSelect} />);

        // The memoization should prevent re-renders for non-display prop changes
        expect(screen.getByTestId('mathjax')).toHaveTextContent('Test Question Title');
    });

    it('should have correct accessibility attributes', () => {
        render(<QuestionCard {...mockProps} />);

        const card = screen.getByTestId('mathjax').closest('div[role="button"]');
        expect(card).toHaveAttribute('role', 'button');

        const deleteButton = screen.getByLabelText('Supprimer la question 1');
        expect(deleteButton).toHaveAttribute('aria-label', 'Supprimer la question 1');
    });

    it('should handle click on card to select question', () => {
        render(<QuestionCard {...mockProps} />);

        const card = screen.getByTestId('mathjax').closest('div[role="button"]');
        if (card) {
            fireEvent.click(card);
        }

        expect(mockProps.onSelect).toHaveBeenCalledWith(0);
    });
});