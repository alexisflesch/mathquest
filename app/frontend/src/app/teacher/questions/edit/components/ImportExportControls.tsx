'use client';

import React, { useRef } from 'react';
import { EditorQuestion } from '../types';
import yaml from 'js-yaml';

interface ImportExportControlsProps {
    questions: EditorQuestion[];
    onImport: (questions: EditorQuestion[]) => void;
}

export const ImportExportControls: React.FC<ImportExportControlsProps> = ({
    questions,
    onImport,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFiles = async (files: File[]) => {
        const yamlFiles = files.filter(file => file.name.endsWith('.yaml') || file.name.endsWith('.yml'));

        if (yamlFiles.length === 0) {
            alert('Veuillez sélectionner des fichiers YAML (.yaml ou .yml)');
            return;
        }

        try {
            const importedQuestions: EditorQuestion[] = [];

            for (const file of yamlFiles) {
                const text = await file.text();
                try {
                    const data = yaml.load(text) as any;

                    if (Array.isArray(data)) {
                        // Multiple questions in one file
                        data.forEach(q => importedQuestions.push(convertToEditorQuestion(q)));
                    } else {
                        // Single question
                        importedQuestions.push(convertToEditorQuestion(data));
                    }
                } catch (error) {
                    console.error(`Error parsing ${file.name}:`, error);
                    alert(`Erreur lors de l'analyse du fichier ${file.name}`);
                }
            }

            if (importedQuestions.length > 0) {
                onImport(importedQuestions);
                alert(`${importedQuestions.length} question(s) importée(s) avec succès`);
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Erreur lors de l\'importation');
        }
    };

    const convertToEditorQuestion = (data: any): EditorQuestion => {
        // Convert from YAML format to EditorQuestion
        if (data.questionType === 'numeric') {
            return {
                uid: data.uid || `imported-${Date.now()}`,
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
                uid: data.uid || `imported-${Date.now()}`,
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

    const handleExport = async () => {
        if (questions.length === 0) {
            alert('Aucune question à exporter');
            return;
        }

        try {
            // Convert questions to YAML format
            const yamlContent = questions.map(q => {
                const base = {
                    uid: q.uid,
                    author: q.author,
                    discipline: q.discipline,
                    title: q.title,
                    text: q.text,
                    questionType: q.questionType,
                    themes: q.themes,
                    tags: q.tags,
                    timeLimit: q.timeLimit,
                    difficulty: q.difficulty,
                    gradeLevel: q.gradeLevel,
                    explanation: q.explanation,
                    feedbackWaitTime: q.feedbackWaitTime,
                };

                if (q.questionType === 'numeric') {
                    return {
                        ...base,
                        correctAnswer: q.correctAnswer,
                    };
                } else {
                    return {
                        ...base,
                        answerOptions: q.answerOptions,
                        correctAnswers: q.correctAnswers,
                    };
                }
            });

            // Export as actual YAML
            const content = yaml.dump(yamlContent);
            const blob = new Blob([content], { type: 'application/x-yaml' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `questions-${new Date().toISOString().split('T')[0]}.yaml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Erreur lors de l\'exportation');
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
                title="Importer des questions YAML"
            >
                <span>📁</span>
                <span>Importer</span>
            </button>
            <button
                onClick={handleExport}
                disabled={questions.length === 0}
                className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                title="Exporter les questions en YAML"
            >
                <span>💾</span>
                <span>Exporter</span>
                <span className="px-2 py-0.5 bg-secondary-foreground/20 rounded-full text-xs font-bold">
                    {questions.length}
                </span>
            </button>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".yaml,.yml"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};