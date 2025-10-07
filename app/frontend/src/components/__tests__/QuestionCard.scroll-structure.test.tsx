import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionCard from '@/components/QuestionCard';

// Mock MathJaxWrapper to simulate typical MathJax DOM wrappers without introducing inline overflow styles
jest.mock('@/components/MathJaxWrapper', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
        <div className="mjx-mock-root">
            <div className="MathJax_Display">
                <div className="mjx-container">
                    <div className="mjx-chtml">
                        <span className="MathJax">{children}</span>
                    </div>
                </div>
            </div>
        </div>
    ),
}));

type MCStudentPayload = {
    uid: string;
    title: string;
    text: string;
    questionType: 'multiple_choice';
    timeLimit: number;
    currentQuestionIndex: number;
    totalQuestions: number;
    multipleChoiceQuestion: {
        answerOptions: string[];
    };
};

const buildPayload = (overrides: Partial<MCStudentPayload> = {}): MCStudentPayload => ({
    uid: 'q1',
    title: 'Titre',
    text: 'Texte avec \\[a^2 + b^2 = c^2\\] et contenu très long'.repeat(2),
    questionType: 'multiple_choice',
    timeLimit: 30,
    currentQuestionIndex: 1,
    totalQuestions: 1,
    multipleChoiceQuestion: {
        answerOptions: [
            'Réponse 1 avec \\[\\sum_{i=1}^n i = n(n+1)/2\\]'.repeat(2),
            'Réponse 2 avec beaucoup de texte et \\[e^{i\\pi} + 1 = 0\\]'.repeat(2),
        ],
    },
    ...overrides,
});

describe('QuestionCard horizontal scroll structure', () => {
    it('keeps a single scrollable container per region across re-renders (no nested scrollbars)', async () => {
        const payload = buildPayload();

        const { container, rerender } = render(
            <QuestionCard
                currentQuestion={payload as any}
                questionIndex={0}
                totalQuestions={1}
                isMultipleChoice={true}
                selectedAnswer={null}
                setSelectedAnswer={() => { }}
                selectedAnswers={[]}
                setSelectedAnswers={() => { }}
                handleSingleChoice={() => { }}
                handleSubmitMultiple={() => { }}
                answered={true}
                readonly={true}
                projectionMode={true}
                isQuizMode={false}
                correctAnswers={[true, false]}
            />
        );

        // Question text container should own horizontal scroll (inline style overflow-x: auto)
        const questionTextEl = container.querySelector('.question-text-in-live-page') as HTMLElement;
        expect(questionTextEl).toBeInTheDocument();
        expect(questionTextEl.style.overflowX).toBe('auto');

        // Answer buttons should not be scroll containers themselves (overflow-x: visible)
        const buttons = Array.from(container.querySelectorAll('button.tqcard-answer')) as HTMLElement[];
        expect(buttons.length).toBe(2);
        for (const btn of buttons) {
            expect(btn.style.overflowX === '' || btn.style.overflowX === 'visible').toBe(true);
        }

        // The left content span inside each button must NOT own horizontal scroll (overflow-x: visible)
        const contentSpans = buttons.map((btn) => btn.querySelector('span')) as (HTMLElement | null)[];
        expect(contentSpans.every(Boolean)).toBe(true);
        for (const span of contentSpans) {
            const ox = (span as HTMLElement).style.overflowX;
            expect(ox === '' || ox === 'visible').toBe(true);
        }

        // Simulate "typing" by updating text and answers (re-render with longer content)
        const updated = buildPayload({
            text: payload.text + ' + saisie',
            multipleChoiceQuestion: {
                answerOptions: payload.multipleChoiceQuestion.answerOptions.map((s) => s + ' + saisie'),
            },
        });

        await act(async () => {
            rerender(
                <QuestionCard
                    currentQuestion={updated as any}
                    questionIndex={0}
                    totalQuestions={1}
                    isMultipleChoice={true}
                    selectedAnswer={null}
                    setSelectedAnswer={() => { }}
                    selectedAnswers={[]}
                    setSelectedAnswers={() => { }}
                    handleSingleChoice={() => { }}
                    handleSubmitMultiple={() => { }}
                    answered={true}
                    readonly={true}
                    projectionMode={true}
                    isQuizMode={false}
                    correctAnswers={[true, false]}
                />
            );
        });

        // Validate structure remains the same after re-render
        const questionTextEl2 = container.querySelector('.question-text-in-live-page') as HTMLElement;
        expect(questionTextEl2.style.overflowX).toBe('auto');

        const buttons2 = Array.from(container.querySelectorAll('button.tqcard-answer')) as HTMLElement[];
        expect(buttons2.length).toBe(2);
        for (const btn of buttons2) {
            expect(btn.style.overflowX === '' || btn.style.overflowX === 'visible').toBe(true);
        }

        const contentSpans2 = buttons2.map((btn) => btn.querySelector('span')) as (HTMLElement | null)[];
        expect(contentSpans2.every(Boolean)).toBe(true);
        for (const span of contentSpans2) {
            const ox = (span as HTMLElement).style.overflowX;
            expect(ox === '' || ox === 'visible').toBe(true);
        }
    });
});
