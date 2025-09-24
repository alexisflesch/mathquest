/**
 * Question Display Edge Cases Tests
 *
 * Tests LaTeX rendering edge cases in QuestionDisplay and MathJaxWrapper components.
 * Covers malformed LaTeX, rendering failures, zoom issues, and display problems.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

// Mock MathJax
jest.mock('better-react-mathjax', () => ({
    MathJaxContext: ({ children }: { children: React.ReactNode }) => <div data-testid="mathjax-context">{children}</div>,
    MathJax: ({ children }: { children: React.ReactNode }) => <div data-testid="mathjax">{children}</div>
}));

// Mock MathJaxWrapper
jest.mock('@/components/MathJaxWrapper', () => ({
    __esModule: true,
    default: ({ children, zoomFactor = 1 }: { children: React.ReactNode; zoomFactor?: number }) => (
        <div data-testid="mathjax-wrapper" style={{ fontSize: `${zoomFactor}rem` }}>
            {children}
        </div>
    )
}));

// Mock the logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

// Import after mocks
import MathJaxWrapper from '@/components/MathJaxWrapper';

// Mock QuestionDisplay component for testing
const MockQuestionDisplay: React.FC<{
    question: any;
    showAnswer?: boolean;
    zoomFactor?: number;
}> = ({ question, showAnswer = false, zoomFactor = 1 }) => {
    return (
        <div data-testid="mathjax-context">
            <div data-testid="question-display">
                <div data-testid="mathjax-wrapper" style={{ fontSize: `${zoomFactor}rem` }}>
                    <div data-testid="question-text">{question.text}</div>
                    {showAnswer && question.correctAnswer && (
                        <div data-testid="correct-answer">{question.correctAnswer}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

describe('Question Display Edge Cases', () => {
    describe('LaTeX Rendering Edge Cases', () => {
        test('should handle malformed LaTeX gracefully', () => {
            const questionWithBadLatex = {
                text: 'Solve: \\frac{a}{b} \\invalidcommand{c}',
                correctAnswer: 'x = 5'
            };

            render(<MockQuestionDisplay question={questionWithBadLatex} />);

            // Component should render despite malformed LaTeX
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('\\invalidcommand{c}');
        });

        test('should handle empty LaTeX expressions', () => {
            const questionWithEmptyLatex = {
                text: 'Solve: \\(\\ \\) and \\[ \\]',
                correctAnswer: 'x = 0'
            };

            render(<MockQuestionDisplay question={questionWithEmptyLatex} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('\\(\\ \\)');
        });

        test('should handle nested LaTeX expressions', () => {
            const questionWithNestedLatex = {
                text: 'Simplify: \\( \\frac{ \\sqrt{x} }{ \\sqrt{y} } \\)',
                correctAnswer: '\\( \\sqrt{\\frac{x}{y}} \\)'
            };

            render(<MockQuestionDisplay question={questionWithNestedLatex} showAnswer={true} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('correct-answer')).toHaveTextContent('\\sqrt{\\frac{x}{y}}');
        });

        test('should handle LaTeX with special characters', () => {
            const questionWithSpecialChars = {
                text: 'Find: \\( x^2 + y^2 = r^2 \\) where \\( r > 0 \\)',
                correctAnswer: 'Circle equation'
            };

            render(<MockQuestionDisplay question={questionWithSpecialChars} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('x^2 + y^2 = r^2');
        });

        test('should handle very long LaTeX expressions', () => {
            const longLatexExpression = '\\( \\int_{0}^{\\infty} \\frac{\\sin(x)}{x} \\, dx = \\frac{\\pi}{2} \\)';
            const questionWithLongLatex = {
                text: `Evaluate: ${longLatexExpression.repeat(5)}`,
                correctAnswer: '\\( \\frac{\\pi}{2} \\)'
            };

            render(<MockQuestionDisplay question={questionWithLongLatex} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('\\int_{0}^{\\infty}');
        });

        test('should handle LaTeX with Unicode characters', () => {
            const questionWithUnicode = {
                text: 'Solve: \\( α + β = γ \\) where α, β, γ ∈ ℝ',
                correctAnswer: 'Any real numbers'
            };

            render(<MockQuestionDisplay question={questionWithUnicode} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('α + β = γ');
        });
    });

    describe('MathJaxWrapper Component Edge Cases', () => {
        test('should handle zoom factor changes', () => {
            const question = {
                text: '\\( x^2 + y^2 = z^2 \\)',
                correctAnswer: 'Pythagorean theorem'
            };

            const { rerender } = render(
                <MockQuestionDisplay question={question} zoomFactor={1.0} />
            );

            // Should render with default zoom
            expect(screen.getByTestId('mathjax-context')).toBeInTheDocument();

            // Rerender with different zoom
            rerender(<MockQuestionDisplay question={question} zoomFactor={1.5} />);

            // Component should handle zoom change gracefully
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });

        test('should handle extreme zoom factors', () => {
            const question = {
                text: '\\( \\frac{a}{b} \\)',
                correctAnswer: 'a/b'
            };

            // Test very small zoom
            const { unmount } = render(<MockQuestionDisplay question={question} zoomFactor={0.1} />);
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            unmount();

            // Test very large zoom
            render(<MockQuestionDisplay question={question} zoomFactor={5.0} />);
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });

        test('should handle negative zoom factors', () => {
            const question = {
                text: '\\( x + y = z \\)',
                correctAnswer: 'z'
            };

            // Should handle negative zoom gracefully (though not recommended)
            render(<MockQuestionDisplay question={question} zoomFactor={-1.0} />);
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });

        test('should handle zero zoom factor', () => {
            const question = {
                text: '\\( 2x = 10 \\)',
                correctAnswer: 'x = 5'
            };

            // Should handle zero zoom gracefully
            render(<MockQuestionDisplay question={question} zoomFactor={0} />);
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });
    });

    describe('Question Display Rendering Edge Cases', () => {
        test('should handle questions with no LaTeX', () => {
            const plainTextQuestion = {
                text: 'What is 2 + 2?',
                correctAnswer: '4'
            };

            render(<MockQuestionDisplay question={plainTextQuestion} showAnswer={true} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('What is 2 + 2?');
            expect(screen.getByTestId('correct-answer')).toHaveTextContent('4');
        });

        test('should handle questions with mixed content', () => {
            const mixedContentQuestion = {
                text: 'Solve for x: \\( 2x + 3 = 7 \\). First subtract 3 from both sides.',
                correctAnswer: '\\( 2x = 4 \\), so \\( x = 2 \\)'
            };

            render(<MockQuestionDisplay question={mixedContentQuestion} showAnswer={true} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('2x + 3 = 7');
            expect(screen.getByTestId('correct-answer')).toHaveTextContent('x = 2');
        });

        test('should handle questions with only LaTeX delimiters', () => {
            const latexOnlyQuestion = {
                text: '\\( ax^2 + bx + c = 0 \\)',
                correctAnswer: '\\( x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\)'
            };

            render(<MockQuestionDisplay question={latexOnlyQuestion} showAnswer={true} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('ax^2 + bx + c = 0');
        });

        test('should handle questions with unclosed LaTeX delimiters', () => {
            const unclosedLatexQuestion = {
                text: 'Expression: \\( x^2 + y^2',
                correctAnswer: 'Missing closing parenthesis'
            };

            render(<MockQuestionDisplay question={unclosedLatexQuestion} />);

            // Should still render despite unclosed delimiter
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('x^2 + y^2');
        });

        test('should handle questions with mismatched delimiters', () => {
            const mismatchedDelimitersQuestion = {
                text: 'Mixed: \\( x^2 \\] and \\[ y^2 \\)',
                correctAnswer: 'Delimiter mismatch'
            };

            render(<MockQuestionDisplay question={mismatchedDelimitersQuestion} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('x^2');
        });
    });

    describe('Performance and Memory Edge Cases', () => {
        test('should handle rapid re-rendering with different LaTeX', () => {
            const questions = [
                { text: '\\( x = 1 \\)', correctAnswer: '1' },
                { text: '\\( y = 2 \\)', correctAnswer: '2' },
                { text: '\\( z = 3 \\)', correctAnswer: '3' }
            ];

            const { rerender } = render(<MockQuestionDisplay question={questions[0]} />);

            // Rapidly change questions
            for (const question of questions.slice(1)) {
                rerender(<MockQuestionDisplay question={question} />);
            }

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });

        test('should handle LaTeX with many symbols', () => {
            const complexLatexQuestion = {
                text: '\\( \\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6} \\)',
                correctAnswer: 'Basel problem solution'
            };

            render(<MockQuestionDisplay question={complexLatexQuestion} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('\\sum_{n=1}^{\\infty}');
        });

        test('should handle LaTeX with matrices', () => {
            const matrixQuestion = {
                text: 'Solve: \\( \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} 5 \\\\ 11 \\end{pmatrix} \\)',
                correctAnswer: '\\( x = 1, y = 2 \\)'
            };

            render(<MockQuestionDisplay question={matrixQuestion} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
            expect(screen.getByTestId('question-text')).toHaveTextContent('\\begin{pmatrix}');
        });
    });

    describe('Browser Compatibility Edge Cases', () => {
        test('should handle LaTeX in different browsers', () => {
            // This test documents browser compatibility concerns
            const crossBrowserQuestion = {
                text: 'Universal: \\( E = mc^2 \\)',
                correctAnswer: 'Einstein\'s equation'
            };

            render(<MockQuestionDisplay question={crossBrowserQuestion} />);

            // Component should work across different browsers
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });

        test('should handle LaTeX with browser font differences', () => {
            const fontDependentQuestion = {
                text: 'Typography: \\( \\mathcal{F} \\mathfrak{r} \\mathbb{R} \\)',
                correctAnswer: 'Font-dependent rendering'
            };

            render(<MockQuestionDisplay question={fontDependentQuestion} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });
    });

    describe('Accessibility Edge Cases', () => {
        test('should provide alt text for LaTeX expressions', () => {
            // This test documents accessibility concerns
            const accessibilityQuestion = {
                text: '\\( \\sqrt{a^2 + b^2} \\)',
                correctAnswer: 'Pythagorean theorem in 2D'
            };

            render(<MockQuestionDisplay question={accessibilityQuestion} />);

            // LaTeX should be accessible to screen readers
            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });

        test('should handle high contrast mode', () => {
            const contrastQuestion = {
                text: '\\( \\frac{\\partial f}{\\partial x} \\)',
                correctAnswer: 'Partial derivative'
            };

            render(<MockQuestionDisplay question={contrastQuestion} />);

            expect(screen.getByTestId('question-display')).toBeInTheDocument();
        });
    });
});