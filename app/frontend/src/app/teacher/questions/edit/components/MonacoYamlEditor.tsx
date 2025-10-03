'use client';

import React, { useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import yaml from 'js-yaml';

interface MonacoYamlEditorProps {
    value: string;
    onChange: (value: string, cursorPosition?: number) => void;
    error: string | null;
}

export const MonacoYamlEditor: React.FC<MonacoYamlEditorProps> = ({ value, onChange, error }) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Register autocomplete provider for YAML
        const completionProvider = monaco.languages.registerCompletionItemProvider('yaml', {
            provideCompletionItems: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                });

                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                // Check if we're at the start of a new question
                const isNewQuestion = textUntilPosition.trim().startsWith('-') || textUntilPosition.trim() === '';

                // Field suggestions
                const fieldSuggestions: monaco.languages.CompletionItem[] = [
                    {
                        label: 'uid',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Unique identifier for the question',
                        insertText: 'uid: ""',
                        range: range,
                    },
                    {
                        label: 'author',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Author of the question',
                        insertText: 'author: ""',
                        range: range,
                    },
                    {
                        label: 'discipline',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Academic discipline',
                        insertText: 'discipline: "Mathématiques"',
                        range: range,
                    },
                    {
                        label: 'title',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Question title',
                        insertText: 'title: ""',
                        range: range,
                    },
                    {
                        label: 'text',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Question text/prompt',
                        insertText: 'text: ""',
                        range: range,
                    },
                    {
                        label: 'questionType',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Type of question: single_choice, multiple_choice, or numeric',
                        insertText: 'questionType: "single_choice"',
                        range: range,
                    },
                    {
                        label: 'themes',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Themes/topics covered',
                        insertText: 'themes: []',
                        range: range,
                    },
                    {
                        label: 'tags',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Additional tags',
                        insertText: 'tags: []',
                        range: range,
                    },
                    {
                        label: 'timeLimit',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Time limit in seconds (10-300)',
                        insertText: 'timeLimit: 30',
                        range: range,
                    },
                    {
                        label: 'difficulty',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Difficulty level (1-5)',
                        insertText: 'difficulty: 1',
                        range: range,
                    },
                    {
                        label: 'gradeLevel',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Grade level',
                        insertText: 'gradeLevel: "CE1"',
                        range: range,
                    },
                    {
                        label: 'answerOptions',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Answer options for multiple choice questions',
                        insertText: 'answerOptions:\n  - ""\n  - ""',
                        range: range,
                    },
                    {
                        label: 'correctAnswers',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Correct answers (boolean array for multiple choice)',
                        insertText: 'correctAnswers: [true, false]',
                        range: range,
                    },
                    {
                        label: 'correctAnswer',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Correct answer for numeric questions',
                        insertText: 'correctAnswer: 0',
                        range: range,
                    },
                    {
                        label: 'explanation',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Explanation shown after answering',
                        insertText: 'explanation: ""',
                        range: range,
                    },
                    {
                        label: 'feedbackWaitTime',
                        kind: monaco.languages.CompletionItemKind.Field,
                        documentation: 'Time to show feedback in seconds (5-60)',
                        insertText: 'feedbackWaitTime: 15',
                        range: range,
                    },
                ];

                // Value suggestions for specific fields
                const valueSuggestions: monaco.languages.CompletionItem[] = [];

                // Check if we're typing after "questionType:"
                if (textUntilPosition.includes('questionType:')) {
                    valueSuggestions.push(
                        {
                            label: 'single_choice',
                            kind: monaco.languages.CompletionItemKind.Value,
                            documentation: 'Single choice question (one correct answer)',
                            insertText: '"single_choice"',
                            range: range,
                        },
                        {
                            label: 'multiple_choice',
                            kind: monaco.languages.CompletionItemKind.Value,
                            documentation: 'Multiple choice question (multiple correct answers)',
                            insertText: '"multiple_choice"',
                            range: range,
                        },
                        {
                            label: 'numeric',
                            kind: monaco.languages.CompletionItemKind.Value,
                            documentation: 'Numeric question (number answer)',
                            insertText: '"numeric"',
                            range: range,
                        }
                    );
                }

                // Check if we're typing after "gradeLevel:"
                if (textUntilPosition.includes('gradeLevel:')) {
                    ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'L1', 'L2'].forEach(level => {
                        valueSuggestions.push({
                            label: level,
                            kind: monaco.languages.CompletionItemKind.Value,
                            documentation: `Grade level: ${level}`,
                            insertText: `"${level}"`,
                            range: range,
                        });
                    });
                }

                // Check if we're typing after "discipline:"
                if (textUntilPosition.includes('discipline:')) {
                    ['Mathématiques', 'Français', 'Histoire', 'Géographie', 'Sciences'].forEach(discipline => {
                        valueSuggestions.push({
                            label: discipline,
                            kind: monaco.languages.CompletionItemKind.Value,
                            documentation: `Discipline: ${discipline}`,
                            insertText: `"${discipline}"`,
                            range: range,
                        });
                    });
                }

                return {
                    suggestions: [...fieldSuggestions, ...valueSuggestions],
                };
            },
        });

        // Add custom validation for YAML
        const validateYaml = () => {
            const model = editor.getModel();
            if (!model) return;

            const content = model.getValue();
            const markers: monaco.editor.IMarkerData[] = [];

            // Skip validation for empty or very short content
            if (content.trim().length < 3) {
                monaco.editor.setModelMarkers(model, 'yaml-validator', []);
                return;
            }

            try {
                // Suppress console errors during parsing
                const originalConsoleError = console.error;
                console.error = () => { };

                let parsed;
                try {
                    parsed = yaml.load(content);
                } finally {
                    console.error = originalConsoleError;
                }

                // Additional custom validations only if parsing succeeded
                if (Array.isArray(parsed)) {
                    parsed.forEach((item: any, index: number) => {
                        const lineNumber = getLineNumberForQuestion(content, index);

                        // Check for missing required fields
                        const requiredFields = ['uid', 'author', 'discipline', 'title', 'text', 'questionType', 'themes', 'timeLimit', 'difficulty', 'gradeLevel'];
                        requiredFields.forEach(field => {
                            if (!item[field]) {
                                markers.push({
                                    severity: monaco.MarkerSeverity.Warning,
                                    startLineNumber: lineNumber,
                                    startColumn: 1,
                                    endLineNumber: lineNumber,
                                    endColumn: 100,
                                    message: `Missing required field: ${field}`
                                });
                            }
                        });

                        // Validate questionType-specific requirements
                        if (item.questionType === 'numeric' && typeof item.correctAnswer !== 'number') {
                            markers.push({
                                severity: monaco.MarkerSeverity.Error,
                                startLineNumber: lineNumber,
                                startColumn: 1,
                                endLineNumber: lineNumber,
                                endColumn: 100,
                                message: 'Numeric questions require correctAnswer (number)'
                            });
                        } else if ((item.questionType === 'single_choice' || item.questionType === 'multiple_choice')) {
                            if (!Array.isArray(item.answerOptions)) {
                                markers.push({
                                    severity: monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: 1,
                                    endLineNumber: lineNumber,
                                    endColumn: 100,
                                    message: 'Multiple choice questions require answerOptions array'
                                });
                            }
                            if (!Array.isArray(item.correctAnswers)) {
                                markers.push({
                                    severity: monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: 1,
                                    endLineNumber: lineNumber,
                                    endColumn: 100,
                                    message: 'Multiple choice questions require correctAnswers array'
                                });
                            }
                        }
                    });
                }
            } catch (e: any) {
                // Only show marker for YAML parsing errors, don't log to console
                if (e.mark) {
                    markers.push({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: e.mark.line + 1,
                        startColumn: e.mark.column + 1,
                        endLineNumber: e.mark.line + 1,
                        endColumn: Math.min(e.mark.column + 20, 200),
                        message: e.message || 'YAML syntax error'
                    });
                }
                // Silently ignore other validation errors while user is typing
            }

            monaco.editor.setModelMarkers(model, 'yaml-validator', markers);
        };

        // Validate on mount and on change
        validateYaml();
        editor.onDidChangeModelContent(() => {
            setTimeout(validateYaml, 300); // Debounce validation - increased to 300ms
        });

        // Focus editor
        editor.focus();
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            const position = editorRef.current?.getPosition();
            const cursorPosition = position ? editorRef.current?.getModel()?.getOffsetAt(position) : undefined;
            onChange(value, cursorPosition);
        }
    };

    // Helper to get approximate line number for a question in array
    const getLineNumberForQuestion = (content: string, questionIndex: number): number => {
        const lines = content.split('\n');
        let questionCount = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('- uid:')) {
                questionCount++;
                if (questionCount === questionIndex) {
                    return i + 1;
                }
            }
        }

        return 1;
    };

    return (
        <div className="h-full border border-input rounded-md overflow-hidden relative">
            <Editor
                height="100%"
                defaultLanguage="yaml"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs"
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    rulers: [],
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    formatOnPaste: false,
                    formatOnType: false,
                    // Enable autocomplete
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: true,
                    },
                    suggest: {
                        showWords: false,
                        showSnippets: true,
                        snippetsPreventQuickSuggestions: false,
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    // Disable browser spellcheck
                    'semanticHighlighting.enabled': true,
                }}
            />
        </div>
    );
};
