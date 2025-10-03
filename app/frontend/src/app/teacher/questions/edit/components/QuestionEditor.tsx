'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EditorQuestion, isNumericQuestion, isMultipleChoiceQuestion, questionToYaml } from '../types';
import { ParsedMetadata } from '../types/metadata';
import { getDisciplinesForGradeLevel, getThemesForDiscipline, getTagsForThemes } from '../utils/metadata';
import EnhancedSingleSelectDropdown from '@/components/EnhancedSingleSelectDropdown';
import EnhancedMultiSelectDropdown from '@/components/EnhancedMultiSelectDropdown';
import { MonacoYamlEditor } from './MonacoYamlEditor';
import yaml from 'js-yaml';

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
        <div className="bg-card rounded-lg shadow-sm border border-border h-full flex flex-col">
            {/* Mode Tabs */}
            <div className="flex border-b border-border flex-shrink-0">
                <button
                    onClick={() => onModeChange('form')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'form'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Formulaire
                </button>
                <button
                    onClick={() => onModeChange('yaml')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mode === 'yaml'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    YAML
                </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {mode === 'form' ? (
                    <div className="space-y-6">
                        {/* Title - Prominent */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Titre
                            </label>
                            <input
                                type="text"
                                value={question.title || ''}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                placeholder="Titre de la question"
                                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-base"
                            />
                        </div>

                        {/* Cascading Dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Grade Level - First */}
                            <div>
                                <EnhancedSingleSelectDropdown
                                    label="Niveau"
                                    options={metadata.gradeLevels}
                                    value={question.gradeLevel || ''}
                                    onChange={(value) => handleFieldChange('gradeLevel', value)}
                                    placeholder="Sélectionner un niveau"
                                />
                            </div>

                            {/* Discipline - Enabled only if grade level is selected */}
                            <div>
                                <EnhancedSingleSelectDropdown
                                    label="Discipline"
                                    options={availableDisciplines}
                                    value={question.discipline || ''}
                                    onChange={(value) => handleFieldChange('discipline', value)}
                                    placeholder="Sélectionner une discipline"
                                    disabled={!question.gradeLevel || availableDisciplines.length === 0}
                                />
                            </div>
                        </div>

                        {/* Themes - Multi-select, enabled only if discipline is selected */}
                        <div>
                            <EnhancedMultiSelectDropdown
                                label="Thèmes"
                                options={availableThemes.map(t => ({ value: t, label: t, isCompatible: true }))}
                                selected={question.themes || []}
                                onChange={(values) => handleFieldChange('themes', values)}
                                placeholder="Sélectionner un ou plusieurs thèmes"
                                disabled={!question.discipline || availableThemes.length === 0}
                            />
                        </div>

                        {/* Tags - Multi-select, enabled only if themes are selected */}
                        <div>
                            <EnhancedMultiSelectDropdown
                                label="Tags"
                                options={availableTags.map(t => ({ value: t, label: t, isCompatible: true }))}
                                selected={question.tags || []}
                                onChange={(values) => handleFieldChange('tags', values)}
                                placeholder="Sélectionner un ou plusieurs tags"
                                disabled={!question.themes || question.themes.length === 0 || availableTags.length === 0}
                            />
                        </div>

                        {/* UID and Author - editable but pre-filled */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    UID
                                </label>
                                <input
                                    type="text"
                                    value={question.uid}
                                    onChange={(e) => handleFieldChange('uid', e.target.value)}
                                    placeholder="Identifiant unique"
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Auteur
                                </label>
                                <input
                                    type="text"
                                    value={question.author || ''}
                                    onChange={(e) => handleFieldChange('author', e.target.value)}
                                    placeholder="Nom de l'auteur"
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                />
                            </div>
                        </div>

                        {/* Question Type and Settings - BEFORE Question Text */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Type
                                </label>
                                <select
                                    value={question.questionType}
                                    onChange={(e) => handleFieldChange('questionType', e.target.value as any)}
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                >
                                    <option value="numeric">Numérique</option>
                                    <option value="single_choice">Choix unique</option>
                                    <option value="multiple_choice">Choix multiple</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Temps limite (s)
                                </label>
                                <input
                                    type="number"
                                    value={question.timeLimit || 30}
                                    onChange={(e) => handleFieldChange('timeLimit', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Difficulté
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={question.difficulty || 1}
                                    onChange={(e) => handleFieldChange('difficulty', parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>

                        {/* Question Text - AFTER Type/Time/Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Question
                            </label>
                            <textarea
                                value={question.text}
                                onChange={(e) => handleFieldChange('text', e.target.value)}
                                rows={3}
                                placeholder="Entrez le texte de la question ici..."
                                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Answer Section */}
                        {isNumericQuestion(question) ? (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Réponse correcte
                                </label>
                                <input
                                    type="number"
                                    value={question.correctAnswer}
                                    onChange={(e) => onChange({ ...question, correctAnswer: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-foreground">
                                        Réponses
                                    </label>
                                    <button
                                        onClick={addAnswerOption}
                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                    >
                                        + Ajouter
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {question.answerOptions.map((option, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type={question.questionType === 'single_choice' ? 'radio' : 'checkbox'}
                                                checked={question.correctAnswers[index]}
                                                onChange={() => handleCorrectAnswerToggle(index)}
                                                className="text-blue-600 focus:ring-primary"
                                            />
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleAnswerOptionChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                                placeholder={`Réponse ${index + 1}`}
                                            />
                                            <button
                                                onClick={() => removeAnswerOption(index)}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                title="Supprimer"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Explanation and Feedback Settings */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Explication <span className="text-muted-foreground">(optionnel)</span>
                                </label>
                                <textarea
                                    value={question.explanation || ''}
                                    onChange={(e) => handleFieldChange('explanation', e.target.value)}
                                    rows={3}
                                    placeholder="Explication de la réponse à montrer après validation (optionnel)"
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Temps d'attente du feedback (ms) <span className="text-muted-foreground">(optionnel)</span>
                                </label>
                                <input
                                    type="number"
                                    value={question.feedbackWaitTime || 0}
                                    onChange={(e) => handleFieldChange('feedbackWaitTime', parseInt(e.target.value) || 0)}
                                    placeholder="0 = affichage immédiat"
                                    className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Délai avant l'affichage du feedback après validation (0 pour immédiat)
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-foreground">
                                YAML Editor
                            </label>
                            <p className="text-xs text-muted-foreground">
                                ✨ Validation en temps réel
                            </p>
                        </div>
                        {yamlError && (
                            <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                                <p className="text-sm text-destructive font-medium">Erreur de format YAML:</p>
                                <p className="text-xs text-destructive/80 mt-1">{yamlError}</p>
                            </div>
                        )}
                        <div className="flex-1 min-h-[500px]">
                            <MonacoYamlEditor
                                value={yamlText}
                                onChange={onYamlChange}
                                error={null}
                                metadata={metadata}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Les lignes rouges ondulées indiquent des erreurs. Passez la souris dessus pour plus de détails.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};