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
import type { Question as BaseQuestion } from '../types';
import MathJaxWrapper from '@/components/MathJaxWrapper';
import { Check, X } from 'lucide-react';


// Extend the shared Question interface with additional fields for this component
interface Question extends BaseQuestion {
    discipline: string;
    theme: string;
    difficulte: number;
    niveau: string;
    auteur?: string;
    tags?: string[];
}

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
        theme?: string | string[]; // Accepter string ou string[]
    };
}

export default function QuestionSelector({
    onSelect, selectedQuestionIds, externalFilter,
    timerStatus, timerQuestionId, timeLeft,
    onTimerAction
}: QuestionSelectorProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filters, setFilters] = useState({ disciplines: [], niveaux: [], themes: [] });
    const [filter, setFilter] = useState({ discipline: '', niveau: '', theme: '', tag: '' });
    const [selectedQuestionsMap, setSelectedQuestionsMap] = useState<{ [uid: string]: Question }>({});
    const [expanded, setExpanded] = useState<{ [uid: string]: boolean }>({});

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setFilters);
    }, []);

    const effectiveFilter = externalFilter ? {
        ...filter,
        ...externalFilter,
    } : filter;

    useEffect(() => {
        let url = '/api/questions';
        const params = [];
        if (effectiveFilter.discipline) params.push(`discipline=${encodeURIComponent(effectiveFilter.discipline)}`);
        if (effectiveFilter.niveau) params.push(`niveau=${encodeURIComponent(effectiveFilter.niveau)}`);

        // Gestion du filtrage OU pour les thèmes
        if (effectiveFilter.theme) {
            if (Array.isArray(effectiveFilter.theme) && effectiveFilter.theme.length > 0) {
                // Utiliser le paramètre 'themes' (pluriel) comme dans create-tournament/page.tsx
                const themeString = effectiveFilter.theme.filter(t => t).join(',');
                if (themeString) {
                    params.push(`themes=${encodeURIComponent(themeString)}`);
                }
            } else if (typeof effectiveFilter.theme === 'string' && effectiveFilter.theme) {
                // Pour la rétrocompatibilité, on garde 'theme' (singulier) pour une chaîne unique
                params.push(`theme=${encodeURIComponent(effectiveFilter.theme)}`);
            }
        }

        // Always limit to 100 questions max
        params.push('limit=100');
        if (params.length) url += '?' + params.join('&');

        fetch(url)
            .then(res => res.json())
            .then(setQuestions);
    }, [effectiveFilter.discipline, effectiveFilter.niveau,
    // Use JSON.stringify for array comparison to ensure changes are detected
    Array.isArray(effectiveFilter.theme) ? JSON.stringify(effectiveFilter.theme) : effectiveFilter.theme
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
                const res = await fetch(`/api/questions?uid=${uid}`);
                const arr = await res.json();
                if (Array.isArray(arr) && arr.length > 0) {
                    updatedMap[uid] = arr[0];
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
        const niveaux = Array.from(new Set(selectedQuestionsMeta.map(q => q.niveau)));
        const categories = Array.from(new Set(selectedQuestionsMeta.map(q => q.discipline)));
        const themes = Array.from(new Set(selectedQuestionsMeta.map(q => q.theme)));
        onSelect(next, { niveaux, categories, themes });
    };

    // Filter by tag (client-side)
    const filteredQuestions = filter.tag
        ? questions.filter(q => (q.tags || []).some(t => t.toLowerCase().includes(filter.tag.toLowerCase())))
        : questions;

    // Filtrer les questions en fonction des critères externes
    const filterQuestions = (questions: Question[]): Question[] => {
        return questions.filter(q => {
            // Vérification de la discipline
            if (externalFilter?.discipline && q.discipline !== externalFilter.discipline) {
                return false;
            }
            // Vérification du niveau
            if (externalFilter?.niveau && q.niveau !== externalFilter.niveau) {
                return false;
            }
            // Vérification du thème (accepte string ou string[])
            if (externalFilter?.theme) {
                if (Array.isArray(externalFilter.theme)) {
                    // Si c'est un tableau et non vide, vérifie si le thème de la question est inclus
                    if (externalFilter.theme.length > 0 && !externalFilter.theme.includes(q.theme)) {
                        return false;
                    }
                } else {
                    // Si c'est une chaîne et non vide, vérifie l'égalité exacte
                    if (externalFilter.theme && q.theme !== externalFilter.theme) {
                        return false;
                    }
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
                        value={filter.theme}
                        onChange={e => setFilter(f => ({ ...f, theme: e.target.value }))}
                    >
                        <option value="">Thème</option>
                        {filters.themes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input
                        className="input input-bordered input-lg w-full"
                        placeholder="Rechercher par tag"
                        value={filter.tag}
                        onChange={e => setFilter(f => ({ ...f, tag: e.target.value }))}
                    />
                </div>
            )}
            {externalFilter && (
                <div className="flex flex-col gap-4 w-full mb-4">
                    <input
                        className="input input-bordered input-lg w-full"
                        placeholder="Rechercher par tag"
                        value={filter.tag}
                        onChange={e => setFilter(f => ({ ...f, tag: e.target.value }))}
                    />
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
                                <span className="text-xs text-muted mt-1.5">[{q.discipline} - {q.niveau} - {q.theme}]</span>
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
                                        {q.reponses.map((rep, idx) => (
                                            <li key={idx} className="flex gap-2 mb-1" style={{ listStyle: 'none', alignItems: 'flex-start' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'flex-start', height: '18px', minWidth: '18px' }}>
                                                    {rep.correct ? (
                                                        <Check size={18} strokeWidth={3} className="text-primary mt-1" style={{ display: 'block' }} />
                                                    ) : (
                                                        <X size={18} strokeWidth={3} className="text-secondary mt-1" style={{ display: 'block' }} />
                                                    )}
                                                </span>
                                                <span style={{ lineHeight: '1.5' }}>
                                                    <MathJaxWrapper>{rep.texte}</MathJaxWrapper>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {q.explication && <div className="mt-2 text-sm couleur-global-neutral-600">
                                        <MathJaxWrapper>
                                            <span className="font-semibold">Justification&nbsp;:</span>
                                            {q.explication}
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
