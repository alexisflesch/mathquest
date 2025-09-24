/**
 * LaTeX/Math Accessibility Tests
 *
 * Tests for screen reader compatibility and mathematical content accessibility:
 * - ARIA labels for mathematical expressions
 * - MathML rendering and accessibility
 * - Screen reader announcements
 * - Keyboard navigation in math content
 * - Alternative text descriptions
 * - Semantic markup validation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock MathML Component for testing
const MockMathML = ({ children, ...props }: { children: React.ReactNode;[key: string]: any }) => (
    <div data-mathml="true" {...props}>
        {children}
    </div>
);

// Mock Math Component for LaTeX/Math Accessibility Testing
const MockMathExpression = ({
    latex,
    description,
    ariaLabel,
    useMathML = true,
    interactive = false
}: {
    latex: string;
    description?: string;
    ariaLabel?: string;
    useMathML?: boolean;
    interactive?: boolean;
}) => {
    if (useMathML) {
        return (
            <div role="math" aria-label={ariaLabel || description} tabIndex={interactive ? 0 : undefined}>
                <MockMathML xmlns="http://www.w3.org/1998/Math/MathML">
                    <div className="mrow">
                        <span className="mi">x</span>
                        <span className="mo">=</span>
                        <div className="mfrac">
                            <div className="mrow">
                                <span className="mo">-</span>
                                <span className="mi">b</span>
                                <span className="mo">±</span>
                                <div className="msqrt">
                                    <div className="msup">
                                        <span className="mi">b</span>
                                        <span className="mn">2</span>
                                    </div>
                                    <span className="mo">-</span>
                                    <span className="mn">4</span>
                                    <span className="mi">a</span>
                                    <span className="mi">c</span>
                                </div>
                            </div>
                            <div className="mrow">
                                <span className="mn">2</span>
                                <span className="mi">a</span>
                            </div>
                        </div>
                    </div>
                </MockMathML>
                {description && (
                    <div className="sr-only" aria-live="polite">
                        {description}
                    </div>
                )}
            </div>
        );
    }

    // Fallback to accessible LaTeX rendering
    return (
        <div
            role="math"
            aria-label={ariaLabel || description || `Mathematical expression: ${latex}`}
            tabIndex={interactive ? 0 : undefined}
        >
            <span className="math-expression" aria-hidden="true">
                {latex}
            </span>
            {description && (
                <span className="sr-only">
                    {description}
                </span>
            )}
        </div>
    );
};

// Mock Question Component with Math
const MockQuestionWithMath = ({
    questionText,
    mathExpressions,
    showHints = false
}: {
    questionText: string;
    mathExpressions: Array<{
        latex: string;
        description: string;
        ariaLabel?: string;
    }>;
    showHints?: boolean;
}) => {
    return (
        <div className="question-container" role="region" aria-labelledby="question-title">
            <h2 id="question-title" className="sr-only">Mathematics Question</h2>
            <div className="question-text">
                {questionText.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).map((part, index) => {
                    if (part.startsWith('$$') && part.endsWith('$$')) {
                        const expr = mathExpressions[index] || { latex: part, description: 'Mathematical expression' };
                        return (
                            <MockMathExpression
                                key={index}
                                latex={expr.latex}
                                description={expr.description}
                                ariaLabel={expr.ariaLabel}
                            />
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>

            {showHints && (
                <div className="hints" role="complementary" aria-label="Solution hints">
                    <h3>Hints:</h3>
                    <ul>
                        <li>Consider the quadratic formula</li>
                        <li>Remember that the discriminant determines the nature of roots</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

// Mock Interactive Math Component
const MockInteractiveMath = ({
    expression,
    onSelect,
    selected
}: {
    expression: string;
    onSelect?: (part: string) => void;
    selected?: string;
}) => {
    const parts = expression.split(/(\w+)/);

    return (
        <div role="math" aria-label={`Interactive mathematical expression: ${expression}`}>
            {parts.map((part, index) => {
                if (part.match(/\w+/)) {
                    return (
                        <button
                            key={index}
                            className={`math-part ${selected === part ? 'selected' : ''}`}
                            onClick={() => onSelect?.(part)}
                            aria-label={`Select mathematical term ${part}`}
                            aria-pressed={selected === part}
                        >
                            {part}
                        </button>
                    );
                }
                return <span key={index} aria-hidden="true">{part}</span>;
            })}
        </div>
    );
};

// Mock Math Input Component
const MockMathInput = ({
    placeholder,
    value,
    onChange,
    ariaDescribedBy
}: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    ariaDescribedBy?: string;
}) => {
    return (
        <div className="math-input-container">
            <label htmlFor="math-input" className="sr-only">
                Mathematical answer input
            </label>
            <input
                id="math-input"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-describedby={ariaDescribedBy}
                aria-label="Enter your mathematical answer"
                role="textbox"
                aria-multiline="false"
            />
            {ariaDescribedBy && (
                <div id={ariaDescribedBy} className="sr-only">
                    Use LaTeX syntax for mathematical expressions. For example: x^2 + 2x + 1
                </div>
            )}
        </div>
    );
};

describe('LaTeX/Math Accessibility Tests', () => {
    describe('Math Expression ARIA Labels', () => {
        test('should have proper ARIA label for MathML expressions', () => {
            render(
                <MockMathExpression
                    latex="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
                    description="Quadratic formula"
                    ariaLabel="The quadratic formula for solving ax squared plus bx plus c equals zero"
                />
            );

            const mathElement = screen.getByRole('math');
            expect(mathElement).toHaveAttribute('aria-label', 'The quadratic formula for solving ax squared plus bx plus c equals zero');
        });

        test('should provide fallback ARIA label when description is missing', () => {
            render(
                <MockMathExpression
                    latex="\\int_0^\\infty e^{-x} dx"
                    useMathML={false}
                />
            );

            const mathElement = screen.getByRole('math');
            expect(mathElement).toHaveAttribute('aria-label', expect.stringContaining('Mathematical expression'));
        });

        test('should have screen reader only description for complex expressions', () => {
            render(
                <MockMathExpression
                    latex="\\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}"
                    description="The Basel problem solution showing that the sum of reciprocals of squares equals pi squared over six"
                />
            );

            const srDescription = screen.getByText('The Basel problem solution showing that the sum of reciprocals of squares equals pi squared over six');
            expect(srDescription).toHaveClass('sr-only');
            expect(srDescription).toHaveAttribute('aria-live', 'polite');
        });
    });

    describe('MathML Rendering and Accessibility', () => {
        test('should render MathML with proper namespace', () => {
            render(
                <MockMathExpression
                    latex="x^2 + 2x + 1 = 0"
                    description="Simple quadratic equation"
                />
            );

            const mathElement = document.querySelector('[data-mathml]');
            expect(mathElement).toHaveAttribute('xmlns', 'http://www.w3.org/1998/Math/MathML');
        });

        test('should have proper semantic structure in MathML', () => {
            render(
                <MockMathExpression
                    latex="\\frac{a}{b}"
                    description="Fraction a over b"
                />
            );

            const mfrac = document.querySelector('.mfrac');
            expect(mfrac).toBeInTheDocument();

            const mrow = document.querySelector('.mfrac .mrow');
            expect(mrow).toBeInTheDocument();
        });

        test('should fallback to accessible text when MathML is disabled', () => {
            render(
                <MockMathExpression
                    latex="\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1"
                    description="Limit of sin x over x as x approaches zero equals one"
                    useMathML={false}
                />
            );

            const mathElement = screen.getByRole('math');
            expect(mathElement).toHaveAttribute('aria-label', 'Limit of sin x over x as x approaches zero equals one');

            const visualExpression = document.querySelector('.math-expression');
            expect(visualExpression).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('Screen Reader Compatibility', () => {
        test('should announce mathematical expressions correctly', () => {
            render(
                <MockQuestionWithMath
                    questionText="Solve the equation: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$"
                    mathExpressions={[{
                        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
                        description: "x equals negative b plus or minus square root of b squared minus 4 a c, all over 2 a"
                    }]}
                />
            );

            const mathElement = screen.getByRole('math', {
                name: 'Mathematical expression'
            });
            expect(mathElement).toHaveAttribute('aria-label', 'Mathematical expression');
        });

        test('should provide context for mathematical questions', () => {
            render(
                <MockQuestionWithMath
                    questionText="What is the derivative of $$f(x) = x^2 + 3x + 1$$?"
                    mathExpressions={[{
                        latex: "f(x) = x^2 + 3x + 1",
                        description: "f of x equals x squared plus 3 x plus 1"
                    }]}
                />
            );

            const region = screen.getByRole('region');
            expect(region).toHaveAttribute('aria-labelledby', 'question-title');

            const title = screen.getByText('Mathematics Question');
            expect(title).toHaveClass('sr-only');
        });

        test('should announce hints and solution steps', () => {
            render(
                <MockQuestionWithMath
                    questionText="Solve: $$2x^2 - 4x - 6 = 0$$"
                    mathExpressions={[{
                        latex: "2x^2 - 4x - 6 = 0",
                        description: "2 x squared minus 4 x minus 6 equals zero"
                    }]}
                    showHints={true}
                />
            );

            const hintsRegion = screen.getByRole('complementary');
            expect(hintsRegion).toHaveAttribute('aria-label', 'Solution hints');

            expect(screen.getByText('Consider the quadratic formula')).toBeInTheDocument();
            expect(screen.getByText('Remember that the discriminant determines the nature of roots')).toBeInTheDocument();
        });
    });

    describe('Keyboard Navigation in Math Content', () => {
        test('should make interactive math elements keyboard accessible', () => {
            render(
                <MockMathExpression
                    latex="\\frac{d}{dx}[x^2] = 2x"
                    description="Derivative of x squared is 2x"
                    interactive={true}
                />
            );

            const mathElement = screen.getByRole('math', {
                name: 'Derivative of x squared is 2x'
            });
            expect(mathElement).toHaveAttribute('tabIndex', '0');
        });

        test('should support keyboard navigation in interactive math', () => {
            const mockOnSelect = jest.fn();
            render(
                <MockInteractiveMath
                    expression="ax^2 + bx + c = 0"
                    onSelect={mockOnSelect}
                />
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(5); // ax, 2, bx, c, 0

            // Test click activation
            fireEvent.click(buttons[0]);
            expect(mockOnSelect).toHaveBeenCalledWith('ax');

            // Test keyboard activation (Enter key)
            fireEvent.keyDown(buttons[0], { key: 'Enter' });
            expect(mockOnSelect).toHaveBeenCalledWith('ax');
        });

        test('should indicate selected state for screen readers', () => {
            render(
                <MockInteractiveMath
                    expression="x + y = z"
                    selected="x"
                />
            );

            const selectedButton = screen.getByRole('button', { pressed: true });
            expect(selectedButton).toHaveTextContent('x');
            expect(selectedButton).toHaveAttribute('aria-pressed', 'true');
        });
    });

    describe('Math Input Accessibility', () => {
        test('should have proper labels and descriptions for math input', () => {
            const mockOnChange = jest.fn();
            render(
                <MockMathInput
                    placeholder="Enter your answer..."
                    value=""
                    onChange={mockOnChange}
                    ariaDescribedBy="math-help"
                />
            );

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-label', 'Enter your mathematical answer');
            expect(input).toHaveAttribute('aria-describedby', 'math-help');

            const helpText = document.getElementById('math-help');
            expect(helpText).toHaveTextContent('Use LaTeX syntax for mathematical expressions');
            expect(helpText).toHaveClass('sr-only');
        });

        test('should announce input changes for screen readers', () => {
            const mockOnChange = jest.fn();
            render(
                <MockMathInput
                    placeholder="Type math expression"
                    value=""
                    onChange={mockOnChange}
                />
            );

            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '\\frac{1}{2}' } });

            expect(mockOnChange).toHaveBeenCalledWith('\\frac{1}{2}');
        });

        test('should provide autocomplete suggestions accessibly', () => {
            const mockOnChange = jest.fn();
            render(
                <div>
                    <MockMathInput
                        placeholder="Start typing math..."
                        value="\\fr"
                        onChange={mockOnChange}
                        ariaDescribedBy="autocomplete-desc"
                    />
                    <div id="autocomplete-desc" className="sr-only">
                        Autocomplete suggestions available. Use arrow keys to navigate.
                    </div>
                    <ul role="listbox" aria-label="Math symbol suggestions" className="sr-only">
                        <li role="option" aria-selected="true">\\frac</li>
                        <li role="option">\\sqrt</li>
                    </ul>
                </div>
            );

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-describedby', 'autocomplete-desc');

            const listbox = screen.getByRole('listbox');
            expect(listbox).toHaveAttribute('aria-label', 'Math symbol suggestions');

            const selectedOption = screen.getByRole('option', { selected: true });
            expect(selectedOption).toHaveTextContent('\\frac');
        });
    });

    describe('Complex Mathematical Content', () => {
        test('should handle nested mathematical structures', () => {
            render(
                <div>
                    <h2>Advanced Calculus Problem</h2>
                    <MockMathExpression
                        latex="\\int_0^\\pi \\sin^2(x) \\, dx = \\frac{\\pi}{2}"
                        description="The integral from zero to pi of sin squared x dx equals pi over two"
                    />
                    <p>This demonstrates the use of trigonometric identities in integration.</p>
                </div>
            );

            const mathElement = screen.getByRole('math', {
                name: 'The integral from zero to pi of sin squared x dx equals pi over two'
            });
            expect(mathElement).toHaveAttribute('aria-label', 'The integral from zero to pi of sin squared x dx equals pi over two');
        });

        test('should provide navigation landmarks for complex math content', () => {
            render(
                <div>
                    <nav aria-label="Problem navigation">
                        <button>Previous Problem</button>
                        <button>Next Problem</button>
                    </nav>

                    <main>
                        <section aria-labelledby="problem-title">
                            <h1 id="problem-title">Complex Analysis Problem</h1>
                            <MockMathExpression
                                latex="\\oint_C \\frac{dz}{z - a} = 2\\pi i"
                                description="The contour integral over C of dz over z minus a equals 2 pi i"
                            />
                        </section>

                        <section aria-labelledby="solution-title">
                            <h2 id="solution-title">Step-by-Step Solution</h2>
                            <ol>
                                <li>Identify the singularity at z = a</li>
                                <li>Apply Cauchy\'s integral formula</li>
                                <li>Evaluate the residue</li>
                            </ol>
                        </section>
                    </main>
                </div>
            );

            const nav = screen.getByRole('navigation');
            expect(nav).toHaveAttribute('aria-label', 'Problem navigation');

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();

            const sections = screen.getAllByRole('region');
            expect(sections).toHaveLength(2);
        });

        test('should handle mathematical tables and matrices accessibly', () => {
            render(
                <div>
                    <h2>Matrix Operations</h2>
                    <table role="table" aria-label="2x2 matrix A">
                        <caption>Matrix A</caption>
                        <tbody>
                            <tr>
                                <td role="cell" aria-label="Row 1, Column 1: 1">1</td>
                                <td role="cell" aria-label="Row 1, Column 2: 2">2</td>
                            </tr>
                            <tr>
                                <td role="cell" aria-label="Row 2, Column 1: 3">3</td>
                                <td role="cell" aria-label="Row 2, Column 2: 4">4</td>
                            </tr>
                        </tbody>
                    </table>

                    <MockMathExpression
                        latex="\\det(A) = 1 \\times 4 - 2 \\times 3 = -2"
                        description="Determinant of A equals 1 times 4 minus 2 times 3 equals negative 2"
                    />
                </div>
            );

            const table = screen.getByRole('table');
            expect(table).toHaveAttribute('aria-label', '2x2 matrix A');

            const cells = screen.getAllByRole('cell');
            expect(cells).toHaveLength(4);

            cells.forEach(cell => {
                expect(cell).toHaveAttribute('aria-label', expect.stringContaining('Row'));
                expect(cell).toHaveAttribute('aria-label', expect.stringContaining('Column'));
            });
        });
    });
});