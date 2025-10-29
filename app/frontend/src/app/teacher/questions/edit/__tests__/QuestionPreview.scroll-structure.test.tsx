import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionPreview } from '../components/QuestionPreview';
import { MultipleChoiceQuestion } from '../types';
import { questionDataForStudentSchema } from '@shared/types/socketEvents.zod';

// Mock MathJaxWrapper similarly to the QuestionCard test
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

// Mock AnswerFeedbackOverlay (not relevant for this test)
jest.mock('@/components/AnswerFeedbackOverlay', () => ({
    __esModule: true,
    default: () => <div data-testid="feedback-overlay" />,
}));

const buildQuestion = (overrides: Partial<MultipleChoiceQuestion> = {}): MultipleChoiceQuestion => ({
    uid: 'q1',
    author: 't',
    discipline: 'Math',
    title: 'Titre',
    text: 'Soit f(x) = x^2. \\[a^2 + b^2 = c^2\\]'.repeat(2),
    questionType: 'multiple_choice',
    themes: [],
    tags: [],
    timeLimit: 30,
    difficulty: 1,
    gradeLevel: 'L2',
    answerOptions: [
        'Option 1: \\[\\sum_{k=1}^n k = n(n+1)/2\\]'.repeat(2),
        'Option 2 très longue avec \\[e^{i\\pi} + 1 = 0\\]'.repeat(2),
    ],
    correctAnswers: [true, false],
    explanation: '',
    feedbackWaitTime: 15,
    ...overrides,
});

describe('QuestionPreview horizontal scroll structure', () => {
    it('keeps single scroll containers for text and answers across content updates', async () => {
        const q = buildQuestion();

        const { container, rerender } = render(
            <QuestionPreview question={q} questionIndex={1} totalQuestions={1} />
        );

        // Within the phone frame, find the question-text area
        const questionTextEl = container.querySelector('.question-text-in-live-page') as HTMLElement;
        expect(questionTextEl).toBeInTheDocument();
        expect(questionTextEl.style.overflowX).toBe('auto');

        // Answer buttons should not be scrollable themselves
        const buttons = Array.from(container.querySelectorAll('button.tqcard-answer')) as HTMLElement[];
        expect(buttons.length).toBe(2);
        for (const btn of buttons) {
            expect(btn.style.overflowX === '' || btn.style.overflowX === 'visible').toBe(true);
        }

        // Inner left spans should NOT own horizontal scroll
        const contentSpans = buttons.map((btn) => btn.querySelector('span')) as (HTMLElement | null)[];
        expect(contentSpans.every(Boolean)).toBe(true);
        for (const span of contentSpans) {
            const ox = (span as HTMLElement).style.overflowX;
            expect(ox === '' || ox === 'visible').toBe(true);
        }

        // Simulate typing by updating question content
        const updated = buildQuestion({
            text: q.text + ' + saisie',
            answerOptions: q.answerOptions.map((s) => s + ' + saisie'),
        });

        await act(async () => {
            rerender(<QuestionPreview question={updated} questionIndex={1} totalQuestions={1} />);
        });

        const questionTextEl2 = container.querySelector('.question-text-in-live-page') as HTMLElement;
        expect(questionTextEl2.style.overflowX).toBe('auto');

        const buttons2 = Array.from(container.querySelectorAll('button.tqcard-answer')) as HTMLElement[];
        for (const btn of buttons2) {
            expect(btn.style.overflowX === '' || btn.style.overflowX === 'visible').toBe(true);
        }

        const contentSpans2 = buttons2.map((btn) => btn.querySelector('span')) as (HTMLElement | null)[];
        for (const span of contentSpans2) {
            const ox = (span as HTMLElement).style.overflowX;
            expect(ox === '' || ox === 'visible').toBe(true);
        }
    });
});
