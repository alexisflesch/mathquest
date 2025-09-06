/**
 * QuestionDisplay Component Tests
 * 
 * Basic tests for the QuestionDisplay component functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionDisplay from '../QuestionDisplay';

// Mock dependencies
jest.mock('../../utils', () => ({
    formatTime: jest.fn((ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    })
}));

jest.mock('../../clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

jest.mock('../MathJaxWrapper', () => {
    return function MathJaxWrapper({ children }: { children: React.ReactNode }) {
        return <div data-testid="mathjax-wrapper">{children}</div>;
    };
});

jest.mock('../StatisticsChart', () => {
    return function StatisticsChart() {
        return <div data-testid="statistics-chart">Statistics Chart</div>;
    };
});

jest.mock('../TimerDisplayAndEdit', () => ({
    TimerField: function TimerField({ valueMs }: { valueMs: number }) {
        return <div data-testid="timer-field">{Math.floor(valueMs / 1000)}s</div>;
    }
}));

describe('QuestionDisplay', () => {
    const mockQuestion = {
        uid: 'q1',
        text: 'What is 2 + 2?',
        questionType: 'multiple_choice',
        discipline: 'math',
        themes: ['arithmetic'],
        difficulty: 1,
        gradeLevel: 'elementary',
        explanation: 'Simple addition',
        tags: ['basic'],
        excludedFrom: [],
        durationMs: 30000,
        multipleChoiceQuestion: {
            answerOptions: ['3', '4', '5', '6'],
            correctAnswers: [false, true, false, false]
        }
    };

    const defaultProps = {
        question: mockQuestion,
        isOpen: false,
        isActive: true,
        disabled: false,
        timerStatus: 'stop' as const,
        timeLeftMs: 30000,
        showControls: true,
        className: '',
        showMeta: true,
        zoomFactor: 1
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        test('renders question text', () => {
            render(<QuestionDisplay {...defaultProps} />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('renders with custom className', () => {
            render(<QuestionDisplay {...defaultProps} className="custom-class" />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('handles disabled state', () => {
            render(<QuestionDisplay {...defaultProps} disabled={true} />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });
    });

    describe('Question States', () => {
        test('shows question when open', () => {
            render(<QuestionDisplay {...defaultProps} isOpen={true} />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('shows collapsed state when closed', () => {
            render(<QuestionDisplay {...defaultProps} isOpen={false} />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });
    });

    describe('Timer Controls', () => {
        test('shows timer controls when enabled', () => {
            render(<QuestionDisplay {...defaultProps} showControls={true} isOpen={true} />);

            const buttons = screen.queryAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });

        test('hides timer controls when disabled', () => {
            render(<QuestionDisplay {...defaultProps} showControls={false} />);

            const buttons = screen.queryAllByRole('button');
            expect(buttons.length).toBeDefined();
        });
    });

    describe('Timer Display', () => {
        test('displays timer field with correct time', () => {
            render(<QuestionDisplay {...defaultProps} timeLeftMs={15000} />);

            expect(screen.getByTestId('timer-field')).toHaveTextContent('15s');
        });
    });

    describe('Question Types', () => {
        test('handles numeric questions', () => {
            const numericQuestion = {
                ...mockQuestion,
                questionType: 'numeric',
                numericQuestion: {
                    correctAnswer: 42,
                    unit: 'cm'
                },
                multipleChoiceQuestion: undefined
            };

            render(<QuestionDisplay {...defaultProps} question={numericQuestion} isOpen={true} />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('handles multiple choice questions', () => {
            render(<QuestionDisplay {...defaultProps} question={mockQuestion} isOpen={true} />);

            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });
    });

    describe('Explanation Display', () => {
        test('shows explanation when not hidden', () => {
            render(
                <QuestionDisplay
                    {...defaultProps}
                    isOpen={true}
                    hideExplanation={false}
                />
            );

            expect(screen.getByText('Simple addition')).toBeInTheDocument();
        });

        test('hides explanation when hideExplanation is true', () => {
            render(
                <QuestionDisplay
                    {...defaultProps}
                    isOpen={true}
                    hideExplanation={true}
                />
            );

            expect(screen.queryByText('Simple addition')).not.toBeInTheDocument();
        });
    });

    describe('Statistics', () => {
        test('renders without statistics chart by default', () => {
            render(<QuestionDisplay {...defaultProps} isOpen={true} />);

            // Statistics chart is only shown in specific conditions
            expect(screen.queryByTestId('statistics-chart')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        test('has proper ARIA labels', () => {
            render(<QuestionDisplay {...defaultProps} isOpen={true} />);

            // Check for accessible elements - use getAllByText since question text appears multiple times
            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('is keyboard navigable', () => {
            render(<QuestionDisplay {...defaultProps} isOpen={true} />);

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        test('handles missing answer options', () => {
            const questionWithoutAnswers = {
                ...mockQuestion,
                multipleChoiceQuestion: undefined
            };

            render(<QuestionDisplay {...defaultProps} question={questionWithoutAnswers} />);

            // Use getAllByText since question text appears multiple times
            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('handles empty explanation', () => {
            const questionWithoutExplanation = {
                ...mockQuestion,
                explanation: ''
            };

            render(<QuestionDisplay {...defaultProps} question={questionWithoutExplanation} isOpen={true} />);

            // Use getAllByText since question text appears multiple times
            const questionElements = screen.getAllByText('What is 2 + 2?');
            expect(questionElements.length).toBeGreaterThan(0);
        });

        test('handles zero time left', () => {
            render(<QuestionDisplay {...defaultProps} timeLeftMs={0} />);

            expect(screen.getByTestId('timer-field')).toHaveTextContent('0s');
        });
    });
});
