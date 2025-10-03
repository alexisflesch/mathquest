import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionEditor } from '../components/QuestionEditor';
import { MultipleChoiceQuestion } from '../types';
import { ParsedMetadata } from '../types/metadata';

jest.mock('../components/MonacoYamlEditor', () => ({
    MonacoYamlEditor: ({ value }: { value: string }) => (
        <div data-testid="monaco-editor-stub">{value}</div>
    ),
}));

const buildQuestion = (overrides: Partial<MultipleChoiceQuestion> = {}): MultipleChoiceQuestion => ({
    uid: 'test-question',
    discipline: 'a',
    author: 'aflesch',
    title: 'Sample Question',
    text: 'Question text',
    questionType: 'multiple_choice',
    themes: ['Séries numériques'],
    tags: ['convergence'],
    timeLimit: 30,
    difficulty: 1,
    gradeLevel: 'L2',
    answerOptions: ['Option A', 'Option B'],
    correctAnswers: [true, false],
    explanation: '',
    feedbackWaitTime: 15,
    ...overrides,
});

const metadata: ParsedMetadata = {
    gradeLevels: ['L2'],
    metadata: {
        L2: {
            niveau: 'L2',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Séries numériques',
                            tags: ['convergence'],
                        },
                    ],
                },
                {
                    nom: 'Analyse',
                    themes: [
                        {
                            nom: 'Suites',
                            tags: ['divergence'],
                        },
                    ],
                },
            ],
        },
    },
};

describe('QuestionEditor in YAML mode', () => {
    it('does not auto-normalize invalid discipline while editing raw YAML', async () => {
        const handleQuestionChange = jest.fn();
        const handleYamlChange = jest.fn();
        const handleModeChange = jest.fn();

        render(
            <QuestionEditor
                question={buildQuestion({ discipline: 'a' })}
                onChange={handleQuestionChange}
                mode="yaml"
                onModeChange={handleModeChange}
                yamlText="- uid: test-question\n  discipline: \n"
                onYamlChange={handleYamlChange}
                selectedQuestionIndex={0}
                yamlError={null}
                metadata={metadata}
            />
        );

        await waitFor(() => {
            expect(handleQuestionChange).not.toHaveBeenCalled();
        });
    });
});
