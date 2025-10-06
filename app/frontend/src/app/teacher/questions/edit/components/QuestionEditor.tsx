'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EditorQuestion, isNumericQuestion, isMultipleChoiceQuestion, questionToYaml } from '../types';
import { ParsedMetadata } from '../types/metadata';
import { getDisciplinesForGradeLevel, getThemesForDiscipline, getTagsForThemes } from '../utils/metadata';
import EnhancedSingleSelectDropdown from '@/components/EnhancedSingleSelectDropdown';
import EnhancedMultiSelectDropdown from '@/components/EnhancedMultiSelectDropdown';
import { MonacoYamlEditor } from './MonacoYamlEditor';
import yaml from 'js-yaml';
import {
    FileText,
    Key,
    User,
    Settings,
    Clock,
    Star,
    MessageSquare,
    CheckCircle,
    Lightbulb,
    Timer,
    X,
    FileEdit,
    FileCode,
    CheckCheck,
    AlertCircle
} from 'lucide-react';

interface QuestionEditorProps {
    question: EditorQuestion;
    onChange: (question: EditorQuestion) => void;
    mode: 'form' | 'yaml';
    onModeChange: (mode: 'form' | 'yaml') => void;
    yamlText: string;
    onYamlChange: (yamlText: string, cursorPosition?: number) => void;
    selectedQuestionIndex: number;
    yamlError: string | null;
    metadata: ParsedMetadata;
    // Imperative ref for editor actions
    editorRef?: React.Ref<any>;
    // Called when the editor's cursor/selection moves (offset)
    onCursorPosition?: (cursorPosition: number) => void;
    // Called when the Monaco editor is ready/mounted
    onEditorReady?: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
    question,
    onChange,
    mode,
    onModeChange,
    yamlText,
    onYamlChange,
    selectedQuestionIndex,
    yamlError,
    metadata,
    editorRef,
    onCursorPosition,
    onEditorReady,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Cascading dropdown state
    const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([]);
    const [availableThemes, setAvailableThemes] = useState<string[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    // Update available disciplines when grade level changes
    useEffect(() => {
        if (question.gradeLevel) {
            const disciplines = getDisciplinesForGradeLevel(metadata, question.gradeLevel);
            setAvailableDisciplines(disciplines);

            // Reset discipline only when using the form editor to avoid rewriting YAML edits
            if (mode === 'form' && question.discipline && !disciplines.includes(question.discipline)) {
                onChange({ ...question, discipline: '' });
            }
        } else {
            setAvailableDisciplines([]);
        }
    }, [question.gradeLevel, question.discipline, metadata, mode, onChange]);

    // Update available themes when discipline changes
    useEffect(() => {
        if (question.gradeLevel && question.discipline) {
            const themes = getThemesForDiscipline(metadata, question.gradeLevel, question.discipline);
            setAvailableThemes(themes);

            if (mode === 'form' && question.themes && question.themes.length > 0) {
                const validThemes = question.themes.filter(t => themes.includes(t));
                if (validThemes.length !== question.themes.length) {
                    onChange({ ...question, themes: validThemes });
                }
            }
        } else {
            setAvailableThemes([]);
        }
    }, [question.gradeLevel, question.discipline, question.themes, metadata, mode, onChange]);

    // Update available tags when themes change
    useEffect(() => {
        if (question.gradeLevel && question.discipline && question.themes && question.themes.length > 0) {
            const tags = getTagsForThemes(metadata, question.gradeLevel, question.discipline, question.themes);
            setAvailableTags(tags);

            if (mode === 'form' && question.tags && question.tags.length > 0) {
                const validTags = question.tags.filter(t => tags.includes(t));
                if (validTags.length !== question.tags.length) {
                    onChange({ ...question, tags: validTags });
                }
            }
        } else {
            setAvailableTags([]);
        }
    }, [question.gradeLevel, question.discipline, question.themes, question.tags, metadata, mode, onChange]);

    // Position cursor at selected question when switching to YAML mode or when selection changes
    useEffect(() => {
        if (mode === 'yaml' && textareaRef.current) {
            // Find the position of the Nth "- uid:" (where N is selectedQuestionIndex)
            const lines = yamlText.split('\n');
            let questionCount = 0;
            let cursorPosition = 0;
            let targetLineIndex = 0;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('- uid:')) {
                    if (questionCount === selectedQuestionIndex) {
                        // Position cursor at the dash
                        cursorPosition = lines.slice(0, i).join('\n').length + (i > 0 ? 1 : 0);
                        targetLineIndex = i;
                        break;
                    }
                    questionCount++;
                }
                cursorPosition += lines[i].length + 1; // +1 for newline
            }

            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);

            // Scroll to make the cursor visible
            // Calculate approximate scroll position based on line height
            const lineHeight = 20; // Approximate line height in pixels
            const textareaHeight = textareaRef.current.clientHeight;
            const scrollPosition = (targetLineIndex * lineHeight) - (textareaHeight / 3); // Position line at top third

            textareaRef.current.scrollTop = Math.max(0, scrollPosition);
        }
    }, [mode, selectedQuestionIndex, yamlText]);

    // Update YAML text when question changes (only when in form mode)
    useEffect(() => {
        if (mode === 'form') {
            // This will be handled by the parent component
            // The parent maintains the full YAML and updates it when questions change
        }
    }, [question, mode]);

    const handleFieldChange = (field: keyof EditorQuestion, value: any) => {
        onChange({ ...question, [field]: value });
    };

    const handleAnswerOptionChange = (index: number, value: string) => {
        if (isMultipleChoiceQuestion(question)) {
            const newOptions = [...question.answerOptions];
            newOptions[index] = value;
            onChange({ ...question, answerOptions: newOptions });
        }
    };

    const handleCorrectAnswerToggle = (index: number) => {
        if (isMultipleChoiceQuestion(question)) {
            const newCorrect = [...question.correctAnswers];
            if (question.questionType === 'single_choice') {
                // For single choice, only one can be correct
                newCorrect.fill(false);
            }
            newCorrect[index] = !newCorrect[index];
            onChange({ ...question, correctAnswers: newCorrect });
        }
    };

    const addAnswerOption = () => {
        if (isMultipleChoiceQuestion(question)) {
            onChange({
                ...question,
                answerOptions: [...question.answerOptions, 'Nouvelle réponse'],
                correctAnswers: [...question.correctAnswers, false],
            });
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        onYamlChange(value, cursorPosition);
    };

    const convertYamlToEditorQuestion = (data: any): EditorQuestion => {
        if (data.questionType === 'numeric') {
            return {
                uid: data.uid || question.uid,
                author: data.author,
                discipline: data.discipline,
                title: data.title,
                text: data.text,
                questionType: 'numeric',
                themes: data.themes || [],
                tags: data.tags || [],
                timeLimit: data.timeLimit,
                difficulty: data.difficulty,
                gradeLevel: data.gradeLevel,
                correctAnswer: data.correctAnswer || 0,
                explanation: data.explanation,
                feedbackWaitTime: data.feedbackWaitTime,
            };
        } else {
            return {
                uid: data.uid || question.uid,
                author: data.author,
                discipline: data.discipline,
                title: data.title,
                text: data.text,
                questionType: data.questionType || 'single_choice',
                themes: data.themes || [],
                tags: data.tags || [],
                timeLimit: data.timeLimit,
                difficulty: data.difficulty,
                gradeLevel: data.gradeLevel,
                answerOptions: data.answerOptions || ['Réponse 1', 'Réponse 2'],
                correctAnswers: data.correctAnswers || [true, false],
                explanation: data.explanation,
                feedbackWaitTime: data.feedbackWaitTime,
            };
        }
    };

    const removeAnswerOption = (index: number) => {
        if (isMultipleChoiceQuestion(question)) {
            const newOptions = question.answerOptions.filter((_, i) => i !== index);
            const newCorrect = question.correctAnswers.filter((_, i) => i !== index);
            onChange({
                ...question,
                answerOptions: newOptions,
                correctAnswers: newCorrect,
            });
        }
    };

    return (
        <div className="bg-base-100 rounded-lg shadow-md border border-border h-full flex flex-col">
            {/* Mode Tabs */}
            <div className="flex border-b border-border flex-shrink-0 bg-muted/30">
                <button
                    onClick={() => onModeChange('form')}
                    title="Éditez la question avec des champs visuels."
                    className={`flex-1 px-6 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'form'
                        ? 'bg-card border-b-2 border-primary text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                >
                    <FileEdit className="w-4 h-4" />
                    Formulaire
                </button>
                <button
                    onClick={() => onModeChange('yaml')}
                    title="Éditez la question en YAML brut."
                    className={`flex-1 px-6 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === 'yaml'
                        ? 'bg-card border-b-2 border-primary text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                >
                    <FileCode className="w-4 h-4" />
                    YAML
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {mode === 'form' ? (
                    <div className="space-y-6">
                        {/* Title - Prominent */}
                        <div>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                <input
                                    type="text"
                                    value={question.title || ''}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    placeholder="Titre"
                                    title="Titre de la question"
                                    className="w-full pl-12 pr-4 py-3 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base font-medium transition-all"
                                />
                            </div>
                        </div>

                        {/* Second row: informational left-aligned label */}
                        <div className="text-m text-muted-foreground mb-2">Paramètres</div>

                        {/* Two-column stacked controls: left column shows Niveau then Thèmes; right column shows Discipline then Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div title="Niveau scolaire">
                                    <EnhancedSingleSelectDropdown
                                        options={metadata.gradeLevels}
                                        value={question.gradeLevel || ''}
                                        onChange={(value) => handleFieldChange('gradeLevel', value)}
                                        placeholder="Sélectionner un niveau"
                                    />
                                </div>

                                <div title="Choisissez un ou plusieurs thèmes liés au niveau et à la discipline.">
                                    <EnhancedMultiSelectDropdown
                                        options={availableThemes.map(t => ({ value: t, label: t, isCompatible: true }))}
                                        selected={question.themes || []}
                                        onChange={(values) => handleFieldChange('themes', values)}
                                        placeholder="Sélectionner un ou plusieurs thèmes"
                                        disabled={!question.gradeLevel || availableThemes.length === 0}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div title="Discipline">
                                    <EnhancedSingleSelectDropdown
                                        options={availableDisciplines}
                                        value={question.discipline || ''}
                                        onChange={(value) => handleFieldChange('discipline', value)}
                                        placeholder="Sélectionner une discipline"
                                        disabled={!question.gradeLevel || availableDisciplines.length === 0}
                                    />
                                </div>

                                <div title="Mots-clés liés aux thèmes sélectionnés">
                                    <EnhancedMultiSelectDropdown
                                        options={availableTags.map(t => ({ value: t, label: t, isCompatible: true }))}
                                        selected={question.tags || []}
                                        onChange={(values) => handleFieldChange('tags', values)}
                                        placeholder="Sélectionner un ou plusieurs tags"
                                        disabled={!question.themes || question.themes.length === 0 || availableTags.length === 0}
                                    />
                                </div>
                            </div>
                        </div>



                        {/* UID and Author - editable but pre-filled */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={question.uid}
                                        onChange={(e) => handleFieldChange('uid', e.target.value)}
                                        placeholder="UID"
                                        title="Identifiant unique de la question (modifiable)."
                                        className="w-full pl-11 pr-4 py-2 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="text"
                                        value={question.author || ''}
                                        onChange={(e) => handleFieldChange('author', e.target.value)}
                                        placeholder="Auteur"
                                        title="Auteur"
                                        className="w-full pl-11 pr-4 py-2 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Question Type and Settings - BEFORE Question Text */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div title="Type de la question">
                                    {/* Use EnhancedSingleSelectDropdown for consistent UX with Grade Level */}
                                    <EnhancedSingleSelectDropdown
                                        options={[
                                            'Numérique',
                                            'Choix unique',
                                            'Choix multiple',
                                        ]}
                                        value={
                                            question.questionType === 'numeric' ? 'Numérique'
                                                : question.questionType === 'single_choice' ? 'Choix unique'
                                                    : 'Choix multiple'
                                        }
                                        onChange={(val) => {
                                            const mapped = val === 'Numérique' ? 'numeric' : val === 'Choix unique' ? 'single_choice' : 'multiple_choice';
                                            handleFieldChange('questionType', mapped as any);
                                        }}
                                        placeholder="Type de question"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="number"
                                        value={question.timeLimit || 30}
                                        onChange={(e) => handleFieldChange('timeLimit', parseInt(e.target.value))}
                                        placeholder="Temps (s)"
                                        title="Temps alloué (secondes)"
                                        className="w-full pl-11 pr-4 py-2 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <div title="Difficulté (1–5)">
                                    <EnhancedSingleSelectDropdown
                                        options={["1", "2", "3", "4", "5"]}
                                        value={(question.difficulty || 1).toString()}
                                        onChange={(val) => handleFieldChange('difficulty', parseInt(val))}
                                        placeholder="Difficulté"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Combined Question + Answer Card */}
                        <div className="bg-card p-4 rounded-lg border border-dropdown-border">
                            {/* Question Text area with icon */}
                            <div className="relative mb-4">
                                <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                                <textarea
                                    value={question.text}
                                    onChange={(e) => handleFieldChange('text', e.target.value)}
                                    rows={3}
                                    placeholder="Entrez le texte de la question ici..."
                                    title="Texte de la question (LaTeX supporté)."
                                    className="w-full pl-12 pr-4 py-3 bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                />
                            </div>

                            {/* Answers area - varies by question type */}
                            {isNumericQuestion(question) ? (
                                <div title="Réponse correcte (numérique)">
                                    <div className="relative">
                                        <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success pointer-events-none" />
                                        <input
                                            type="number"
                                            value={question.correctAnswer}
                                            onChange={(e) => onChange({ ...question, correctAnswer: parseFloat(e.target.value) })}
                                            placeholder="Réponse correcte"
                                            // Make the input visually blend into the outer card: no inner border/background
                                            className="w-full pl-12 pr-4 py-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-success focus:border-success transition-all"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-primary/5 p-4 rounded-lg border border-dropdown-border">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-semibold text-foreground">
                                            ✅ Réponses
                                        </label>
                                        <button
                                            onClick={addAnswerOption}
                                            title="Ajouter une nouvelle option de réponse."
                                            className="px-4 py-2 bg-success text-success-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm"
                                        >
                                            + Ajouter
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {question.answerOptions.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-background p-2 rounded-lg">
                                                <input
                                                    type={question.questionType === 'single_choice' ? 'radio' : 'checkbox'}
                                                    checked={question.correctAnswers[index]}
                                                    onChange={() => handleCorrectAnswerToggle(index)}
                                                    title="Marquer comme réponse correcte."
                                                    className="w-5 h-5 text-success focus:ring-success cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => handleAnswerOptionChange(index, e.target.value)}
                                                    title={`Texte de la réponse ${index + 1}`}
                                                    className="flex-1 px-2 py-1.5 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                                    placeholder={`Réponse ${index + 1}`}
                                                />
                                                <button
                                                    onClick={() => removeAnswerOption(index)}
                                                    title="Supprimer cette option."
                                                    className="p-2 text-alert hover:bg-alert/10 rounded-lg transition-all"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Explanation and Feedback Settings */}
                        <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-dropdown-border">
                            <div>
                                <div className="relative">
                                    <Lightbulb className="absolute left-4 top-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                                    <textarea
                                        value={question.explanation || ''}
                                        onChange={(e) => handleFieldChange('explanation', e.target.value)}
                                        rows={3}
                                        placeholder="Explication (optionnel)"
                                        title="Explication à afficher après la correction"
                                        className="w-full pl-12 pr-4 py-3 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="relative">
                                    <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <input
                                        type="number"
                                        value={question.feedbackWaitTime || 0}
                                        onChange={(e) => handleFieldChange('feedbackWaitTime', parseInt(e.target.value) || 0)}
                                        placeholder="Temps explication (s)"
                                        title="Temps durant lequel l'explication sera affichée en mode tournoi"
                                        className="w-full pl-11 pr-4 py-2 border border-dropdown-border bg-background rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-foreground">
                                <FileCode className="w-5 h-5" />
                                <label className="block text-sm font-semibold">
                                    Éditeur YAML
                                </label>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-success font-medium px-3 py-1 bg-success/10 rounded-full">
                                <CheckCheck className="w-3 h-3" />
                                Validation en temps réel
                            </div>
                        </div>
                        {yamlError && (
                            <div className="mb-3 p-4 bg-alert/10 border border-alert/30 rounded-lg">
                                <div className="flex items-center gap-2 text-alert font-semibold mb-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <p className="text-sm">Erreur de format YAML:</p>
                                </div>
                                <p className="text-xs text-alert/90 font-mono ml-6">{yamlError}</p>
                            </div>
                        )}
                        <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden shadow-inner">
                            <MonacoYamlEditor
                                value={yamlText}
                                onChange={onYamlChange}
                                onCursorPosition={onCursorPosition}
                                error={null}
                                metadata={metadata}
                                ref={editorRef}
                                onEditorReady={onEditorReady}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 italic flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            Les lignes rouges ondulées indiquent des erreurs. Passez la souris dessus pour plus de détails.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};