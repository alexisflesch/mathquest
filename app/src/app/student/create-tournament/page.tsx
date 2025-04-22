"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from "next/navigation";

interface Filters {
    niveaux: string[];
    disciplines: string[];
    themes: string[];
}

const QUESTION_OPTIONS = [10, 20, 30];

export default function StudentCreateTournamentPage() {
    const [step, setStep] = useState(1);
    const [filters, setFilters] = useState<Filters>({ niveaux: [], disciplines: [], themes: [] });
    const [niveau, setNiveau] = useState("");
    const [discipline, setDiscipline] = useState("");
    const [themes, setThemes] = useState<string[]>([]);
    const [numQuestions, setNumQuestions] = useState(10);
    const [tournamentType, setTournamentType] = useState<"live" | "deferred" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [canCreate, setCanCreate] = useState(true);
    const [created, setCreated] = useState(false);
    const [tournamentCode, setTournamentCode] = useState<string | null>(null);
    const [themesOpen, setThemesOpen] = useState(false);
    const { isTeacher, teacherId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetch("/api/questions/filters")
            .then((res) => res.json())
            .then(setFilters);
    }, []);

    // Check if enough questions exist for the selected filters
    useEffect(() => {
        if (niveau && discipline && themes.length > 0) {
            setLoading(true);
            setError(null);
            fetch(`/api/questions/count?niveau=${encodeURIComponent(niveau)}&discipline=${encodeURIComponent(discipline)}&themes=${themes.map(encodeURIComponent).join(",")}`)
                .then((res) => res.json())
                .then((data) => {
                    setCanCreate(data.count >= numQuestions);
                    if (data.count < numQuestions) {
                        setError("Pas assez de questions pour ces critères.");
                    }
                })
                .catch(() => setError("Erreur lors de la vérification des questions."))
                .finally(() => setLoading(false));
        } else {
            setCanCreate(false);
        }
    }, [niveau, discipline, themes, numQuestions]);

    // Stepper UI
    const steps = [
        "Niveau",
        "Discipline",
        "Thèmes",
        "Questions",
        "Type",
        "Confirmation"
    ];

    // Handlers
    const handleThemeToggle = (theme: string) => {
        setThemes((prev) => prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]);
    };

    const handleCreateTournament = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch question IDs matching filters
            const qRes = await fetch(`/api/questions/list?niveau=${encodeURIComponent(niveau)}&discipline=${encodeURIComponent(discipline)}&themes=${themes.map(encodeURIComponent).join(",")}&limit=${numQuestions}`);
            if (!qRes.ok) throw new Error('Erreur lors de la récupération des questions.');
            interface Question { uid: string; }
            const questions: Question[] = await qRes.json();
            if (!questions || !Array.isArray(questions) || questions.length < numQuestions) {
                setError('Pas assez de questions pour ces critères.');
                setLoading(false);
                return;
            }
            const questions_ids = questions.map(q => q.uid);
            // inside handleCreateTournament, above student/teacher logic
            let pseudo: string | undefined;
            let avatar: string | undefined;
            // 2. Get student pseudo/avatar or teacherId
            let cree_par_id = null;
            let enseignant_id = null;
            let nom = 'Tournoi élève';
            if (isTeacher && teacherId) {
                enseignant_id = teacherId;
                cree_par_id = teacherId;
                nom = 'Tournoi enseignant';
            } else {
                // Student: use localStorage for pseudo/avatar, and generate a session id
                pseudo = localStorage.getItem('mathquest_pseudo') || 'Élève';
                avatar = localStorage.getItem('mathquest_avatar') || '';
                let cookie_id = localStorage.getItem('mathquest_cookie_id');
                if (!cookie_id) {
                    cookie_id = Math.random().toString(36).substring(2) + Date.now();
                    localStorage.setItem('mathquest_cookie_id', cookie_id);
                }
                cree_par_id = cookie_id;
                enseignant_id = null;
                nom = `Tournoi de ${pseudo}`;
            }
            // build request body including pseudo/avatar if set
            const requestBody = {
                action: 'create', nom, questions_ids, enseignant_id,
                type: tournamentType === 'live' ? 'direct' : 'differé',
                niveau, categorie: discipline, themes, cree_par_id,
                ...(pseudo && { pseudo }), ...(avatar && { avatar }),
                ...(isTeacher && teacherId ? { teacherCreatorId: teacherId } : {}),
            };
            const tRes = await fetch('/api/tournament', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            const tData = await tRes.json();
            if (!tRes.ok) throw new Error(tData.message || 'Erreur lors de la création du tournoi.');
            setTournamentCode(tData.code);
            setCreated(true);
            // Redirect after creation
            if (tournamentType === 'live') {
                router.push(`/lobby/${tData.code}`);
            } else {
                router.push(`/tournament/${tData.code}`);
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError('Erreur lors de la création du tournoi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 py-2 px-2 md:py-4">
            <div className="card w-full max-w-xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    {/* Progress Bar DaisyUI */}
                    {/* Responsive stepper: 1-3 on first row, 4-6 on second row for mobile */}
                    <div className="w-full mb-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-0">
                            {/* First row: steps 1-3 */}
                            <div className="flex flex-row flex-1 items-center">
                                {[0, 1, 2].map((idx) => (
                                    <div key={steps[idx]} className="flex-1 flex flex-col items-center">
                                        <div className={`badge badge-lg ${step > idx + 1 ? "badge-primary" : "badge-ghost"}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs text-center w-16 h-5 whitespace-nowrap flex items-center justify-center">{steps[idx]}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Second row: steps 4-6 (on mobile, stacked below; on desktop, inline) */}
                            <div className="flex flex-row flex-1 items-center mt-2 sm:mt-0">
                                {[3, 4, 5].map((idx) => (
                                    <div key={steps[idx]} className="flex-1 flex flex-col items-center">
                                        <div className={`badge badge-lg ${step > idx + 1 ? "badge-primary" : "badge-ghost"}`}>
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs text-center w-16 h-5 whitespace-nowrap flex items-center justify-center">{steps[idx]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Step 1: Niveau */}
                    {step === 1 && (
                        <div className="w-full flex flex-col gap-4">
                            <label className="font-bold text-lg">Choisis un niveau</label>
                            <select
                                className="select select-bordered select-lg w-full"
                                value={niveau}
                                onChange={e => { setNiveau(e.target.value); setStep(2); }}
                            >
                                <option value="">Niveau</option>
                                {filters.niveaux.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    )}
                    {/* Step 2: Discipline */}
                    {step === 2 && (
                        <div className="w-full flex flex-col gap-4">
                            <label className="font-bold text-lg">Choisis une discipline</label>
                            <select
                                className="select select-bordered select-lg w-full"
                                value={discipline}
                                onChange={e => { setDiscipline(e.target.value); setStep(3); }}
                            >
                                <option value="">Discipline</option>
                                {filters.disciplines.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    )}
                    {/* Step 3: Thèmes (multi-select with checkboxes) */}
                    {step === 3 && (
                        <div className="w-full flex flex-col gap-4">
                            <label className="font-bold text-lg">Choisis un ou plusieurs thèmes</label>
                            <div className="relative w-full">
                                <button
                                    className="btn btn-outline btn-lg w-full text-left bg-base-100"
                                    onClick={e => { e.preventDefault(); setThemesOpen(o => !o); }}
                                    type="button"
                                    style={{ backgroundColor: 'white', color: '#111827' }} // ensure black text
                                >
                                    <span className="text-black">
                                        {themes.length === 0 ? "Thèmes" : themes.join(", ")}
                                    </span>
                                    <span className="float-right">▼</span>
                                </button>
                                {/* Dropdown */}
                                <div
                                    className="absolute z-10 w-full bg-base-100 border border-base-200 rounded-xl shadow-lg mt-2 max-h-60 overflow-y-auto"
                                    style={{
                                        display: themesOpen ? 'block' : 'none',
                                        backgroundColor: '#fff', // ensure solid white
                                    }}
                                >
                                    {filters.themes.map((t) => (
                                        <label key={t} className="flex items-center px-4 py-2 hover:bg-base-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={themes.includes(t)}
                                                onChange={() => handleThemeToggle(t)}
                                                className="checkbox mr-2"
                                            />
                                            {t}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <button
                                className="btn btn-primary btn-lg mt-2"
                                disabled={themes.length === 0}
                                onClick={() => setStep(4)}
                            >
                                Valider les thèmes
                            </button>
                        </div>
                    )}
                    {/* Step 4: Number of Questions */}
                    {step === 4 && (
                        <div className="w-full flex flex-col gap-4">
                            <label className="font-bold text-lg">Combien de questions ?</label>
                            <div className="flex gap-4">
                                {QUESTION_OPTIONS.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        className={`flex-1 rounded-lg border border-primary transition-colors duration-100
                                            ${numQuestions === n
                                                ? 'bg-primary text-white'
                                                : 'bg-white text-black hover:bg-primary hover:text-white'}
                                            py-3 text-lg font-semibold
                                        `}
                                        style={{
                                            backgroundColor: numQuestions === n ? '#2563EB' : '#fff',
                                            color: numQuestions === n ? '#fff' : '#111827',
                                            borderColor: '#2563EB',
                                        }}
                                        onClick={() => setNumQuestions(n)}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <button
                                className="btn btn-primary btn-lg mt-2"
                                onClick={() => setStep(5)}
                            >
                                Valider
                            </button>
                        </div>
                    )}
                    {/* Step 5: Tournament Type */}
                    {step === 5 && (
                        <div className="w-full flex flex-col gap-4">
                            <label className="font-bold text-lg">Type de tournoi</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    className={`flex-1 rounded-lg border border-primary transition-colors duration-100
                                        ${tournamentType === 'live'
                                            ? 'bg-primary text-white'
                                            : 'bg-white text-black hover:bg-primary hover:text-white'}
                                        py-3 text-lg font-semibold
                                    `}
                                    style={{
                                        backgroundColor: tournamentType === 'live' ? '#2563EB' : '#fff',
                                        color: tournamentType === 'live' ? '#fff' : '#111827',
                                        borderColor: '#2563EB',
                                    }}
                                    onClick={() => setTournamentType('live')}
                                >
                                    Tournoi en direct
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 rounded-lg border border-primary transition-colors duration-100
                                        ${tournamentType === 'deferred'
                                            ? 'bg-primary text-white'
                                            : 'bg-white text-black hover:bg-primary hover:text-white'}
                                        py-3 text-lg font-semibold
                                    `}
                                    style={{
                                        backgroundColor: tournamentType === 'deferred' ? '#2563EB' : '#fff',
                                        color: tournamentType === 'deferred' ? '#fff' : '#111827',
                                        borderColor: '#2563EB',
                                    }}
                                    onClick={() => setTournamentType('deferred')}
                                >
                                    Tournoi différé
                                </button>
                            </div>
                            <button
                                className="btn btn-primary btn-lg mt-2"
                                disabled={!tournamentType}
                                onClick={() => setStep(6)}
                            >
                                Valider
                            </button>
                        </div>
                    )}
                    {/* Step 6: Confirmation */}
                    {step === 6 && (
                        <div className="w-full flex flex-col gap-4 items-center">
                            <div className="text-lg font-bold mb-2">Résumé</div>
                            <ul className="mb-2">
                                <li><b>Niveau :</b> {niveau}</li>
                                <li><b>Discipline :</b> {discipline}</li>
                                <li><b>Thèmes :</b> {themes.join(", ")}</li>
                                <li><b>Nombre de questions :</b> {numQuestions}</li>
                                <li><b>Type :</b> {tournamentType === 'live' ? 'Tournoi en direct' : 'Tournoi différé'}</li>
                            </ul>
                            {error && <div className="alert alert-error justify-center mb-2">{error}</div>}
                            <button
                                className="btn btn-primary btn-lg mt-2"
                                disabled={!canCreate || loading}
                                onClick={handleCreateTournament}
                            >
                                {loading ? 'Création...' : 'Créer le tournoi'}
                            </button>
                            {created && tournamentCode && (
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <div className="alert alert-success justify-center">Tournoi créé !</div>
                                    <div className="text-2xl font-mono bg-base-200 px-6 py-2 rounded-xl border border-base-300">{tournamentCode}</div>
                                    <div className="text-sm text-base-content/60">Ce code est valable pour 24h</div>
                                    <button
                                        className="btn btn-info btn-sm mt-2"
                                        onClick={() => navigator.clipboard.writeText(tournamentCode)}
                                    >
                                        Copier le code
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
