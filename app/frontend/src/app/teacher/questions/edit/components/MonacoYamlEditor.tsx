'use client';

import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import yaml from 'js-yaml';
import { ParsedMetadata } from '../types/metadata';

interface MonacoYamlEditorProps {
    value: string;
    onChange: (value: string, cursorPosition?: number) => void;
    // Notifies parent when cursor/selection moves (offset in document)
    onCursorPosition?: (cursorPosition: number) => void;
    error: string | null;
    metadata: ParsedMetadata;
    // Called when the underlying Monaco editor has been mounted and is ready
    onEditorReady?: () => void;
}

export type MonacoYamlEditorHandle = {
    revealUid: (uid: string) => void;
};

export const MonacoYamlEditor = React.forwardRef<MonacoYamlEditorHandle, MonacoYamlEditorProps>(
    ({ value, onChange, onCursorPosition, error, metadata, onEditorReady }, ref) => {
        const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
        const monacoRef = useRef<Monaco | null>(null);
        const [themeName, setThemeName] = useState<'vs' | 'vs-dark'>('vs');

        useEffect(() => {
            const applyThemeFromDocument = () => {
                try {
                    const applied = document.documentElement.getAttribute('data-theme');
                    const isDark = applied === 'dark';
                    const desired = isDark ? 'vs-dark' : 'vs';
                    setThemeName(desired as 'vs' | 'vs-dark');
                    if (monacoRef.current && monacoRef.current.editor) {
                        monacoRef.current.editor.setTheme(desired);
                    }
                } catch (e) {
                    // ignore
                }
            };

            applyThemeFromDocument();

            const mo = new MutationObserver(() => applyThemeFromDocument());
            mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
            return () => mo.disconnect();
        }, []);

        // Selection change suppression flag used while doing programmatic reveals
        const suppressSelectionNotificationRef = useRef(false);
        const selectionDebounceRef = useRef<number | null>(null);

        // Expose imperative API to parent: revealUid(uid)
        useImperativeHandle(ref, () => ({
            revealUid: (uid: string) => {
                if (!monacoRef.current || !editorRef.current) return;
                try {
                    const editor = editorRef.current!;
                    const model = editor.getModel();
                    if (!model) return;

                    const text = model.getValue();
                    const lines = text.split('\n');
                    let targetLine = -1;

                    for (let i = 0; i < lines.length; i++) {
                        const trimmed = lines[i].trim();
                        if (trimmed.startsWith('- uid:')) {
                            const parts = trimmed.split(':');
                            const uidValue = parts.slice(1).join(':').trim().replace(/^"|"$/g, '');
                            if (uidValue === uid) {
                                targetLine = i + 1;
                                break;
                            }
                        }
                    }

                    if (targetLine === -1) {
                        for (let i = 0; i < lines.length; i++) {
                            if (lines[i].includes(`uid: ${uid}`) || lines[i].includes(`uid: "${uid}"`)) {
                                targetLine = i + 1;
                                break;
                            }
                        }
                    }

                    if (targetLine !== -1) {
                        const position = { lineNumber: targetLine, column: 1 };
                        // Suppress the immediate selection-change notification caused by programmatic movement
                        suppressSelectionNotificationRef.current = true;
                        editor.focus();
                        editor.setPosition(position);
                        editor.revealPositionInCenter(position);

                        // Clear suppression after a short delay so subsequent user moves are reported
                        window.setTimeout(() => {
                            suppressSelectionNotificationRef.current = false;
                        }, 200);
                    }
                } catch (e) {
                    // ignore
                }
            }
        }), []);

        const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;

            // Ensure Monaco uses the current theme on mount
            try {
                const applied = document.documentElement.getAttribute('data-theme');
                const isDark = applied === 'dark';
                const desired = isDark ? 'vs-dark' : 'vs';
                setThemeName(desired as 'vs' | 'vs-dark');
                // Apply to monaco directly as well
                monaco.editor.setTheme(desired);
            } catch (e) {
                // ignore
            }

            // Helper to find the current question's context (gradeLevel, discipline, themes)
            const getCurrentQuestionContext = (fullText: string, currentLine: number): {
                gradeLevel?: string;
                discipline?: string;
                themes: string[];
            } => {
                const lines = fullText.split('\n');
                let gradeLevel: string | undefined;
                let discipline: string | undefined;
                const themes: string[] = [];

                // Scan backwards from current line to find question start and context
                for (let i = currentLine - 1; i >= 0; i--) {
                    const line = lines[i].trim();

                    // Stop at previous question
                    if (i < currentLine - 1 && line.startsWith('- uid:')) {
                        break;
                    }

                    // Extract gradeLevel
                    if (line.startsWith('gradeLevel:')) {
                        const match = line.match(/gradeLevel:\s*(\S+)/);
                        if (match) gradeLevel = match[1];
                    }

                    // Extract discipline
                    if (line.startsWith('discipline:')) {
                        const match = line.match(/discipline:\s*(.+?)$/);
                        if (match) discipline = match[1].trim();
                    }

                    // Extract themes (in themes array)
                    if (line.startsWith('themes:')) {
                        // Scan forward to collect theme items
                        for (let j = i + 1; j < lines.length; j++) {
                            const themeLine = lines[j].trim();
                            if (themeLine.startsWith('- ')) {
                                const theme = themeLine.substring(2).trim();
                                if (theme) themes.push(theme);
                            } else if (themeLine && !themeLine.startsWith('- ')) {
                                break; // End of themes array
                            }
                        }
                    }
                }

                return { gradeLevel, discipline, themes };
            };

            // Register autocomplete provider for YAML
            const completionProvider = monaco.languages.registerCompletionItemProvider('yaml', {
                triggerCharacters: [' ', ':', '\n', '-'],
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

                    // Check for special conditions where we show suggestions immediately
                    const afterColon = textUntilPosition.trim().endsWith(':');
                    const afterColonWithSpace = textUntilPosition.trim().match(/:\s*$/);
                    const inArrayItem = textUntilPosition.trim().startsWith('-');

                    // Show autocomplete if:
                    // 1. Right after ":" or ": " (for value suggestions)
                    // 2. In an array item (starts with -)
                    // 3. Word is at least 3 characters (for field names)
                    if (!afterColon && !afterColonWithSpace && !inArrayItem && word.word.length < 3) {
                        return { suggestions: [] };
                    }

                    const suggestions: monaco.languages.CompletionItem[] = [];
                    const trimmedLine = textUntilPosition.trim();
                    const beforeWord = textUntilPosition.slice(0, -word.word.length);

                    // Get full context for grade-level validation
                    const fullText = model.getValue();
                    const context = getCurrentQuestionContext(fullText, position.lineNumber);

                    // Determine if we're in a value position (after a field name and colon)
                    // CRITICAL: Check the UNTRIMMED line to catch cases like "discipline: " (with trailing space)
                    const lineHasColon = textUntilPosition.includes(':');
                    const colonPosition = textUntilPosition.indexOf(':');
                    const cursorAfterColon = lineHasColon && position.column > colonPosition + 1;
                    const isInValuePosition = lineHasColon && cursorAfterColon;

                    // Field name suggestions (only if NOT in value position and NOT in array)
                    // We're in value position if:
                    // - The line contains a colon
                    // - The cursor is after the colon
                    // - We're typing the value (not the field name)
                    if (!isInValuePosition && !afterColon && !trimmedLine.includes(':') && !inArrayItem) {
                        const fieldSuggestions = [
                            { label: 'uid', insertText: 'uid: $0', doc: 'Unique identifier' },
                            { label: 'author', insertText: 'author: $0', doc: 'Author name' },
                            { label: 'discipline', insertText: 'discipline: $0', doc: 'Academic discipline' },
                            { label: 'title', insertText: 'title: $0', doc: 'Question title' },
                            { label: 'text', insertText: 'text: $0', doc: 'Question text' },
                            { label: 'questionType', insertText: 'questionType: $0', doc: 'Question type' },
                            { label: 'themes', insertText: 'themes: [$0]', doc: 'Themes/topics' },
                            { label: 'tags', insertText: 'tags: [$0]', doc: 'Additional tags' },
                            { label: 'timeLimit', insertText: 'timeLimit: ${0:30}', doc: 'Time limit in seconds' },
                            { label: 'difficulty', insertText: 'difficulty: ${0:1}', doc: 'Difficulty (1-5)' },
                            { label: 'gradeLevel', insertText: 'gradeLevel: $0', doc: 'Grade level' },
                            { label: 'answerOptions', insertText: 'answerOptions: [$0]', doc: 'Answer options (MC)' },
                            { label: 'correctAnswers', insertText: 'correctAnswers: [${0:true}, false]', doc: 'Correct answers (MC)' },
                            { label: 'correctAnswer', insertText: 'correctAnswer: ${0:0}', doc: 'Correct answer (numeric)' },
                            { label: 'explanation', insertText: 'explanation: $0', doc: 'Explanation text' },
                            { label: 'feedbackWaitTime', insertText: 'feedbackWaitTime: ${0:15}', doc: 'Feedback duration (sec)' },
                            { label: 'excludedFrom', insertText: 'excludedFrom: [$0]', doc: 'Exclude from question types' },
                        ];

                        fieldSuggestions.forEach(field => {
                            if (field.label.toLowerCase().includes(word.word.toLowerCase())) {
                                suggestions.push({
                                    label: field.label,
                                    kind: monaco.languages.CompletionItemKind.Field,
                                    documentation: field.doc,
                                    insertText: field.insertText,
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    range: range,
                                    sortText: `0_${field.label}`,
                                });
                            }
                        });
                    }

                    // Value suggestions based on field context

                    // questionType values
                    if (beforeWord.includes('questionType:')) {
                        ['single_choice', 'multiple_choice', 'numeric'].forEach(type => {
                            suggestions.push({
                                label: type,
                                kind: monaco.languages.CompletionItemKind.Value,
                                documentation: `Question type: ${type}`,
                                insertText: type,
                                range: range,
                                sortText: `1_${type}`,
                            });
                        });
                    }

                    // gradeLevel values from metadata
                    if (beforeWord.includes('gradeLevel:')) {
                        metadata.gradeLevels.forEach(level => {
                            suggestions.push({
                                label: level,
                                kind: monaco.languages.CompletionItemKind.Value,
                                documentation: `Grade level: ${level}`,
                                insertText: level,
                                range: range,
                                sortText: `1_${level}`,
                            });
                        });
                    }

                    // discipline values from metadata - FILTERED BY GRADE LEVEL
                    if (beforeWord.includes('discipline:') && context.gradeLevel) {
                        const levelData = metadata.metadata[context.gradeLevel];
                        if (levelData) {
                            levelData.disciplines.forEach(disc => {
                                suggestions.push({
                                    label: disc.nom,
                                    kind: monaco.languages.CompletionItemKind.Value,
                                    documentation: `Discipline: ${disc.nom} (${context.gradeLevel})`,
                                    insertText: disc.nom,
                                    range: range,
                                    sortText: `1_${disc.nom}`,
                                });
                            });
                        }
                    }

                    // Check if we're in themes/tags array
                    const lines = fullText.split('\n');
                    let inThemesArray = false;
                    let inTagsArray = false;

                    for (let i = position.lineNumber - 1; i >= 0; i--) {
                        const line = lines[i];
                        if (line.trim().startsWith('themes:')) {
                            inThemesArray = true;
                            break;
                        }
                        if (line.trim().startsWith('tags:')) {
                            inTagsArray = true;
                            break;
                        }
                        if (line.trim().startsWith('- uid:') || (line.includes(':') && !line.trim().startsWith('-'))) {
                            break;
                        }
                    }

                    // themes values from metadata - FILTERED BY GRADE LEVEL AND DISCIPLINE
                    if (inThemesArray && inArrayItem && context.gradeLevel && context.discipline) {
                        const levelData = metadata.metadata[context.gradeLevel];
                        if (levelData) {
                            const disciplineData = levelData.disciplines.find(d => d.nom === context.discipline);
                            if (disciplineData) {
                                disciplineData.themes.forEach(theme => {
                                    suggestions.push({
                                        label: theme.nom,
                                        kind: monaco.languages.CompletionItemKind.Value,
                                        documentation: `Theme: ${theme.nom} (${context.gradeLevel} - ${context.discipline})`,
                                        insertText: theme.nom,
                                        range: range,
                                        sortText: `1_${theme.nom}`,
                                    });
                                });
                            }
                        }
                    }

                    // tags values from metadata - FILTERED BY GRADE LEVEL, DISCIPLINE, AND THEMES
                    if (inTagsArray && inArrayItem && context.gradeLevel && context.discipline && context.themes.length > 0) {
                        const levelData = metadata.metadata[context.gradeLevel];
                        if (levelData) {
                            const disciplineData = levelData.disciplines.find(d => d.nom === context.discipline);
                            if (disciplineData) {
                                const allTags = new Set<string>();
                                context.themes.forEach(themeName => {
                                    const themeData = disciplineData.themes.find(t => t.nom === themeName);
                                    if (themeData) {
                                        themeData.tags.forEach(tag => allTags.add(tag));
                                    }
                                });

                                Array.from(allTags).sort().forEach(tag => {
                                    suggestions.push({
                                        label: tag,
                                        kind: monaco.languages.CompletionItemKind.Value,
                                        documentation: `Tag: ${tag} (for selected themes)`,
                                        insertText: tag,
                                        range: range,
                                        sortText: `1_${tag}`,
                                    });
                                });
                            }
                        }
                    }

                    // excludedFrom values
                    if (beforeWord.includes('excludedFrom:') && inArrayItem) {
                        ['tournament', 'quiz', 'practice'].forEach(type => {
                            suggestions.push({
                                label: type,
                                kind: monaco.languages.CompletionItemKind.Value,
                                documentation: `Exclude from: ${type}`,
                                insertText: type,
                                range: range,
                                sortText: `1_${type}`,
                            });
                        });
                    }

                    return { suggestions };
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
                                        // French: "Champ manquant"
                                        message: `Champ manquant : ${field}`
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
                                    message: "Les questions numériques requièrent le champ correctAnswer (nombre)"
                                });
                            } else if ((item.questionType === 'single_choice' || item.questionType === 'multiple_choice')) {
                                if (!Array.isArray(item.answerOptions)) {
                                    markers.push({
                                        severity: monaco.MarkerSeverity.Error,
                                        startLineNumber: lineNumber,
                                        startColumn: 1,
                                        endLineNumber: lineNumber,
                                        endColumn: 100,
                                        message: "Les questions à choix multiple requièrent un tableau 'answerOptions'"
                                    });
                                }
                                if (!Array.isArray(item.correctAnswers)) {
                                    markers.push({
                                        severity: monaco.MarkerSeverity.Error,
                                        startLineNumber: lineNumber,
                                        startColumn: 1,
                                        endLineNumber: lineNumber,
                                        endColumn: 100,
                                        message: "Les questions à choix multiple requièrent un tableau 'correctAnswers'"
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
                            // Show a French parse error message; include original message if present
                            message: e.message ? `Erreur YAML: ${e.message}` : 'Erreur de syntaxe YAML'
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

            // Listen to cursor selection changes and notify parent (debounced)
            const selDisposable = editor.onDidChangeCursorSelection(() => {
                if (!onCursorPosition) return;
                if (suppressSelectionNotificationRef.current) return;

                if (selectionDebounceRef.current) {
                    window.clearTimeout(selectionDebounceRef.current);
                }
                selectionDebounceRef.current = window.setTimeout(() => {
                    const pos = editor.getPosition();
                    const model = editor.getModel();
                    if (pos && model) {
                        const offset = model.getOffsetAt(pos);
                        onCursorPosition(offset);
                    }
                }, 100);
            });

            // Focus editor
            editor.focus();

            // Notify parent that the editor is ready to receive imperative commands
            try {
                if (onEditorReady) onEditorReady();
            } catch (e) {
                // ignore
            }

            // Cleanup selection listener when unmounting
            return () => {
                selDisposable.dispose();
                if (selectionDebounceRef.current) window.clearTimeout(selectionDebounceRef.current);
            };
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
                    theme={themeName}
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
                        // Enable automatic autocomplete after 3 characters
                        quickSuggestions: {
                            other: true,
                            comments: false,
                            strings: true,
                        },
                        quickSuggestionsDelay: 0, // Show immediately when conditions are met
                        suggest: {
                            showWords: false, // Don't suggest random words from document
                            showSnippets: true,
                            snippetsPreventQuickSuggestions: false,
                            filterGraceful: true,
                            localityBonus: true,
                        },
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnCommitCharacter: false, // CRITICAL: Don't auto-accept on typing
                        acceptSuggestionOnEnter: 'on', // Only accept on explicit Enter
                        tabCompletion: 'on',
                        // Disable browser spellcheck
                        'semanticHighlighting.enabled': true,
                    }}
                />
            </div>
        );
    });
