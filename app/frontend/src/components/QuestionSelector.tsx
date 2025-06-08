/**
 * Question Selector Component
 * 
 * This component provides an interactive interface for selecting and filtering questions
 * to include in quizzes and tournaments. Key features include:
 * 
 * - Filtering by discipline, grade level (niveau), theme, and tags
 * - Expandable question previews showing answer options
 * - Checkbox selection with automatic metadata extraction
 * - Support for external filters (when used in specific contexts)
 * - Timer controls for questions when used in quiz management
 * - Automatic loading of available filter options from the server
 * 
 * This component is central to both the teacher quiz creation flow and
 * the student tournament creation experience, allowing users to build
 * personalized question sets based on various criteria.
 */

import React, { useEffect, useState } from 'react';
import type { QuestionData } from '@shared/types/socketEvents';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { Check, X, Search } from 'lucide-react';
import { makeApiRequest } from '@/config/api';
import { QuestionsFiltersResponseSchema, QuestionsResponseSchema } from '@/types/api';


// Remove local interface Question and use QuestionData everywhere
interface TimerProps {
    timerStatus: 'play' | 'pause' | 'stop';
    timerQuestionId: string | null;
    timeLeft: number;
    onTimerAction: (info: { status: 'play' | 'pause' | 'stop'; questionId: string; timeLeft: number }) => void;
}

interface QuestionSelectorProps extends TimerProps {
    onSelect: (selected: string[], meta: { niveaux: string[], categories: string[], themes: string[] }) => void;
    selectedQuestionIds: string[];
    externalFilter?: {
        discipline?: string;
        niveau?: string;
        themes?: string[]; // New themes array
    };
}

export default function QuestionSelector({
    onSelect, selectedQuestionIds, externalFilter,
    timerStatus, timerQuestionId, timeLeft,
    onTimerAction
}: QuestionSelectorProps) {
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [filters, setFilters] = useState<{ disciplines: string[]; niveaux: string[]; themes: string[] }>({ disciplines: [], niveaux: [], themes: [] });
    const [filter, setFilter] = useState({ discipline: '', niveau: '', themes: [] as string[], tag: '' }); // New filter state with themes array
    const [selectedQuestionsMap, setSelectedQuestionsMap] = useState<{ [uid: string]: QuestionData }>({});
    const [expanded, setExpanded] = useState<{ [uid: string]: boolean }>({});

    useEffect(() => {
        makeApiRequest('questions/filters', undefined, undefined, QuestionsFiltersResponseSchema)
            .then(setFilters)
            .catch(error => {
                console.error('Error fetching filters:', error);
            });
    }, []);

    const effectiveFilter = externalFilter ? {
        ...filter,
        ...externalFilter,
    } : filter;

    useEffect(() => {
        let url = 'questions';
        const params = [];
        if (effectiveFilter.discipline) params.push(`discipline=${encodeURIComponent(effectiveFilter.discipline)}`);
        if (effectiveFilter.niveau) params.push(`niveau=${encodeURIComponent(effectiveFilter.niveau)}`);

        // Gestion du filtrage OU pour les thèmes
        if (effectiveFilter.themes && effectiveFilter.themes.length > 0) { // New themes logic
            const themeString = effectiveFilter.themes.filter(t => t).join(',');
            if (themeString) {
                params.push(`themes=${encodeURIComponent(themeString)}`);
            }
        }

        // Always limit to 100 questions max
        params.push('limit=100');
        if (params.length) url += '?' + params.join('&');

        makeApiRequest(url, undefined, undefined, QuestionsResponseSchema)
            .then(response => {
                // Handle union type - could be array or object with questions property
                const questionsArray = Array.isArray(response) ? response : response.questions;
                setQuestions(questionsArray as QuestionData[]);
            })
            .catch(error => {
                console.error('Error fetching questions:', error);
            });
    }, [effectiveFilter.discipline, effectiveFilter.niveau,
    // Use JSON.stringify for array comparison to ensure changes are detected
    JSON.stringify(effectiveFilter.themes) // New themes dependency
    ]);

    useEffect(() => {
        // Add any selectedQuestionIds that are in the current questions list
        const newMap = { ...selectedQuestionsMap };
        questions.forEach(q => {
            if (selectedQuestionIds.includes(q.uid)) {
                newMap[q.uid] = q;
            }
        });
        setSelectedQuestionsMap(newMap);
        // Only depend on questions and selectedQuestionIds to avoid infinite loop
    }, [questions, selectedQuestionIds]);

    const handleToggle = async (uid: string) => {
        let next: string[];
        if (selectedQuestionIds.includes(uid)) {
            next = selectedQuestionIds.filter(id => id !== uid);
        } else {
            next = [...selectedQuestionIds, uid];
        }
        // If the question is not in the map, fetch it
        const updatedMap = { ...selectedQuestionsMap };
        if (!updatedMap[uid]) {
            // Try to find in current questions
            const found = questions.find(q => q.uid === uid);
            if (found) {
                updatedMap[uid] = found;
            } else {
                // Fetch from API
                try {
                    const response = await makeApiRequest(`questions?uid=${uid}`, undefined, undefined, QuestionsResponseSchema);
                    // Handle union type - could be array or object with questions property
                    const questionsArray = Array.isArray(response) ? response : response.questions;
                    if (questionsArray && questionsArray.length > 0) {
                        updatedMap[uid] = questionsArray[0] as QuestionData;
                    }
                } catch (error) {
                    console.error('Error fetching question:', error);
                }
            }
        }
        // Remove from map if unchecked
        if (!next.includes(uid)) {
            delete updatedMap[uid];
        }
        setSelectedQuestionsMap(updatedMap);
        // Compute meta arrays from all selected questions
        const selectedQuestionsMeta = Object.values(updatedMap);
        const niveaux = Array.from(new Set(selectedQuestionsMeta.map(q => q.gradeLevel).filter(Boolean) as string[]));
        const categories = Array.from(new Set(selectedQuestionsMeta.map(q => q.discipline).filter(Boolean) as string[]));
        const themes = Array.from(new Set(selectedQuestionsMeta.flatMap(q => q.themes || []))); // New themes calculation, ensuring to handle undefined/empty themes
        onSelect(next, { niveaux, categories, themes });
    };

    // Filter by tag (client-side)
    const filteredQuestions = filter.tag
        ? questions.filter(q => (q.tags || []).some(t => t.toLowerCase().includes(filter.tag.toLowerCase())))
        : questions;

    // Filtrer les questions en fonction des critères externes
    const filterQuestions = (questions: QuestionData[]): QuestionData[] => {
        return questions.filter(q => {
            // Vérification de la discipline
            if (externalFilter?.discipline && q.discipline !== externalFilter.discipline) {
                return false;
            }
            // Vérification du niveau
            if (externalFilter?.niveau && q.gradeLevel !== externalFilter.niveau) {
                return false;
            }
            // Vérification du thème (accepte string ou string[])
            if (externalFilter?.themes && externalFilter.themes.length > 0) { // New themes filter logic
                if (!q.themes || q.themes.length === 0) return false; // Question has no themes, so it can't match
                const questionHasMatchingTheme = externalFilter.themes.some(efTheme => q.themes!.includes(efTheme));
                if (!questionHasMatchingTheme) {
                    return false;
                }
            }
            return true;
        });
    };

    return (
        <div>
            {/* <h2 className="text-xl font-bold mb-2">Sélectionner des questions</h2> */}
            {!externalFilter && (
                <div className="flex flex-col gap-4 w-full mb-4">
                    <select
                        className="select select-bordered select-lg w-full"
                        value={filter.discipline}
                        onChange={e => setFilter(f => ({ ...f, discipline: e.target.value }))}
                    >
                        <option value="">Discipline</option>
                        {filters.disciplines.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select
                        className="select select-bordered select-lg w-full"
                        value={filter.niveau}
                        onChange={e => setFilter(f => ({ ...f, niveau: e.target.value }))}
                    >
                        <option value="">Niveau</option>
                        {filters.niveaux.map((n: string) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                        className="select select-bordered select-lg w-full"
                        value={filter.themes[0] || ''}
                        onChange={e => setFilter(f => ({ ...f, themes: [e.target.value] }))} // Sets themes as an array with the selected value
                    >
                        <option value="">Thème</option>
                        {filters.themes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-400" />
                        </div>
                        <input
                            className="input input-bordered input-lg w-full pl-10"
                            placeholder="Rechercher par tag"
                            value={filter.tag}
                            onChange={e => setFilter(f => ({ ...f, tag: e.target.value }))}
                        />
                    </div>
                </div>
            )}
            {externalFilter && (
                <div className="flex flex-col gap-4 w-full mb-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={20} className="text-gray-400" />
                        </div>
                        <input
                            className="input input-bordered input-lg w-full pl-10"
                            placeholder="Rechercher par tag"
                            value={filter.tag}
                            onChange={e => setFilter(f => ({ ...f, tag: e.target.value }))}
                        />
                    </div>
                </div>
            )}
            <div className="max-h-96 overflow-y-auto border-2 rounded-2xl p-4 shadow-inner">
                {filteredQuestions.length === 0 && <div>Aucune question trouvée.</div>}
                <ul className="pl-0">
                    {filteredQuestions.map(q => (
                        <li key={q.uid} className='mb-2'>
                            <div className="flex items-start gap-2 cursor-pointer group" onClick={e => {
                                // Only expand/collapse if not clicking the checkbox
                                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                                    setExpanded(prev => ({ ...prev, [q.uid]: !prev[q.uid] }));
                                }
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedQuestionIds.includes(q.uid)}
                                    onChange={() => handleToggle(q.uid)}
                                    onClick={e => e.stopPropagation()}
                                    style={{ transform: 'scale(1.3)' }}
                                    className="mt-1.5"
                                />
                                <span className="flex-1 select-none ml-1 mr-1">
                                    <MathJaxWrapper>{q.question}</MathJaxWrapper>
                                </span>
                                <span className="text-xs text-muted mt-1.5">[{q.discipline} - {q.gradeLevel} - {(q.themes || []).join(', ')}]</span>
                                <span className={`ml-2 mt-1 transition-transform couleur-global-neutral-400 ${expanded[q.uid] ? 'rotate-90' : ''}`}>▼</span>
                            </div>
                            {expanded[q.uid] && (
                                <div
                                    className={
                                        `ml-8 mt-2 rounded-xl p-3 shadow-inner border couleur-global-border bg-couleur-global-bg` +
                                        ` transition-all duration-300 ease-in-out overflow-hidden ` +
                                        (expanded[q.uid] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')
                                    }
                                    style={{
                                        maxHeight: expanded[q.uid] ? '500px' : '0',
                                        opacity: expanded[q.uid] ? 1 : 0,
                                        marginTop: expanded[q.uid] ? '0.5rem' : '0',
                                        padding: expanded[q.uid] ? '0.75rem' : '0',
                                        pointerEvents: expanded[q.uid] ? 'auto' : 'none',
                                        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s, margin 0.3s, padding 0.3s',
                                    }}
                                >
                                    <div className="font-medium mb-1 couleur-global-neutral-700">Réponses&nbsp;:</div>
                                    <ul className="pl-0">
                                        {Array.isArray(q.answerOptions) && q.answerOptions.length > 0 ? (
                                            q.answerOptions.map((text, idx) => (
                                                <li key={idx} className="flex gap-2 mb-1" style={{ listStyle: 'none', alignItems: 'flex-start' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'flex-start', height: '18px', minWidth: '18px' }}>
                                                        {q.correctAnswers && q.correctAnswers[idx] ? (
                                                            <Check size={18} strokeWidth={3} className="text-primary mt-1" style={{ display: 'block' }} />
                                                        ) : (
                                                            <X size={18} strokeWidth={3} className="text-secondary mt-1" style={{ display: 'block' }} />
                                                        )}
                                                    </span>
                                                    <span style={{ lineHeight: '1.5' }}>
                                                        <MathJaxWrapper>{text}</MathJaxWrapper>
                                                    </span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="italic text-muted-foreground">Aucune réponse définie</li>
                                        )}
                                    </ul>
                                    {q.explanation && <div className="mt-2 text-sm couleur-global-neutral-600">
                                        <MathJaxWrapper>
                                            <span className="font-semibold">Justification&nbsp;:</span>
                                            {q.explanation}
                                        </MathJaxWrapper>
                                    </div>}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-2 text-sm text-gray-600">{selectedQuestionIds.length} question(s) sélectionnée(s)</div>
        </div>
    );
}
