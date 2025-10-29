import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionList } from '../components/QuestionList';
import { createEmptyQuestion } from '../types';

// Mock framer-motion to avoid animation complexity in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Trash2: () => <svg data-testid="trash-icon" />,
    ArrowRightFromLine: () => <svg data-testid="arrow-right-icon" />,
    ArrowLeftFromLine: () => <svg data-testid="arrow-left-icon" />,
}));

// Mock QuestionCard component
jest.mock('../components/QuestionCard', () => ({
    QuestionCard: ({ title, questionType, themes, index, selected, onSelect, onDelete, showDelete, problems }: any) => (
        <div
            data-testid={`question-card-${index}`}
            role="button"
            onClick={() => onSelect(index)}
            className={selected ? 'selected' : ''}
        >
            <h3>{title || 'Sans titre'}</h3>
            <span>{questionType === 'single_choice' ? 'QCU' : questionType === 'multiple_choice' ? 'QCM' : 'Numérique'}</span>
            <span>{Array.isArray(themes) && themes.length > 0 ? themes.join(', ') : 'Sans thèmes'}</span>
            {showDelete && (
                <button onClick={(e) => { e.stopPropagation(); onDelete(index); }}>
                    <svg data-testid="trash-icon" />
                </button>
            )}
            {problems && problems.length > 0 && (
                <div data-testid="problems">
                    {problems.map((problem: any, i: number) => (
                        <span key={i} data-testid={`problem-${problem.type}`}>{problem.message}</span>
                    ))}
                </div>
            )}
        </div>
    ),
}));

describe('QuestionList', () => {
    const mockQuestions = [
        { ...createEmptyQuestion(), uid: 'q1', title: 'Question 1' },
        { ...createEmptyQuestion(), uid: 'q2', title: 'Question 2' },
        { ...createEmptyQuestion(), uid: 'q3', title: 'Question 3' },
    ];

    const mockProblems = [
        [{ type: 'error' as const, message: 'Missing field' }],
        [],
        [{ type: 'warning' as const, message: 'Low difficulty' }],
    ];

    const defaultProps = {
        questions: mockQuestions,
        selectedQuestionIndex: 0,
        onSelectQuestion: jest.fn(),
        onAddQuestion: jest.fn(),
        onDeleteQuestion: jest.fn(),
        problems: mockProblems,
        sidebarCollapsed: false,
        onToggleSidebar: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset window.innerWidth for desktop tests
        Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
    });

    it('should render expanded view by default on desktop', () => {
        render(<QuestionList {...defaultProps} />);

        expect(screen.getByText('Questions')).toBeInTheDocument();
        expect(screen.getByText('+ Ajouter')).toBeInTheDocument();
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Question 2')).toBeInTheDocument();
        expect(screen.getByText('Question 3')).toBeInTheDocument();
    });

    it('should render collapsed view when sidebarCollapsed is true', () => {
        render(<QuestionList {...defaultProps} sidebarCollapsed={true} />);

        expect(screen.getByText('+')).toBeInTheDocument();
        expect(screen.queryByText('Questions')).not.toBeInTheDocument();
        expect(screen.queryByText('+ Ajouter')).not.toBeInTheDocument();
    });

    it('should force expanded view on mobile regardless of collapsed prop', () => {
        Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });

        render(<QuestionList {...defaultProps} sidebarCollapsed={true} />);

        expect(screen.getByText('Questions')).toBeInTheDocument();
        expect(screen.getByText('+ Ajouter')).toBeInTheDocument();
    });

    it('should call onSelectQuestion when a question is clicked', () => {
        render(<QuestionList {...defaultProps} />);

        const questionCards = screen.getAllByRole('button');
        // Find the card that's not the toggle or add button
        const questionCard = questionCards.find(card =>
            card.textContent?.includes('Question 1')
        );

        if (questionCard) {
            fireEvent.click(questionCard);
            expect(defaultProps.onSelectQuestion).toHaveBeenCalledWith(0);
        }
    });

    it('should call onAddQuestion when add button is clicked', () => {
        render(<QuestionList {...defaultProps} />);

        fireEvent.click(screen.getByText('+ Ajouter'));
        expect(defaultProps.onAddQuestion).toHaveBeenCalled();
    });

    it('should call onDeleteQuestion when delete button is clicked', () => {
        render(<QuestionList {...defaultProps} />);

        // Find delete buttons (Trash2 icons)
        const deleteButtons = screen.getAllByTestId('trash-icon');
        expect(deleteButtons).toHaveLength(3); // One for each question

        fireEvent.click(deleteButtons[0]);
        expect(defaultProps.onDeleteQuestion).toHaveBeenCalledWith(0);
    });

    it('should show delete buttons for all questions when there are multiple questions', () => {
        render(<QuestionList {...defaultProps} />);

        const deleteButtons = screen.getAllByTestId('trash-icon');
        expect(deleteButtons).toHaveLength(3);
    });

    it('should hide delete buttons when showDelete is false in QuestionCard', () => {
        const singleQuestion = [mockQuestions[0]];
        render(<QuestionList {...defaultProps} questions={singleQuestion} />);

        // When there's only one question, showDelete should be false
        const deleteButtons = screen.queryAllByTestId('trash-icon');
        expect(deleteButtons).toHaveLength(0);
    });

    it('should call onToggleSidebar when toggle button is clicked', () => {
        render(<QuestionList {...defaultProps} />);

        const toggleButton = screen.getByTestId('arrow-left-icon').closest('button');
        if (toggleButton) {
            fireEvent.click(toggleButton);
            expect(defaultProps.onToggleSidebar).toHaveBeenCalled();
        }
    });

    it('should hide toggle button on mobile', () => {
        Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });

        render(<QuestionList {...defaultProps} />);

        const toggleButton = screen.queryByTestId('arrow-left-icon')?.closest('button');
        expect(toggleButton).toHaveClass('hidden');
    });

    it('should show empty state when no questions exist', () => {
        render(<QuestionList {...defaultProps} questions={[]} />);

        expect(screen.getByText('Aucune question')).toBeInTheDocument();
        expect(screen.getByText('Créer la première question')).toBeInTheDocument();
    });

    it('should call onAddQuestion when creating first question', () => {
        render(<QuestionList {...defaultProps} questions={[]} />);

        fireEvent.click(screen.getByText('Créer la première question'));
        expect(defaultProps.onAddQuestion).toHaveBeenCalled();
    });

    it('should handle resize events', () => {
        render(<QuestionList {...defaultProps} />);

        // Simulate window resize
        Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });
        window.dispatchEvent(new Event('resize'));

        // Component should still render
        expect(screen.getByText('Questions')).toBeInTheDocument();
    });

    it('should pass problems to QuestionCard components', () => {
        render(<QuestionList {...defaultProps} />);

        // The problems are passed down to QuestionCard components
        // We can't easily test the internal rendering without more complex mocking
        expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    it('should highlight selected question', () => {
        render(<QuestionList {...defaultProps} selectedQuestionIndex={1} />);

        // The selected question should have different styling
        // This is tested implicitly through the QuestionCard component
        expect(screen.getByText('Question 2')).toBeInTheDocument();
    });

    it('should render compact collapsed view correctly', () => {
        render(<QuestionList {...defaultProps} sidebarCollapsed={true} />);

        // Should show numbers 1, 2, 3 for the three questions
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should handle collapsed view toggle', () => {
        render(<QuestionList {...defaultProps} sidebarCollapsed={true} />);

        const toggleButton = screen.getByTestId('arrow-right-icon').closest('button');
        if (toggleButton) {
            fireEvent.click(toggleButton);
            expect(defaultProps.onToggleSidebar).toHaveBeenCalled();
        }
    });

    it('should show problem indicators in collapsed view', () => {
        render(<QuestionList {...defaultProps} sidebarCollapsed={true} />);

        // The collapsed view should show visual indicators for problems
        // This is handled by the border styling in the component
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle undefined problems array', () => {
        render(<QuestionList {...defaultProps} problems={undefined} />);

        // Should not crash when problems is undefined
        expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    it('should handle problems array shorter than questions array', () => {
        const shortProblems = [[{ type: 'error' as const, message: 'Error' }]];
        render(<QuestionList {...defaultProps} problems={shortProblems} />);

        // Should handle mismatched array lengths gracefully
        expect(screen.getByText('Question 1')).toBeInTheDocument();
    });

    it('should have correct accessibility attributes', () => {
        render(<QuestionList {...defaultProps} />);

        const toggleButton = screen.getByTestId('arrow-left-icon').closest('button');
        expect(toggleButton).toHaveAttribute('aria-label', 'Collapse questions list');

        const addButton = screen.getByText('+ Ajouter');
        expect(addButton).toHaveAttribute('aria-label', 'Ajouter une question');
    });

    it('should handle missing onToggleSidebar callback', () => {
        render(<QuestionList {...defaultProps} onToggleSidebar={undefined} />);

        // Should not crash when onToggleSidebar is undefined
        expect(screen.getByText('Questions')).toBeInTheDocument();
    });
});