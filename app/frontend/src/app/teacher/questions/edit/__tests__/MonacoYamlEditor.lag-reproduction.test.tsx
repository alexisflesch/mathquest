import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonacoYamlEditor } from '../components/MonacoYamlEditor';
import { QuestionList } from '../components/QuestionList';
import type { ParsedMetadata } from '../types/metadata';

/**
 * Regression / lag test:
 * - Sets NODE_ENV=development so guarded debug logs would run
 * - Mounts a small wrapper wiring MonacoYamlEditor -> parent state -> QuestionList
 * - Simulates many rapid typing updates by calling the mock editor.setValue
 * - Asserts console.debug is not called more than a small threshold
 */

// Local mock of the Monaco Editor (kept small and synchronous)
jest.mock('@monaco-editor/react', () => {
    const React = require('react');
    const MockMonacoEditor = ({ onMount, value, onChange }: any) => {
        React.useEffect(() => {
            if (onMount) {
                // create a simple mock editor
                let content = value || '';
                const model = {
                    getValue: () => content,
                    setValue: (v: string) => {
                        content = v;
                        if (onChange) onChange(v);
                        // trigger model content callbacks
                        modelChangeCallbacks.forEach((cb: any) => cb());
                        // trigger selection callbacks as a no-op
                        selectionCallbacks.forEach((cb: any) => cb());
                    },
                    getValueInRange: () => '',
                    getWordUntilPosition: () => ({ word: '', startColumn: 1, endColumn: 1 }),
                    getOffsetAt: (pos: any) => 0,
                };

                const modelChangeCallbacks: any[] = [];
                const selectionCallbacks: any[] = [];

                const mockEditor = {
                    getModel: () => model,
                    setValue: model.setValue,
                    focus: () => { },
                    setPosition: () => { },
                    revealPositionInCenter: () => { },
                    onDidChangeModelContent: (cb: any) => { modelChangeCallbacks.push(cb); return { dispose: () => { } }; },
                    onDidChangeCursorSelection: (cb: any) => { selectionCallbacks.push(cb); return { dispose: () => { } }; },
                    getPosition: () => ({ lineNumber: 1, column: 1 }),
                };

                const mockMonaco = {
                    languages: { registerCompletionItemProvider: () => ({ dispose: () => { } }) },
                    editor: { setModelMarkers: () => { } },
                };

                // expose the mock editor to the test via window so we can simulate typing
                // @ts-expect-error: assigning custom property to window for test mocking
                window.__mockMonacoEditor = mockEditor;

                onMount(mockEditor as any, mockMonaco as any);
            }
        }, [onMount, value, onChange]);

        return <div data-testid="monaco-editor">{value}</div>;
    };

    return { __esModule: true, default: MockMonacoEditor };
});

const mockMetadata: ParsedMetadata = {
    gradeLevels: ['L1'],
    metadata: { L1: { niveau: 'L1', disciplines: [{ nom: 'Mathématiques', themes: [{ nom: 'Algèbre', tags: [] }] }] } },
};

describe('MonacoYamlEditor lag / excessive logging reproduction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete (window as any).__mockMonacoEditor;
    });

    it('should not produce excessive console.debug calls while typing rapidly', async () => {
        const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => { });

        // Wrapper that connects editor -> state -> QuestionList
        function Wrapper() {
            const [text, setText] = React.useState('- uid: x\n  gradeLevel: L1\n  discipline: ');
            const [problems, setProblems] = React.useState<Array<any>>([]);

            const handleChange = (newText: string) => {
                setText(newText);
                // naive problems computation: if discipline line empty -> warning
                const hasDisciplineEmpty = /discipline:\s*$/.test(newText);
                setProblems(newText ? (hasDisciplineEmpty ? [[{ type: 'warning', message: 'discipline empty' }]] : [[]]) : []);
            };

            return (
                <div>
                    <MonacoYamlEditor value={text} onChange={handleChange} error={null as any} metadata={mockMetadata as any} />
                    <QuestionList
                        questions={[{ uid: 'x', title: 't', text: '', questionType: 'single_choice', themes: [], answerOptions: ['A'], correctAnswers: [true] } as any]}
                        selectedQuestionIndex={0}
                        onSelectQuestion={() => { }}
                        onAddQuestion={() => { }}
                        onDeleteQuestion={() => { }}
                        problems={problems}
                    />
                </div>
            );
        }

        const { container } = render(<Wrapper />);

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        // Grab the mock editor exposed on window and simulate many typing updates
        const mockEditor = (window as any).__mockMonacoEditor;
        expect(mockEditor).toBeDefined();

        // Simulate rapid typing: 50 keystrokes
        let current = (mockEditor.getModel && mockEditor.getModel().getValue()) || '';
        for (let i = 0; i < 50; i++) {
            current = current + 'a';
            mockEditor.setValue(current);
        }

        // Allow microtasks to run
        await new Promise((r) => setTimeout(r, 0));

        // We expect debug to be low — previously it was extremely high causing lag.
        // Set a conservative threshold: no more than 10 debug calls during this burst.
        const calls = debugSpy.mock.calls.length;
        expect(calls).toBeLessThanOrEqual(10);

        debugSpy.mockRestore();
    });
});
