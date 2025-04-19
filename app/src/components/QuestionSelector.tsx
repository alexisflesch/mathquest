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

export default function QuestionSelector({ onSelect }: { onSelect: (selected: string[]) => void }) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [filter, setFilter] = useState({ discipline: '', niveau: '', theme: '' });

    useEffect(() => {
        let url = '/api/questions';
        const params = [];
        if (filter.discipline) params.push(`discipline=${encodeURIComponent(filter.discipline)}`);
        if (filter.niveau) params.push(`niveau=${encodeURIComponent(filter.niveau)}`);
        if (filter.theme) params.push(`theme=${encodeURIComponent(filter.theme)}`);
        if (params.length) url += '?' + params.join('&');
        fetch(url)
            .then(res => res.json())
            .then(setQuestions);
    }, [filter]);

    const handleToggle = (uid: string) => {
        setSelected(sel => {
            const next = sel.includes(uid) ? sel.filter(id => id !== uid) : [...sel, uid];
            onSelect(next);
            return next;
        });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-2">Sélectionner des questions</h2>
            <div className="flex gap-4 mb-4">
                <input
                    className="border px-2 py-1 rounded"
                    placeholder="Discipline"
                    value={filter.discipline}
                    onChange={e => setFilter(f => ({ ...f, discipline: e.target.value }))}
                />
                <input
                    className="border px-2 py-1 rounded"
                    placeholder="Niveau"
                    value={filter.niveau}
                    onChange={e => setFilter(f => ({ ...f, niveau: e.target.value }))}
                />
                <input
                    className="border px-2 py-1 rounded"
                    placeholder="Thème"
                    value={filter.theme}
                    onChange={e => setFilter(f => ({ ...f, theme: e.target.value }))}
                />
            </div>
            <div className="max-h-96 overflow-y-auto border rounded p-2 bg-white">
                {questions.length === 0 && <div className="text-gray-500">Aucune question trouvée.</div>}
                <ul className="space-y-2">
                    {questions.map(q => (
                        <li key={q.uid} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selected.includes(q.uid)}
                                onChange={() => handleToggle(q.uid)}
                            />
                            <span className="font-semibold">{q.question}</span>
                            <span className="text-xs text-gray-500">[{q.discipline} - {q.niveau} - {q.theme}]</span>
                            <Image src={`/avatars/${q.uid}`} alt={q.uid} width={32} height={32} className="w-8 h-8 rounded-full" />
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mt-2 text-sm text-gray-600">{selected.length} question(s) sélectionnée(s)</div>
        </div>
    );
}
