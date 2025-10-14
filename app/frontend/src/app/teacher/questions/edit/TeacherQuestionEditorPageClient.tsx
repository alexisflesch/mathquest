"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Menu } from 'lucide-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import InfoModal from '@/components/SharedModal';
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
            const contentWidth = el.clientWidth;
            // If available content width is less than 1100px, force collapse.
            setSidebarForcedCollapsed(contentWidth < 1100);

            // Use the viewport width (window.innerWidth) to decide whether we
            // are in a mobile viewport or should stack the layout. This avoids
            // stacking panels simply because the content area is narrower when
            // the global app sidebar is visible.
            const viewportW = window.innerWidth;
            setIsMobileWidth(viewportW <= 768);
            setIsStackedWidth(viewportW < 900);
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
    // Imperative ref for Monaco editor
    const editorImperativeRef = useRef<any>(null);
    // If the user selects a question while the editor is not mounted, store uid to reveal once ready
    const pendingRevealUidRef = useRef<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'questions' | 'editor' | 'preview'>('questions');
    const [yamlError, setYamlError] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);
    // Initialize from the viewport to reduce layout flicker on mount.
    const [isMobileWidth, setIsMobileWidth] = useState<boolean>(() => {
        if (typeof window !== 'undefined') return window.innerWidth <= 768;
        return false;
    });
    // When the main content area is narrow but not strictly mobile, we want to
    // stack the panels vertically instead of keeping a 3-column grid. This
    // prevents hidden columns from compressing visible content.
    const [isStackedWidth, setIsStackedWidth] = useState<boolean>(false);

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

    // Load from localStorage on mount. If none exists, create the first question and persist it.
    useEffect(() => {
        try {
            const saved = localStorage.getItem('question-editor-yaml');
            if (saved) {
                try {
                    // Try parsing here to validate
                    yaml.load(saved);
                } catch (parseErr: any) {
                    console.warn('yaml.load parse error:', (parseErr && parseErr.message) || parseErr);
                }

                try {
                    setYamlText(saved);
                    const parsedQuestions = parseYamlToQuestions(saved);
                    setQuestions(parsedQuestions);
                } catch (e) {
                    // If parsing failed, create a default question for the in-memory editor
                    // but DO NOT overwrite the user's saved YAML in localStorage. Overwriting
                    // would cause data loss if the user had typed something invalid and
                    // then refreshed. Keep the invalid saved YAML intact so users can recover.
                    console.error('Failed to load saved YAML data:', e);
                    const defaultQuestion = createEmptyQuestion();
                    const yamlForDefault = questionsToYaml([defaultQuestion]);
                    setQuestions([defaultQuestion]);
                    setYamlText(yamlForDefault);
                    // Intentionally do not call localStorage.setItem here.
                }
            } else {
                const defaultQuestion = createEmptyQuestion();
                const yamlForDefault = questionsToYaml([defaultQuestion]);
                setQuestions([defaultQuestion]);
                setYamlText(yamlForDefault);
                try {
                    localStorage.setItem('question-editor-yaml', yamlForDefault);
                } catch (err) {
                    // ignore storage errors
                }
            }
        } catch (err) {
            // localStorage might throw (privacy mode). Fallback to in-memory defaults.
            console.warn('localStorage unavailable when initializing question editor', err);
            const defaultQuestion = createEmptyQuestion();
            setQuestions([defaultQuestion]);
            setYamlText(questionsToYaml([defaultQuestion]));
        }
    }, []);

    // Autosave to localStorage (debounced to avoid blocking main thread on every keystroke)
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                if (yamlText) {
                    localStorage.setItem('question-editor-yaml', yamlText);
                }
            } catch (e) {
                // ignore storage errors
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [yamlText]);

    const handleSelectQuestion = (index: number) => {
        setSelectedQuestionIndex(index);
        setMobileTab('editor');
        // Request the editor to reveal the selected question's uid
        const q = questions[index];
        if (q && q.uid) {
            if (editorImperativeRef.current && typeof editorImperativeRef.current.revealUid === 'function') {
                editorImperativeRef.current.revealUid(q.uid);
            } else {
                pendingRevealUidRef.current = q.uid;
            }
        }
    };

    const handleAddQuestion = () => {
        const newQuestion = createEmptyQuestion();
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        setYamlText(questionsToYaml(updatedQuestions));
        setSelectedQuestionIndex(updatedQuestions.length - 1);
        setMobileTab('editor');
    };

    // Delete flow: open confirmation modal from the UI and perform deletion here
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number | null; isLoading?: boolean }>({ isOpen: false, index: null, isLoading: false });

    const handleDeleteQuestion = (index: number) => {
        if (questions.length <= 1) {
            // Use the confirmation modal for consistency but provide immediate feedback
            setDeleteModal({ isOpen: true, index, isLoading: false });
            return;
        }

        setDeleteModal({ isOpen: true, index, isLoading: false });
    };

    const doConfirmDelete = () => {
        if (deleteModal.index === null) return;

        const index = deleteModal.index;

        // Prevent deleting last item via modal confirmation
        if (questions.length <= 1) {
            // close modal and do nothing
            setDeleteModal({ isOpen: false, index: null, isLoading: false });
            return;
        }

        setDeleteModal(prev => ({ ...prev, isLoading: true }));

        // perform deletion
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
        setYamlText(questionsToYaml(updatedQuestions));

        if (selectedQuestionIndex === index) {
            setSelectedQuestionIndex(Math.max(0, index - 1));
        } else if (selectedQuestionIndex > index) {
            setSelectedQuestionIndex(selectedQuestionIndex - 1);
        }

        setDeleteModal({ isOpen: false, index: null, isLoading: false });
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
        // Only reflect back to YAML when in YAML mode; when in Form mode we debounce
        if (editorMode === 'yaml') {
            setYamlText(questionsToYaml(updatedQuestions));
        } else {
            // Debounce YAML sync to avoid tight loops while typing in form
            window.clearTimeout((handleQuestionChange as any)._debounce);
            (handleQuestionChange as any)._debounce = window.setTimeout(() => {
                setYamlText(prev => questionsToYaml(updatedQuestions));
            }, 250);
        }
        // If the edited question is the current selection, ask editor to reveal its uid
        if (updatedQuestions[selectedQuestionIndex] && editorImperativeRef.current && typeof editorImperativeRef.current.revealUid === 'function') {
            editorImperativeRef.current.revealUid(updatedQuestions[selectedQuestionIndex].uid);
        }
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
                        // Ensure preview switches to this question
                        setMobileTab('editor');
                    } else {
                        // If cursor position is invalid (e.g., at end after paste), select the last question
                        const lastQuestionIndex = updatedQuestions.length - 1;
                        setSelectedQuestionIndex(lastQuestionIndex);
                        setMobileTab('editor');
                        // Position cursor at the last question
                        if (updatedQuestions[lastQuestionIndex] && editorImperativeRef.current && typeof editorImperativeRef.current.revealUid === 'function') {
                            editorImperativeRef.current.revealUid(updatedQuestions[lastQuestionIndex].uid);
                        }
                    }
                } else {
                    // If no cursor position provided (e.g., programmatic change), select the last question
                    const lastQuestionIndex = updatedQuestions.length - 1;
                    setSelectedQuestionIndex(lastQuestionIndex);
                    setMobileTab('editor');
                    // Position cursor at the last question
                    if (updatedQuestions[lastQuestionIndex] && editorImperativeRef.current && typeof editorImperativeRef.current.revealUid === 'function') {
                        editorImperativeRef.current.revealUid(updatedQuestions[lastQuestionIndex].uid);
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

    // Compute per-question problems to show badges in the question list
    // Problem format: { type: 'error'|'warning', message: string }
    const problemsByQuestion = React.useMemo(() => {
        // Try to parse the raw YAML so we detect missing fields exactly like Monaco's validation
        try {
            const parsed = yaml.load(yamlText);

            if (!Array.isArray(parsed)) {
                // If parsing doesn't produce an array, return empty problems (Monaco will show parse markers)
                return questions.map(() => []);
            }

            // Initialize rawProblems array aligned to the parsed length (we'll later align to `questions`)
            const rawProblems: Array<Array<{ type: 'error' | 'warning'; message: string }>> = parsed.map(() => []);

            // Build uid count from parsed items
            const uidCount: Record<string, number> = {};
            parsed.forEach((item: any) => {
                if (item && typeof item === 'object' && item.uid) uidCount[item.uid] = (uidCount[item.uid] || 0) + 1;
            });

            // Required fields (match Monaco's list)
            const requiredFields = ['uid', 'author', 'discipline', 'title', 'text', 'questionType', 'themes', 'timeLimit', 'difficulty', 'gradeLevel'];

            parsed.forEach((item: any, i: number) => {
                if (!item || typeof item !== 'object') {
                    rawProblems[i].push({ type: 'error', message: 'Entrée de question invalide' });
                    return;
                }

                // Missing required fields -> ERROR (treat missing required fields as errors)
                requiredFields.forEach((f) => {
                    if (!(f in item) || item[f] === undefined || item[f] === null || item[f] === '') {
                        rawProblems[i].push({ type: 'error', message: `Champ manquant : ${f}` });
                    }
                });

                // Duplicate uid -> error
                if (item.uid && uidCount[item.uid] > 1) {
                    rawProblems[i].push({ type: 'error', message: 'uid non unique' });
                }

                // Type-specific checks
                if (item.questionType === 'numeric') {
                    if (typeof item.correctAnswer !== 'number') {
                        rawProblems[i].push({ type: 'error', message: 'correctAnswer manquant ou invalide' });
                    } else if (item.correctAnswer < 0) {
                        rawProblems[i].push({ type: 'warning', message: 'Réponse numérique négative' });
                    }
                } else if (item.questionType === 'single_choice' || item.questionType === 'multiple_choice') {
                    if (!Array.isArray(item.correctAnswers)) {
                        rawProblems[i].push({ type: 'error', message: "correctAnswers manquant" });
                    } else {
                        const trueCount = item.correctAnswers.filter(Boolean).length;
                        if (item.questionType === 'multiple_choice' && trueCount <= 1) {
                            rawProblems[i].push({ type: 'warning', message: 'QCM avec une seule réponse correcte' });
                        }
                        if (item.questionType === 'single_choice' && trueCount !== 1) {
                            rawProblems[i].push({ type: 'error', message: 'QCU doit avoir exactement une réponse correcte' });
                        }
                    }
                }
            });

            // Align rawProblems to the current `questions` array so the UI can reliably
            // look up problems by the question index. Prefer matching by uid when possible,
            // falling back to positional mapping when uid is missing.
            const problemsByUid: Record<string, Array<{ type: 'error' | 'warning'; message: string }>> = {};
            rawProblems.forEach((arr, i) => {
                const item = parsed[i];
                const key = item && item.uid ? String(item.uid) : `__idx_${i}`;
                problemsByUid[key] = arr;
            });

            const aligned: Array<Array<{ type: 'error' | 'warning'; message: string }>> = questions.map((q, i) => {
                const keyByUid = q && q.uid ? String(q.uid) : undefined;
                if (keyByUid && problemsByUid[keyByUid]) return problemsByUid[keyByUid];
                // fallback to positional mapping if uid didn't match
                const posKey = `__idx_${i}`;
                return problemsByUid[posKey] || [];
            });

            return aligned;
        } catch (e) {
            // If YAML is invalid, Monaco will show markers; in this case we don't add per-question problems because parsing failed.
            return questions.map(() => []);
        }
    }, [questions, yamlText]);

    const mobileTabs = [
        { id: 'questions', label: 'Questions' },
        { id: 'editor', label: 'Édition' },
        { id: 'preview', label: 'Aperçu' },
    ];

    // We'll compute the main container height dynamically by measuring the
    // visible top bars and FAB so the content fits without producing a page
    // scrollbar on small viewports. We attach a ref to the page header so
    // measurements are reliable instead of querying fragile selectors.
    const mobileTabsRef = useRef<HTMLDivElement | null>(null);
    const mobileFabRef = useRef<HTMLDivElement | null>(null);
    const pageHeaderRef = useRef<HTMLDivElement | null>(null);
    const [mainContainerInlineHeight, setMainContainerInlineHeight] = useState<string | undefined>(() => {
        if (typeof window !== 'undefined') return undefined;
        return undefined;
    });

    const computeMainHeight = () => {
        if (typeof window === 'undefined') return;

        const viewportH = window.innerHeight;
        // Try to measure a top-level header if it exists in the DOM.
        const topHeader = document.querySelector('header') as HTMLElement | null;
        const topHeaderH = topHeader ? topHeader.clientHeight : 0;
        // Prefer the explicit page header ref (more reliable than selector matching)
        const pageHeaderH = pageHeaderRef.current ? pageHeaderRef.current.clientHeight : 0;

        if (isMobileWidth) {
            const tabsH = mobileTabsRef.current ? mobileTabsRef.current.clientHeight : 0;
            const fabH = mobileFabRef.current ? mobileFabRef.current.clientHeight : 0;

            // Add a small safety gap
            const safety = 12;
            const reserved = topHeaderH + pageHeaderH + tabsH + fabH + safety;
            setMainContainerInlineHeight(`calc(100vh - ${reserved}px)`);
        } else {
            // Desktop: use the requested 54px reserved height so top/bottom
            // spacing visually matches the desired 54px.
            const reserved = 54;
            setMainContainerInlineHeight(`calc(100vh - ${reserved}px)`);
        }
    };

    useEffect(() => {
        let rafId: number | null = null;
        const throttled = () => {
            if (rafId != null) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                computeMainHeight();
            });
        };
        throttled();
        window.addEventListener('resize', throttled);
        return () => {
            window.removeEventListener('resize', throttled);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [isMobileWidth]);

    // When entering YAML mode (transition), request the editor to go to currently selected question uid
    const prevEditorModeRef = React.useRef(editorMode);
    useEffect(() => {
        const prev = prevEditorModeRef.current;
        if (prev !== 'yaml' && editorMode === 'yaml' && questions[selectedQuestionIndex]) {
            const q = questions[selectedQuestionIndex];
            if (q && editorImperativeRef.current && typeof editorImperativeRef.current.revealUid === 'function') {
                editorImperativeRef.current.revealUid(q.uid);
            }
        }
        prevEditorModeRef.current = editorMode;
    }, [editorMode, selectedQuestionIndex, questions]);

    const handleCursorPosition = (cursorPosition: number) => {
        try {
            const questionIndex = getQuestionIndexFromCursor(yamlText, cursorPosition);
            if (questionIndex !== -1 && questionIndex < questions.length) {
                setSelectedQuestionIndex(questionIndex);
            }
        } catch (e) {
            // ignore
        }
    };

    const handleEditorReady = () => {
        // If there is a pending reveal (user clicked in form mode then switched to YAML), perform it now
        const uid = pendingRevealUidRef.current;
        if (uid && editorImperativeRef.current && typeof editorImperativeRef.current.revealUid === 'function') {
            editorImperativeRef.current.revealUid(uid);
            pendingRevealUidRef.current = null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
            {/* Header - hidden on small viewports to save vertical space */}
            {!isMobileWidth && (
                <div ref={pageHeaderRef} className="bg-card border-b-2 border-primary/20 shadow-md px-6 py-2">
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
            )}

            {/* Mobile Tabs */}
            <div ref={mobileTabsRef}>
                <MobileTabs
                    tabs={mobileTabs}
                    activeTab={mobileTab}
                    onTabChange={(tab) => setMobileTab(tab as typeof mobileTab)}
                />
            </div>

            {/* Main Layout */}
            <div className="pt-5 pb-5 px-4 min-h-0" style={{ height: mainContainerInlineHeight }}>
                {/** Compute grid template columns: left (collapsed or full), center flex, preview clamp **/}
                {(() => {
                    const effectiveCollapsed = sidebarCollapsed || sidebarForcedCollapsed;
                    const left = effectiveCollapsed ? '4rem' : '18rem';

                    // For small screens (mobile), collapse to a single column so hidden panels
                    // (questions/editor/preview) don't take up space behind overlays.
                    // Use the ResizeObserver-driven `isMobileWidth` state (initialized on mount)
                    // instead of reading clientWidth during render.
                    const gridTemplate = isMobileWidth
                        ? '1fr' // single column on mobile
                        : `${left} minmax(0, 1fr) minmax(14rem, 20rem)`;

                    return (
                        <div ref={mainRef} className="grid gap-2 h-full overflow-hidden min-h-0" style={{ gridTemplateColumns: gridTemplate }}>
                            {/* Left Sidebar - Question List */}
                            <div className={`${mobileTab === 'questions' ? 'block' : 'hidden md:block'} bg-transparent relative h-full flex min-h-0`}>
                                <div className="h-full w-full min-h-0">
                                    <QuestionList
                                        questions={questions}
                                        selectedQuestionIndex={selectedQuestionIndex}
                                        onSelectQuestion={handleSelectQuestion}
                                        onAddQuestion={handleAddQuestion}
                                        onDeleteQuestion={handleDeleteQuestion}
                                        problems={problemsByQuestion}
                                        sidebarCollapsed={effectiveCollapsed}
                                        onToggleSidebar={() => setSidebarCollapsed(s => !s)}
                                    />
                                </div>
                            </div>

                            {/* Center - Editor */}
                            <div className={`min-w-0 overflow-hidden min-h-0 ${mobileTab === 'editor' ? 'block' : 'hidden md:block'}`}>
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
                                        editorRef={editorImperativeRef}
                                        onCursorPosition={handleCursorPosition}
                                        onEditorReady={handleEditorReady}
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
                            <div className={`${mobileTab === 'preview' ? 'block' : 'hidden md:block'} overflow-hidden min-h-0`}>
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
            <div ref={mobileFabRef} className="md:hidden fixed right-4 bottom-6 z-50">
                <ImportExportControls questions={questions} onImport={handleImport} compact />
            </div>
            {/* Delete confirmation / info modals */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen && questions.length > 1}
                title="Supprimer la question"
                message={`Êtes-vous sûr de vouloir supprimer la question ${deleteModal.index !== null ? deleteModal.index + 1 : ''} ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                onConfirm={doConfirmDelete}
                onCancel={() => setDeleteModal({ isOpen: false, index: null, isLoading: false })}
                type="danger"
                isLoading={!!deleteModal.isLoading}
            />

            <InfoModal isOpen={deleteModal.isOpen && questions.length <= 1} onClose={() => setDeleteModal({ isOpen: false, index: null, isLoading: false })} title="Suppression impossible">
                <div className="dialog-modal-content">
                    <p>Vous devez garder au moins une question.</p>
                    <div className="dialog-modal-actions">
                        <button className="dialog-modal-btn" onClick={() => setDeleteModal({ isOpen: false, index: null, isLoading: false })}>Fermer</button>
                    </div>
                </div>
            </InfoModal>
        </div>
    );
}