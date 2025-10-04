"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Edit, Menu } from 'lucide-react';
import { EditorQuestion, createEmptyQuestion } from './types';
import { QuestionList } from './components/QuestionList';
import { QuestionEditor } from './components/QuestionEditor';
import { QuestionPreview } from './components/QuestionPreview';
import { MobileTabs } from './components/MobileTabs';
import { ImportExportControls } from './components/ImportExportControls';
import { getQuestionIndexFromCursor } from './utils';
import { loadMetadata } from './utils/metadata';
import { ParsedMetadata } from './types/metadata';
import yaml from 'js-yaml';

/**
 * Teacher Question Editor Page
 *
 * Allows teachers to edit question files with live preview.
 * Accessible only to users with "Teacher" role (enforced by middleware).
 */

export default function TeacherQuestionEditorPageClient() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('mq_sidebar_collapsed') === '1';
        } catch (e) {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('mq_sidebar_collapsed', sidebarCollapsed ? '1' : '0');
        } catch (e) {
            // ignore
        }
    }, [sidebarCollapsed]);

    // Auto-collapse when the main content area becomes too narrow (accounts for global app nav)
    const mainRef = useRef<HTMLDivElement | null>(null);
    const [sidebarForcedCollapsed, setSidebarForcedCollapsed] = useState(false);

    useEffect(() => {
        const el = mainRef.current;
        if (!el) return;

        const update = () => {
            const w = el.clientWidth;
            // If available width is less than 1100px, force collapse. This threshold can be tuned.
            setSidebarForcedCollapsed(w < 1100);
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    const [yamlText, setYamlText] = useState('');
    const [questions, setQuestions] = useState<EditorQuestion[]>([]);
    const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
    const [editorMode, setEditorMode] = useState<'form' | 'yaml'>('form');
    const [mobileTab, setMobileTab] = useState<'questions' | 'editor' | 'preview'>('questions');
    const [yamlError, setYamlError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);

    // Load metadata on mount
    useEffect(() => {
        loadMetadata().then(setMetadata).catch(err => {
            console.error('Failed to load metadata:', err);
        });
    }, []);

    // Parse YAML to get questions
    const parseYamlToQuestions = (yamlContent: string): EditorQuestion[] => {
        if (!yamlContent.trim()) {
            return [createEmptyQuestion()];
        }

        // Let YAML parsing errors propagate - they will be caught by handleYamlChange
        const parsed = yaml.load(yamlContent);

        if (Array.isArray(parsed)) {
            return parsed.map((item: any, index: number) => {
                // Validate required fields
                if (!item || typeof item !== 'object') {
                    console.warn('Invalid question item at index', index, item);
                    return createEmptyQuestion();
                }

                if (item.questionType === 'numeric') {
                    return {
                        uid: item.uid || `question-${Date.now()}-${index}`,
                        author: item.author || '',
                        discipline: item.discipline || '',
                        title: item.title || '',
                        text: item.text || '',
                        questionType: 'numeric' as const,
                        themes: Array.isArray(item.themes) ? item.themes : [],
                        tags: Array.isArray(item.tags) ? item.tags : [],
                        timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                        difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                        gradeLevel: item.gradeLevel || 'CE1',
                        correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
                        explanation: item.explanation || '',
                        feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                    };
                } else {
                    return {
                        uid: item.uid || `question-${Date.now()}-${index}`,
                        author: item.author || '',
                        discipline: item.discipline || '',
                        title: item.title || '',
                        text: item.text || '',
                        questionType: item.questionType || 'single_choice',
                        themes: Array.isArray(item.themes) ? item.themes : [],
                        tags: Array.isArray(item.tags) ? item.tags : [],
                        timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                        difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                        gradeLevel: item.gradeLevel || 'CE1',
                        answerOptions: Array.isArray(item.answerOptions) ? item.answerOptions : ['Réponse 1', 'Réponse 2'],
                        correctAnswers: Array.isArray(item.correctAnswers) ? item.correctAnswers : [true, false],
                        explanation: item.explanation || '',
                        feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                    };
                }
            });
        } else if (parsed && typeof parsed === 'object') {
            // Single question object
            const item = parsed as any;
            if (item.questionType === 'numeric') {
                return [{
                    uid: item.uid || `question-${Date.now()}`,
                    author: item.author || '',
                    discipline: item.discipline || '',
                    title: item.title || '',
                    text: item.text || '',
                    questionType: 'numeric' as const,
                    themes: Array.isArray(item.themes) ? item.themes : [],
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                    difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                    gradeLevel: item.gradeLevel || 'CE1',
                    correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
                    explanation: item.explanation || '',
                    feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                }];
            } else {
                return [{
                    uid: item.uid || `question-${Date.now()}`,
                    author: item.author || '',
                    discipline: item.discipline || '',
                    title: item.title || '',
                    text: item.text || '',
                    questionType: item.questionType || 'single_choice',
                    themes: Array.isArray(item.themes) ? item.themes : [],
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                    difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                    gradeLevel: item.gradeLevel || 'CE1',
                    answerOptions: Array.isArray(item.answerOptions) ? item.answerOptions : ['Réponse 1', 'Réponse 2'],
                    correctAnswers: Array.isArray(item.correctAnswers) ? item.correctAnswers : [true, false],
                    explanation: item.explanation || '',
                    feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                }];
            }
        } else {
            console.warn('Parsed YAML is neither array nor object:', parsed);
            return [createEmptyQuestion()];
        }
    };

    // Convert questions to YAML
    const questionsToYaml = (questionsList: EditorQuestion[]): string => {
        const yamlData = questionsList.map(q => ({
            uid: q.uid,
            author: q.author || 'Teacher',
            discipline: q.discipline || 'Unknown',
            title: q.title || '',
            text: q.text,
            questionType: q.questionType,
            themes: q.themes || [],
            tags: q.tags || [],
            timeLimit: q.timeLimit || 30,
            difficulty: q.difficulty || 1,
            gradeLevel: q.gradeLevel || 'CE1',
            explanation: q.explanation || '',
            feedbackWaitTime: q.feedbackWaitTime || 15,
            ...(q.questionType === 'numeric'
                ? { correctAnswer: q.correctAnswer }
                : {
                    answerOptions: q.answerOptions,
                    correctAnswers: q.correctAnswers,
                }
            ),
        }));

        // Convert to YAML with two newlines between questions
        const yamlString = yaml.dump(yamlData);
        // Replace single newline before "- uid:" (start of new question) with two newlines
        return yamlString.replace(/\n- uid:/g, '\n\n- uid:');
    };

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('question-editor-yaml');
        if (saved) {
            try {
                setYamlText(saved);
                const parsedQuestions = parseYamlToQuestions(saved);
                setQuestions(parsedQuestions);
            } catch (e) {
                console.error('Failed to load saved YAML data:', e);
                const defaultQuestion = createEmptyQuestion();
                setQuestions([defaultQuestion]);
                setYamlText(questionsToYaml([defaultQuestion]));
            }
        } else {
            const defaultQuestion = createEmptyQuestion();
            setQuestions([defaultQuestion]);
            setYamlText(questionsToYaml([defaultQuestion]));
        }
    }, []);

    // Autosave to localStorage
    useEffect(() => {
        if (yamlText) {
            localStorage.setItem('question-editor-yaml', yamlText);
        }
    }, [yamlText]);

    const handleSelectQuestion = (index: number) => {
        setSelectedQuestionIndex(index);
        setMobileTab('editor');
    };

    const handleAddQuestion = () => {
        const newQuestion = createEmptyQuestion();
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        setYamlText(questionsToYaml(updatedQuestions));
        setSelectedQuestionIndex(updatedQuestions.length - 1);
        setMobileTab('editor');
    };

    const handleDeleteQuestion = (index: number) => {
        if (questions.length <= 1) {
            alert('Vous devez garder au moins une question.');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            setYamlText(questionsToYaml(updatedQuestions));

            if (selectedQuestionIndex === index) {
                setSelectedQuestionIndex(Math.max(0, index - 1));
            } else if (selectedQuestionIndex > index) {
                setSelectedQuestionIndex(selectedQuestionIndex - 1);
            }
        }
    };

    const handleQuestionChange = (updatedQuestion: EditorQuestion) => {
        // Handle question type conversion if the type has changed
        const currentQuestion = questions[selectedQuestionIndex];
        let finalQuestion = updatedQuestion;

        if (currentQuestion.questionType !== updatedQuestion.questionType) {
            // Converting from numeric to choice type
            if (currentQuestion.questionType === 'numeric' &&
                (updatedQuestion.questionType === 'single_choice' || updatedQuestion.questionType === 'multiple_choice')) {
                finalQuestion = {
                    ...updatedQuestion,
                    questionType: updatedQuestion.questionType,
                    answerOptions: ['Réponse 1', 'Réponse 2', 'Réponse 3', 'Réponse 4'],
                    correctAnswers: [true, false, false, false],
                } as EditorQuestion;
            }
            // Converting from choice type to numeric
            else if ((currentQuestion.questionType === 'single_choice' || currentQuestion.questionType === 'multiple_choice') &&
                updatedQuestion.questionType === 'numeric') {
                finalQuestion = {
                    ...updatedQuestion,
                    questionType: 'numeric',
                    correctAnswer: 0,
                } as EditorQuestion;
            }
            // Converting between single_choice and multiple_choice
            else if (currentQuestion.questionType !== updatedQuestion.questionType &&
                (currentQuestion.questionType === 'single_choice' || currentQuestion.questionType === 'multiple_choice') &&
                (updatedQuestion.questionType === 'single_choice' || updatedQuestion.questionType === 'multiple_choice')) {
                // Keep existing answers but adjust correctAnswers for single_choice
                if (updatedQuestion.questionType === 'single_choice' && 'correctAnswers' in currentQuestion) {
                    const firstCorrectIndex = currentQuestion.correctAnswers.findIndex(a => a);
                    const newCorrectAnswers = currentQuestion.correctAnswers.map((_, i) => i === firstCorrectIndex);
                    finalQuestion = {
                        ...updatedQuestion,
                        answerOptions: currentQuestion.answerOptions,
                        correctAnswers: newCorrectAnswers,
                    } as EditorQuestion;
                }
            }
        }

        const updatedQuestions = questions.map((q, i) => i === selectedQuestionIndex ? finalQuestion : q);
        setQuestions(updatedQuestions);
        setYamlText(questionsToYaml(updatedQuestions));
    };

    const handleYamlChange = (newYamlText: string, cursorPosition?: number) => {
        setYamlText(newYamlText);

        try {
            // Parse the new YAML to update questions
            const updatedQuestions = parseYamlToQuestions(newYamlText);

            // Only update questions if parsing was successful and returned valid questions
            if (updatedQuestions && updatedQuestions.length > 0) {
                setQuestions(updatedQuestions);
                setYamlError(null); // Clear any previous errors

                // If cursor position is provided, determine which question it corresponds to
                if (cursorPosition !== undefined) {
                    const questionIndex = getQuestionIndexFromCursor(newYamlText, cursorPosition);
                    if (questionIndex !== -1 && questionIndex < updatedQuestions.length) {
                        setSelectedQuestionIndex(questionIndex);
                    }
                }
            }
        } catch (error) {
            // Set error message but don't crash - let user continue editing
            // Keep the current questions array unchanged
            const errorMessage = error instanceof Error ? error.message : 'Invalid YAML format';
            setYamlError(errorMessage);
            // Don't log to console - errors are shown in UI
        }
    };

    const handleImport = (importedQuestions: EditorQuestion[]) => {
        setQuestions(importedQuestions);
        setYamlText(questionsToYaml(importedQuestions));
        if (importedQuestions.length > 0) {
            setSelectedQuestionIndex(0);
        }
    };

    const selectedQuestion = questions[selectedQuestionIndex];

    const mobileTabs = [
        { id: 'questions', label: 'Questions' },
        { id: 'editor', label: 'Édition' },
        { id: 'preview', label: 'Aperçu' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
            {/* Header */}
            <div className="bg-card border-b-2 border-primary/20 shadow-md px-6 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
                            <Edit className="w-4 h-4 text-primary-foreground" aria-hidden />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Éditeur de Questions
                        </h1>
                    </div>

                    {/* Desktop import/export controls (hidden on small screens) */}
                    <div className="hidden md:flex">
                        <ImportExportControls
                            questions={questions}
                            onImport={handleImport}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Tabs */}
            <MobileTabs
                tabs={mobileTabs}
                activeTab={mobileTab}
                onTabChange={(tab) => setMobileTab(tab as typeof mobileTab)}
            />

            {/* Main Layout */}
            <div className="h-[calc(100vh-73px-48px-64px)] md:h-[calc(100vh-85px)] p-4">
                {/** Compute grid template columns: left (collapsed or full), center flex, preview clamp **/}
                {(() => {
                    const effectiveCollapsed = sidebarCollapsed || sidebarForcedCollapsed;
                    const left = effectiveCollapsed ? '4rem' : '18rem';
                    const gridTemplate = `${left} minmax(0, 1fr) minmax(14rem, 20rem)`;
                    return (
                        <div ref={mainRef} className="grid gap-2 h-full" style={{ gridTemplateColumns: gridTemplate }}>
                            {/* Left Sidebar - Question List */}
                            <div className={`${mobileTab === 'questions' ? 'block' : 'hidden md:block'} bg-transparent relative h-full flex`}>
                                <div className="h-full w-full">
                                    <QuestionList
                                        questions={questions}
                                        selectedQuestionIndex={selectedQuestionIndex}
                                        onSelectQuestion={handleSelectQuestion}
                                        onAddQuestion={handleAddQuestion}
                                        onDeleteQuestion={handleDeleteQuestion}
                                        sidebarCollapsed={effectiveCollapsed}
                                        onToggleSidebar={() => setSidebarCollapsed(s => !s)}
                                    />
                                </div>
                            </div>

                            {/* Center - Editor */}
                            <div className={`min-w-0 overflow-hidden ${mobileTab === 'editor' ? 'block' : 'hidden md:block'}`}>
                                {selectedQuestion && metadata ? (
                                    <QuestionEditor
                                        question={selectedQuestion}
                                        onChange={handleQuestionChange}
                                        mode={editorMode}
                                        onModeChange={setEditorMode}
                                        yamlText={yamlText}
                                        onYamlChange={handleYamlChange}
                                        selectedQuestionIndex={selectedQuestionIndex}
                                        yamlError={yamlError}
                                        metadata={metadata}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-card rounded-lg shadow-md border border-border">
                                        <div className="text-center">
                                            <div className="text-4xl mb-3">🤔</div>
                                            <p className="text-base font-medium">
                                                {!metadata ? 'Chargement des métadonnées...' : 'Sélectionnez une question pour commencer'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right - Preview */}
                            <div className={`${mobileTab === 'preview' ? 'block' : 'hidden md:block'} overflow-hidden`}>
                                {selectedQuestion ? (
                                    <QuestionPreview
                                        question={selectedQuestion}
                                        questionIndex={selectedQuestionIndex + 1}
                                        totalQuestions={questions.length}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-card rounded-lg shadow-md border border-border">
                                        <div className="text-center">
                                            <div className="text-4xl mb-3">👁️</div>
                                            <p className="text-base font-medium">Aucun aperçu disponible</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Mobile FABs for import/export (visible only on small screens) */}
            <div className="md:hidden fixed right-4 bottom-6 z-50">
                <div className="bg-card p-2 rounded-xl shadow-md">
                    <ImportExportControls questions={questions} onImport={handleImport} />
                </div>
            </div>
        </div>
    );
}