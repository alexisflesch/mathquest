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
}

export default function QuestionSelector({ onSelect, selectedQuestionIds }: QuestionSelectorProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [filters, setFilters] = useState({ disciplines: [], niveaux: [], themes: [] });
    const [filter, setFilter] = useState({ discipline: '', niveau: '', theme: '', tag: '' });
    const [selectedNiveaux, setSelectedNiveaux] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

    useEffect(() => {
        fetch('/api/questions/filters')
            .then(res => res.json())
            .then(setFilters);
    }, []);

    useEffect(() => {
        let url = '/api/questions';
        const params = [];
        if (filter.discipline) params.push(`discipline=${encodeURIComponent(filter.discipline)}`);
        if (filter.niveau) params.push(`niveau=${encodeURIComponent(filter.niveau)}`);
        if (filter.theme) params.push(`theme=${encodeURIComponent(filter.theme)}`);
        // Always limit to 100 questions max
        params.push('limit=100');
        if (params.length) url += '?' + params.join('&');
        fetch(url)
            .then(res => res.json())
            .then(setQuestions);
    }, [filter.discipline, filter.niveau, filter.theme]);

    const handleToggle = (uid: string) => {
        let next: string[];
        if (selectedQuestionIds.includes(uid)) {
            next = selectedQuestionIds.filter(id => id !== uid);
        } else {
            next = [...selectedQuestionIds, uid];
        }
        // Compute meta arrays from selected questions
        const selectedQuestionsMeta = questions.filter(q => next.includes(q.uid));
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
            <div className="flex flex-col gap-4 w-full mb-4">
                <select
                    className="border-2 border-sky-200 bg-sky-50 rounded-full px-4 py-3 text-lg font-semibold text-sky-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition"
                    value={filter.discipline}
                    onChange={e => setFilter(f => ({ ...f, discipline: e.target.value }))}
                >
                    <option value="">Discipline</option>
                    {filters.disciplines.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                    className="border-2 border-violet-200 bg-violet-50 rounded-full px-4 py-3 text-lg font-semibold text-violet-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition"
                    value={filter.niveau}
                    onChange={e => setFilter(f => ({ ...f, niveau: e.target.value }))}
                >
                    <option value="">Niveau</option>
                    {filters.niveaux.map((n: string) => <option key={n} value={n}>{n}</option>)}
                </select>
                <select
                    className="border-2 border-indigo-200 bg-indigo-50 rounded-full px-4 py-3 text-lg font-semibold text-indigo-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 transition"
                    value={filter.theme}
                    onChange={e => setFilter(f => ({ ...f, theme: e.target.value }))}
                >
                    <option value="">Thème</option>
                    {filters.themes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                    className="border-2 border-sky-200 bg-sky-50 rounded-full px-4 py-3 text-lg font-semibold text-sky-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 transition"
                    placeholder="Rechercher par tag"
                    value={filter.tag}
                    onChange={e => setFilter(f => ({ ...f, tag: e.target.value }))}
                />
            </div>
            <div className="max-h-96 overflow-y-auto border-2 border-indigo-200 rounded-2xl p-4 bg-indigo-50 shadow-inner">
                {filteredQuestions.length === 0 && <div className="text-gray-500">Aucune question trouvée.</div>}
                <ul className="space-y-2">
                    {filteredQuestions.map(q => (
                        <li key={q.uid} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedQuestionIds.includes(q.uid)}
                                onChange={() => handleToggle(q.uid)}
                            />
                            <span className="font-semibold">{q.question}</span>
                            <span className="text-xs text-gray-500">[{q.discipline} - {q.niveau} - {q.theme}]</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-2 text-sm text-gray-600">{selectedQuestionIds.length} question(s) sélectionnée(s)</div>
        </div>
    );
}
