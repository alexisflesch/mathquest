import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface Question {
    uid: string;
    question: string;
    reponses: { texte: string; correct: boolean }[];
    type: string;
    discipline: string;
    theme: string;
    difficulte: number;
    niveau: string;
    auteur?: string;
    explication?: string;
    tags?: string[];
    temps?: number;
}

interface QuestionSelectorProps {
    onSelect: (selected: string[], meta: { niveaux: string[], categories: string[], themes: string[] }) => void;
    selectedQuestionIds: string[];
    externalFilter?: { discipline?: string; niveau?: string; theme?: string };
}

export default function QuestionSelector({ onSelect, selectedQuestionIds, externalFilter }: QuestionSelectorProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filters, setFilters] = useState({ disciplines: [], niveaux: [], themes: [] });
    const [filter, setFilter] = useState({ discipline: '', niveau: '', theme: '', tag: '' });
    const [selectedNiveaux, setSelectedNiveaux] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
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
        if (effectiveFilter.theme) params.push(`theme=${encodeURIComponent(effectiveFilter.theme)}`);
        // Always limit to 100 questions max
        params.push('limit=100');
        if (params.length) url += '?' + params.join('&');
        fetch(url)
            .then(res => res.json())
            .then(setQuestions);
    }, [effectiveFilter.discipline, effectiveFilter.niveau, effectiveFilter.theme]);

    useEffect(() => {
        // Add any selectedQuestionIds that are in the current questions list
        const newMap = { ...selectedQuestionsMap };
        questions.forEach(q => {
            if (selectedQuestionIds.includes(q.uid)) {
                newMap[q.uid] = q;
            }
        });
        setSelectedQuestionsMap(newMap);
    }, [questions]);

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
        setSelectedNiveaux(niveaux);
        setSelectedCategories(categories);
        setSelectedThemes(themes);
        onSelect(next, { niveaux, categories, themes });
    };

    // Filter by tag (client-side)
    const filteredQuestions = filter.tag
        ? questions.filter(q => (q.tags || []).some(t => t.toLowerCase().includes(filter.tag.toLowerCase())))
        : questions;

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Sélectionner des questions</h2>
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
            <div className="max-h-96 overflow-y-auto border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50 shadow-inner">
                {filteredQuestions.length === 0 && <div className="text-gray-500">Aucune question trouvée.</div>}
                <ul className="space-y-2">
                    {filteredQuestions.map(q => (
                        <li key={q.uid}>
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={e => {
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
                                />
                                <span className="font-semibold select-none flex-1">{q.question}</span>
                                <span className="text-xs text-gray-500">[{q.discipline} - {q.niveau} - {q.theme}]</span>
                                <span className={`ml-2 transition-transform ${expanded[q.uid] ? 'rotate-90' : ''}`}>▼</span>
                            </div>
                            {expanded[q.uid] && (
                                <div
                                    className={
                                        `ml-8 mt-2 bg-white rounded-xl p-3 shadow-inner border border-indigo-100 ` +
                                        `transition-all duration-300 ease-in-out overflow-hidden ` +
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
                                    <div className="font-bold mb-1 text-indigo-700">Réponses :</div>
                                    <ul className="list-disc pl-5">
                                        {q.reponses.map((rep, idx) => (
                                            <li key={idx} className={rep.correct ? 'text-green-700 font-semibold' : ''}>
                                                {rep.texte} {rep.correct && <span className="ml-1 text-xs text-green-600">(correct)</span>}
                                            </li>
                                        ))}
                                    </ul>
                                    {q.explication && <div className="mt-2 text-sm text-gray-600">{q.explication}</div>}
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
