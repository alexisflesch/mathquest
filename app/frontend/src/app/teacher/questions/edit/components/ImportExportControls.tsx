'use client';

import React, { useRef, useState } from 'react';
import { EditorQuestion } from '../types';
import yaml from 'js-yaml';
import { UploadCloud, Download } from 'lucide-react';
import InfoModal from '@/components/SharedModal';

interface ImportExportControlsProps {
    questions: EditorQuestion[];
    onImport: (questions: EditorQuestion[]) => void;
    // Render a compact FAB-style variant (icon-only round buttons)
    compact?: boolean;
}

export const ImportExportControls: React.FC<ImportExportControlsProps> = ({
    questions,
    onImport,
    compact = false,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [modalState, setModalState] = useState<{ isOpen: boolean; title?: string; message?: string }>({ isOpen: false, title: undefined, message: undefined });

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
            setModalState({ isOpen: true, title: 'Importation', message: 'Veuillez sélectionner des fichiers YAML (.yaml ou .yml)' });
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
                    setModalState({ isOpen: true, title: 'Importation', message: `Erreur lors de l'analyse du fichier ${file.name}` });
                }
            }

            if (importedQuestions.length > 0) {
                onImport(importedQuestions);
                setModalState({ isOpen: true, title: 'Importation', message: `${importedQuestions.length} question(s) importée(s) avec succès` });
            }
        } catch (error) {
            console.error('Import error:', error);
            setModalState({ isOpen: true, title: 'Importation', message: 'Erreur lors de l\'importation' });
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
            setModalState({ isOpen: true, title: 'Exportation', message: 'Erreur lors de l\'exportation' });
        }
    };

    if (compact) {
        return (
            <div className="flex items-center gap-3">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full p-3 flex items-center justify-center border border-border text-primary shadow-sm hover:opacity-90 transition-all"
                    title="Importer des questions YAML"
                    aria-label="Importer"
                    style={{ backgroundColor: 'rgba(6,182,212,0.12)' }}
                >
                    <UploadCloud className="w-5 h-5" />
                </button>

                <button
                    onClick={handleExport}
                    disabled={questions.length === 0}
                    className="rounded-full p-3 flex items-center justify-center border border-border text-primary shadow-sm hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
                    title="Exporter les questions en YAML"
                    aria-label="Exporter"
                    style={{ backgroundColor: 'rgba(6,182,212,0.12)' }}
                >
                    <Download className="w-5 h-5" />
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".yaml,.yml"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <InfoModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false })} title={modalState.title}>
                    <div className="dialog-modal-content">
                        <p>{modalState.message}</p>
                        <div className="dialog-modal-actions">
                            <button className="dialog-modal-btn" onClick={() => setModalState({ isOpen: false })}>Fermer</button>
                        </div>
                    </div>
                </InfoModal>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-primary-foreground font-semibold text-sm rounded-md hover:opacity-90 transition-all flex items-center gap-2 border border-border hover:border-foreground"
                title="Importer des questions YAML"
                style={{ backgroundColor: 'rgba(6,182,212,0.12)' }}
            >
                <UploadCloud className="w-5 h-5" />
                <span>Importer</span>
            </button>
            <button
                onClick={handleExport}
                disabled={questions.length === 0}
                className="px-3 py-2 text-primary-foreground font-semibold text-sm rounded-md hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center gap-2 border border-border/60 hover:border-foreground"
                title="Exporter les questions en YAML"
                style={questions.length === 0 ? undefined : { backgroundColor: 'rgba(6,182,212,0.12)' }}
            >
                <Download className="w-5 h-5" />
                <span>Exporter</span>
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