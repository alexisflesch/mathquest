import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionDisplay from '../QuestionDisplay';

// Mock dependencies used by QuestionDisplay
jest.mock('../../utils', () => ({
    formatTime: jest.fn((ms: number) => `${Math.floor((ms || 0) / 1000)}s`),
}));

jest.mock('../../clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    })),
}));

jest.mock('../MathJaxWrapper', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div className="MathJax">{children}</div>,
}));

jest.mock('../StatisticsChart', () => ({
    __esModule: true,
    default: () => <div data-testid="statistics-chart" />,
}));

jest.mock('../TimerDisplayAndEdit', () => ({
    TimerField: ({ valueMs }: { valueMs: number }) => <span data-testid="timer-field">{valueMs}</span>,
}));

describe('QuestionDisplay scroll structure (dashboards)', () => {
    const baseQuestion: any = {
        uid: 'q-scroll',
        title: 'Titre visible',
        text: 'Texte de question avec une formule longue: \\[ \int_0^1 \frac{\mathrm{e}^t+1}{\sqrt{x}(1+x)} dx\\]',
        questionType: 'multiple_choice',
        discipline: 'Mathématiques',
        themes: ['Intégrales'],
        difficulty: 2,
        gradeLevel: 'L2',
        explanation: '',
        tags: [],
        excludedFrom: [],
        durationMs: 30000,
        multipleChoiceQuestion: {
            answerOptions: ['Réponse A', 'Réponse B'],
            correctAnswers: [true, false],
        },
    };

    it('ensures expanded question text is the horizontal scroll container without vertical scrollbars', () => {
        const { container } = render(
            <QuestionDisplay
                question={baseQuestion}
                isOpen={true}
                isActive={false}
                disabled={false}
                timerStatus="stop"
                timeLeftMs={30000}
                showControls={false}
                showMeta={false}
            />
        );

        // Expanded question text container in dashboard variant
        const expandedText = container.querySelector('.answers-list .question-text-in-dashboards') as HTMLElement;
        expect(expandedText).toBeInTheDocument();

        // We expect the component to explicitly set inline styles to avoid relying on CSS compute in JSDOM
        expect(expandedText.style.overflowX).toBe('auto');
        expect(expandedText.style.overflowY === '' || expandedText.style.overflowY === 'visible').toBe(true);
    });
});
