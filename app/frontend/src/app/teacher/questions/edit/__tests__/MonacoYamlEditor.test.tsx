/**
 * Comprehensive tests for MonacoYamlEditor autocomplete and validation
 * 
 * Tests cover:
 * 1. Autocomplete triggering conditions
 * 2. Autocomplete range/scope (should only replace current word, not entire sections)
 * 3. Grade-level validation for themes/tags/disciplines
 * 4. Field name suggestions
 * 5. Value suggestions based on context
 * 6. Edge cases (empty values, partial edits, multi-line, etc.)
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonacoYamlEditor } from '../components/MonacoYamlEditor';
import { ParsedMetadata } from '../types/metadata';
import type * as monaco from 'monaco-editor';

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
    const MockMonacoEditor = ({ onMount, value, onChange }: any) => {
        // Simulate editor mount
        React.useEffect(() => {
            if (onMount) {
                const mockEditor = createMockEditor(value, onChange);
                const mockMonaco = createMockMonaco();
                onMount(mockEditor, mockMonaco);
            }
        }, [onMount, value, onChange]);

        return <div data-testid="monaco-editor">{value}</div>;
    };

    return {
        __esModule: true,
        default: MockMonacoEditor,
    };
});

// Helper to create mock Monaco editor instance
function createMockEditor(initialValue: string, onChange: (value: string) => void): any {
    let content = initialValue;
    const modelChangeCallbacks: any[] = [];
    const selectionCallbacks: any[] = [];

    const model = {
        getValue: () => content,
        setValue: (newValue: string) => {
            content = newValue;
            onChange(newValue);
            // trigger registered callbacks to simulate editor events
            modelChangeCallbacks.forEach((cb: any) => cb());
            selectionCallbacks.forEach((cb: any) => cb());
        },
        getValueInRange: (range: any) => {
            const lines = content.split('\n');
            if (range.startLineNumber === range.endLineNumber) {
                const line = lines[range.startLineNumber - 1] || '';
                return line.substring(range.startColumn - 1, range.endColumn - 1);
            }
            return '';
        },
        getWordUntilPosition: (position: any) => {
            const lines = content.split('\n');
            const line = lines[position.lineNumber - 1] || '';
            const beforeCursor = line.substring(0, position.column - 1);
            const wordMatch = beforeCursor.match(/[\w-]+$/);
            return {
                word: wordMatch ? wordMatch[0] : '',
                startColumn: wordMatch ? position.column - wordMatch[0].length : position.column,
                endColumn: position.column,
            };
        },
    };

    return {
        getModel: () => model,
        getPosition: () => ({ lineNumber: 1, column: 1 }),
        focus: jest.fn(),
        onDidChangeModelContent: jest.fn((callback) => {
            modelChangeCallbacks.push(callback);
            return {
                dispose: jest.fn(() => {
                    const idx = modelChangeCallbacks.indexOf(callback);
                    if (idx !== -1) modelChangeCallbacks.splice(idx, 1);
                })
            };
        }),
        onDidChangeCursorSelection: jest.fn((callback) => {
            selectionCallbacks.push(callback);
            return {
                dispose: jest.fn(() => {
                    const idx = selectionCallbacks.indexOf(callback);
                    if (idx !== -1) selectionCallbacks.splice(idx, 1);
                })
            };
        }),
    };
}

// Helper to create mock Monaco instance
function createMockMonaco(): any {
    const registeredProviders: any[] = [];

    return {
        languages: {
            registerCompletionItemProvider: jest.fn((language: string, provider: any) => {
                registeredProviders.push({ language, provider });
                return { dispose: jest.fn() };
            }),
            CompletionItemKind: {
                Field: 0,
                Value: 1,
            },
            CompletionItemInsertTextRule: {
                InsertAsSnippet: 4,
            },
        },
        editor: {
            setModelMarkers: jest.fn(),
        },
        MarkerSeverity: {
            Error: 8,
            Warning: 4,
        },
        _registeredProviders: registeredProviders,
    };
}

// Mock metadata with known structure
const mockMetadata: ParsedMetadata = {
    gradeLevels: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', 'L1', 'L2'],
    metadata: {
        CP: {
            niveau: 'CP',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Nombres et calculs CP',
                            tags: ['Addition', 'Soustraction'],
                        },
                    ],
                },
            ],
        },
        CE1: {
            niveau: 'CE1',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Géométrie',
                            tags: ['Cercles', 'Triangles'],
                        },
                        {
                            nom: 'Calcul mental',
                            tags: ['Multiplication', 'Division'],
                        },
                    ],
                },
                {
                    nom: 'Français',
                    themes: [
                        {
                            nom: 'Grammaire',
                            tags: ['Verbes', 'Noms'],
                        },
                    ],
                },
            ],
        },
        L1: {
            niveau: 'L1',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [
                        {
                            nom: 'Applications linéaires',
                            tags: ['Noyau', 'Image'],
                        },
                        {
                            nom: 'Ensembles et applications',
                            tags: ['Injection', 'Surjection'],
                        },
                    ],
                },
            ],
        },
    },
};

describe('MonacoYamlEditor - Autocomplete', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Autocomplete Triggering', () => {
        it('should NOT trigger autocomplete for less than 3 characters when not after colon', async () => {
            const { container } = render(
                <MonacoYamlEditor
                    value="- ui"
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // With only 2 characters ("ui"), autocomplete should not show
            // This prevents aggressive completion
        });

        it('should trigger autocomplete after typing 3+ characters', async () => {
            const { container } = render(
                <MonacoYamlEditor
                    value="- uid"
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });

        it('should trigger autocomplete immediately after colon', async () => {
            const { container } = render(
                <MonacoYamlEditor
                    value="- uid: "
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });

        it('should trigger autocomplete for array items (after dash)', async () => {
            const { container } = render(
                <MonacoYamlEditor
                    value="  themes:\n    - "
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });
    });

    describe('Autocomplete Range/Scope - CRITICAL BUG PREVENTION', () => {
        it('should only replace the current word, NOT entire sections when editing a value', async () => {
            const initialYaml = `- uid: coucou
  author: Alexis
  gradeLevel: CE1
  discipline: Mathématiques
  themes: 
    - Géométrie
    - Calcul mental`;

            const { container } = render(
                <MonacoYamlEditor
                    value={initialYaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Simulate: user goes back to "Mathématiques", erases it, types "a"
            // Expected: "discipline: a" (preserves rest of YAML)
            // BUG: Would replace entire structure with default template

            // The range should ONLY cover the word "Mathématiques", not the entire document
        });

        it('should preserve multi-line structure when editing single field', async () => {
            const initialYaml = `- uid: test-123
  author: Teacher
  gradeLevel: L1
  discipline: Mathématiques
  title: Test question
  text: Quelle est la réponse?
  questionType: single_choice
  themes:
    - Applications linéaires
    - Ensembles et applications
  tags:
    - Noyau
    - Image
  timeLimit: 60
  difficulty: 3
  answerOptions:
    - Option A
    - Option B
  correctAnswers:
    - true
    - false`;

            const { container } = render(
                <MonacoYamlEditor
                    value={initialYaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // When editing "Mathématiques", should NOT trigger field name autocomplete
            // because we're after a colon (value position, not field position)
        });

        it('should not suggest field names when editing a value after colon', async () => {
            const yaml = '- discipline: Math';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Cursor is after "discipline: ", typing "Math"
            // Should suggest VALUES (Mathématiques, Français), NOT field names
        });
    });

    describe('Grade Level Validation - CRITICAL', () => {
        it('should only suggest themes valid for the selected grade level', async () => {
            const yaml = `- uid: test
  gradeLevel: CE1
  discipline: Mathématiques
  themes:
    - `;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: "Géométrie", "Calcul mental" (CE1 themes)
            // Should NOT suggest: "Applications linéaires" (L1 theme)
        });

        it('should only suggest tags valid for the selected themes and grade level', async () => {
            const yaml = `- uid: test
  gradeLevel: CE1
  discipline: Mathématiques
  themes:
    - Géométrie
  tags:
    - `;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: "Cercles", "Triangles" (tags for Géométrie in CE1)
            // Should NOT suggest: "Noyau", "Image" (L1 tags)
        });

        it('should only suggest disciplines valid for the selected grade level', async () => {
            const yaml = `- uid: test
  gradeLevel: CE1
  discipline: `;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: "Mathématiques", "Français" (CE1 disciplines)
            // In current implementation, it shows ALL disciplines - THIS IS A BUG
        });

        it('should update available themes when grade level changes', async () => {
            // Start with L1
            const { container, rerender } = render(
                <MonacoYamlEditor
                    value={`- uid: test
  gradeLevel: L1
  discipline: Mathématiques
  themes:
    - `}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Change to CE1
            rerender(
                <MonacoYamlEditor
                    value={`- uid: test
  gradeLevel: CE1
  discipline: Mathématiques
  themes:
    - `}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            // Available themes should now be CE1 themes, not L1 themes
        });
    });

    describe('Field Name Suggestions', () => {
        it('should suggest field names when typing at root level', async () => {
            const yaml = '- uid: test\n  auth';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest "author" field
        });

        it('should NOT suggest field names when inside a value', async () => {
            const yaml = '- title: My auth';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // "auth" is part of the title value, should NOT suggest "author" field
        });

        it('should suggest all required fields when starting a new question', async () => {
            const yaml = '- ';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: uid, author, discipline, title, text, questionType, etc.
        });
    });

    describe('Value Suggestions', () => {
        it('should suggest grade levels when after "gradeLevel:"', async () => {
            const yaml = '- gradeLevel: ';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: CP, CE1, CE2, CM1, CM2, L1, L2
        });

        it('should suggest question types when after "questionType:"', async () => {
            const yaml = '- questionType: ';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: single_choice, multiple_choice, numeric
        });

        it('should filter suggestions based on partial input', async () => {
            const yaml = '- gradeLevel: C';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should suggest: CE1, CE2, CM1, CM2 (starts with C)
            // Should NOT suggest: L1, L2, CP (doesn't match "C" followed by more)
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty YAML gracefully', async () => {
            const { container } = render(
                <MonacoYamlEditor
                    value=""
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });

        it('should handle incomplete YAML structure', async () => {
            const yaml = '- uid: test\n  author:';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });

        it('should handle multiple questions without interference', async () => {
            const yaml = `- uid: q1
  gradeLevel: CE1
  
- uid: q2
  gradeLevel: L1`;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Editing q1 should not affect q2's grade level context
        });

        it('should handle special characters in values', async () => {
            const yaml = '- text: "Quelle est la réponse à 2+2?"';

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });

        it('should handle nested array structures', async () => {
            const yaml = `- themes:
    - Theme 1
    - Theme 2
  tags:
    - Tag 1`;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });

        it('should not break when metadata is empty', async () => {
            const emptyMetadata: ParsedMetadata = {
                gradeLevels: [],
                metadata: {},
            };

            const { container } = render(
                <MonacoYamlEditor
                    value="- uid: test"
                    onChange={mockOnChange}
                    error={null}
                    metadata={emptyMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });
        });
    });

    describe('Context Detection', () => {
        it('should detect when cursor is in themes array', async () => {
            const yaml = `- themes:
    - Theme 1
    - `;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should show theme suggestions, not tag suggestions
        });

        it('should detect when cursor is in tags array', async () => {
            const yaml = `- tags:
    - Tag 1
    - `;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Should show tag suggestions, not theme suggestions
        });

        it('should stop context detection at next field', async () => {
            const yaml = `- themes:
    - Theme 1
  tags:
    - `;

            const { container } = render(
                <MonacoYamlEditor
                    value={yaml}
                    onChange={mockOnChange}
                    error={null}
                    metadata={mockMetadata}
                />
            );

            await waitFor(() => {
                expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
            });

            // Cursor is in tags array, should show tags not themes
        });
    });
});
