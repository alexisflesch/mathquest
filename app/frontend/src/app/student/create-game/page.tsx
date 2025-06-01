/**
 * Student Tournament Creation Page
 * 
 * This page provides a step-by-step wizard for students to create their own tournaments:
 * - Multi-step interface with navigation between steps
 * - Dynamic filtering of available disciplines and themes based on selected level
 * - Question count validation to ensure sufficient questions exist
 * - Automatic tournament creation and lobby redirection
 * 
 * The creation process intelligently filters available options at each step,
 * ensuring that students can only select valid combinations of level, discipline,
 * and themes that have associated questions. The page dynamically validates the
 * student's selections before allowing tournament creation.
 */

"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomDropdown from "@/components/CustomDropdown";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import { createLogger } from '@/clientLogger';
import { makeApiRequest } from '@/config/api';
import { buildQuestionsUrl } from '@/utils/apiUtils';

// Create a logger for this component
const logger = createLogger('CreateTournament');

interface Filters {
    niveaux: string[];
    disciplines: string[];
    themes: string[];
}

const QUESTION_OPTIONS = [10, 20, 30];

function StudentCreateTournamentPageInner() {
    const [step, setStep] = useState(1);
    const [filters, setFilters] = useState<Filters>({ niveaux: [], disciplines: [], themes: [] });
    const [niveau, setNiveau] = useState("");
    const [discipline, setDiscipline] = useState("");
    const [themes, setThemes] = useState<string[]>([]);
    const [numQuestions, setNumQuestions] = useState(10);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [canCreate, setCanCreate] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isTraining, setIsTraining] = useState(false);
    const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([]);
    const [availableThemes, setAvailableThemes] = useState<string[]>([]);

    useEffect(() => {
        makeApiRequest<Filters>('questions/filters')
            .then((data) => {
                setFilters(data);
                logger.debug("Loaded filters", data);
            })
            .catch((err) => {
                logger.error("Error loading filters", err);
            });
    }, []);

    // Fetch disciplines when niveau changes
    useEffect(() => {
        if (niveau) {
            setDiscipline("");
            setThemes([]);
            setAvailableThemes([]);

            // Use existing questions API to get disciplines for this niveau
            const disciplinesUrl = buildQuestionsUrl({
                gradeLevel: niveau,
                pageSize: 1000
            });
            makeApiRequest<{ questions: any[] }>(disciplinesUrl)
                .then(data => {
                    const uniqueDisciplines = [...new Set(data.questions.map(q => q.discipline).filter(Boolean))];
                    setAvailableDisciplines(uniqueDisciplines.sort());
                })
                .catch(err => {
                    logger.error("Error loading disciplines", err);
                    setAvailableDisciplines([]);
                });
        } else {
            setAvailableDisciplines([]);
            setAvailableThemes([]);
            setDiscipline("");
            setThemes([]);
        }
    }, [niveau]);

    // Fetch themes when discipline changes
    useEffect(() => {
        if (niveau && discipline) {
            setThemes([]);

            // Use existing questions API to get themes for this niveau and discipline
            const themesUrl = buildQuestionsUrl({
                gradeLevel: niveau,
                discipline: discipline,
                pageSize: 1000
            });
            makeApiRequest<{ questions: any[] }>(themesUrl)
                .then(data => {
                    const uniqueThemes = new Set<string>();
                    data.questions.forEach(q => {
                        if (Array.isArray(q.themes)) {
                            q.themes.forEach((theme: string) => uniqueThemes.add(theme));
                        }
                    });
                    setAvailableThemes(Array.from(uniqueThemes).sort());
                })
                .catch(err => {
                    logger.error("Error loading themes", err);
                    setAvailableThemes([]);
                });
        } else {
            setAvailableThemes([]);
            setThemes([]);
        }
    }, [niveau, discipline]);

    // Check if enough questions exist for the selected filters
    useEffect(() => {
        if (niveau && discipline && themes.length > 0) {
            setLoading(true);
            setError(null);
            logger.debug("Checking question count for", { niveau, discipline, themes, numQuestions });

            // Use existing questions API to count questions
            const questionsUrl = buildQuestionsUrl({
                gradeLevel: niveau,
                discipline: discipline,
                themes: themes,
                page: 1,
                pageSize: 1
            });
            makeApiRequest<{ total: number }>(questionsUrl)
                .then((data) => {
                    logger.debug("Question count response", data);
                    if (data.total === 0) {
                        setCanCreate(false);
                        setError("Aucune question ne correspond à ces critères.");
                    } else if (data.total < numQuestions) {
                        setCanCreate(true);
                        setError(`Seulement ${data.total} questions dans la base satisfaisant vos critères, continuer quand même ?`);
                    } else {
                        setCanCreate(true);
                        setError(null);
                    }
                })
                .catch((err) => {
                    setCanCreate(false);
                    setError("Erreur lors de la vérification des questions.");
                    logger.error("Error checking question count", err);
                })
                .finally(() => setLoading(false));
        } else {
            setCanCreate(false);
        }
    }, [niveau, discipline, themes, numQuestions]);

    useEffect(() => {
        // Detect 'training' flag in URL
        if (searchParams) {
            const trainingFlag = searchParams.get('training');
            setIsTraining(trainingFlag === '1' || trainingFlag === 'true');
        }
    }, [searchParams]);

    // Stepper UI
    const steps = [
        "Niveau",
        "Discipline",
        "Thèmes",
        "Questions",
        "Valider"
    ];

    // Determine if a step is available to go back to
    const canGoToStep = (idx: number) => {
        if (idx === 0) return true;
        if (idx === 1) return niveau !== "";
        if (idx === 2) return niveau !== "" && discipline !== "";
        if (idx === 3) return niveau !== "" && discipline !== "" && themes.length > 0;
        if (idx === 4) return niveau !== "" && discipline !== "" && themes.length > 0 && numQuestions > 0;
        return false;
    };

    // Handlers
    const handleCreateTournament = async () => {
        setLoading(true);
        setError(null);
        try {
            logger.info("Creating tournament with", { niveau, discipline, themes, numQuestions });
            // 1. Fetch question IDs matching filters using existing questions API
            interface Question { uid: string; }
            const questionsUrl = buildQuestionsUrl({
                gradeLevel: niveau,
                discipline: discipline,
                themes: themes,
                pageSize: numQuestions
            });
            const questionsResult = await makeApiRequest<{ questions: Question[] }>(questionsUrl);
            const questions = questionsResult.questions;

            logger.debug("Questions fetched", { count: questions.length });
            if (!questions || !Array.isArray(questions) || questions.length === 0) {
                setError('Aucune question ne correspond à ces critères.');
                setLoading(false);
                return;
            }
            if (isTraining) {
                // Only redirect to practice session, do NOT create a tournament
                const params = new URLSearchParams({
                    niveau,
                    discipline,
                    themes: themes.join(","),
                    limit: String(numQuestions),
                });
                router.push(`/student/practice/session?${params.toString()}`);
                return;
            }
            const avatar = localStorage.getItem('mathquest_avatar') || '';
            const username = localStorage.getItem('mathquest_username') || 'Élève';
            let cookie_id = localStorage.getItem('mathquest_cookie_id');
            if (!cookie_id) {
                cookie_id = Math.random().toString(36).substring(2) + Date.now();
                localStorage.setItem('mathquest_cookie_id', cookie_id);
            }

            // Get the student's User ID (should already be registered from /student page)
            let userId: string;
            try {
                const existingUser = await makeApiRequest<{ user: { id: string } }>(`players/cookie/${cookie_id}`);
                userId = existingUser.user.id;
                logger.debug("Found existing user", { userId, cookie_id });
            } catch (error) {
                // This shouldn't happen if the student properly registered via /student page
                logger.error("Student not found in database", { cookie_id, error });
                setError('Vous devez vous connecter avant de créer un tournoi.');
                setLoading(false);
                return;
            }

            // Convert to modern games API format
            const requestBody = {
                name: `${username}`,
                playMode: 'tournament',
                gradeLevel: niveau,
                discipline: discipline,
                themes: themes,
                nbOfQuestions: numQuestions,
                initiatorStudentId: userId, // Use the actual User ID instead of cookie_id
                settings: {
                    type: 'direct',
                    avatar: avatar,
                    username: username
                }
            };

            logger.debug("Games API request body", requestBody);
            const gameData = await makeApiRequest<{ gameInstance: { accessCode: string }; message?: string }>('games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            logger.info("Tournament created successfully", { code: gameData.gameInstance.accessCode });
            router.push(`/lobby/${gameData.gameInstance.accessCode}`);
        } catch (err: unknown) {
            logger.error("Error creating tournament", err);
            if (err instanceof Error) setError(err.message);
            else setError('Erreur lors de la création du tournoi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-xl shadow-xl bg-base-100 my-6">
                <div className="card-body items-center gap-8">
                    {/* Progress Bar DaisyUI */}
                    {/* All steps in a single row */}
                    <div className="w-full mb-4">
                        <div className="flex flex-row gap-0">
                            {steps.map((stepLabel, idx) => (
                                <div key={stepLabel} className="flex-1 flex flex-col items-center">
                                    <button
                                        type="button"
                                        className={`badge badge-stepper-xs badge-stepper ${step > idx + 1 ? "" : "badge-stepper-ghost"} ${canGoToStep(idx) && step !== idx + 1 ? "cursor-pointer" : "cursor-default"} transition`}
                                        style={{
                                            pointerEvents: canGoToStep(idx) && step !== idx + 1 ? "auto" : "none",
                                            background: "none",
                                            border: "none",
                                            outline: "none",
                                            boxShadow: "none",
                                            padding: 0,
                                        }}
                                        onClick={() => {
                                            if (canGoToStep(idx) && step !== idx + 1) setStep(idx + 1);
                                        }}
                                        tabIndex={canGoToStep(idx) && step !== idx + 1 ? 0 : -1}
                                        aria-disabled={!canGoToStep(idx) || step === idx + 1}
                                    >
                                        {idx + 1}
                                    </button>
                                    <span className="text-xs text-center w-14 h-5 whitespace-nowrap flex items-center justify-center step-label-xs">{stepLabel}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Step 1: Niveau */}
                    {step === 1 && (
                        <div className="w-full flex flex-col gap-4">
                            <CustomDropdown
                                label="Choisis un niveau"
                                options={filters.niveaux}
                                value={niveau}
                                onChange={(val) => { setNiveau(val); setStep(2); }}
                                placeholder="Niveau"
                            />
                        </div>
                    )}
                    {/* Step 2: Discipline */}
                    {step === 2 && (
                        <div className="w-full flex flex-col gap-4">
                            <CustomDropdown
                                label="Choisis une discipline"
                                options={availableDisciplines}
                                value={discipline}
                                onChange={(val) => { setDiscipline(val); setStep(3); }}
                                placeholder="Discipline"
                            />
                        </div>
                    )}
                    {/* Step 3: Thèmes (multi-select with checkboxes) */}
                    {step === 3 && (
                        <div className="w-full flex flex-col gap-4">
                            <MultiSelectDropdown
                                label="Choisis un ou plusieurs thèmes"
                                options={availableThemes}
                                selected={themes}
                                onChange={setThemes}
                                placeholder="Thèmes"
                                disabled={availableThemes.length === 0}
                            />
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
                                        className={`flex-1 rounded-lg border btn-primary transition-colors duration-100
                                            py-3 text-lg font-semibold
                                        `}
                                        style={
                                            numQuestions === n
                                                ? { backgroundColor: 'var(--navbar)', color: 'var(--primary-foreground)' }
                                                : { backgroundColor: '#fff', color: '#111827', borderColor: 'var(--navbar)' }
                                        }
                                        onClick={() => setNumQuestions(n)}
                                        onMouseEnter={e => {
                                            if (numQuestions !== n) {
                                                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (numQuestions !== n) {
                                                (e.currentTarget as HTMLButtonElement).style.color = "#111827";
                                            }
                                        }}
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
                    {/* Step 5: Confirmation */}
                    {step === 5 && (
                        <div className="w-full flex flex-col gap-4">
                            <div className="text-lg font-bold mb-2 text-center mt-2">Résumé</div>
                            <ul className="mb-2">
                                <li><b>Niveau :</b> {niveau}</li>
                                <li><b>Discipline :</b> {discipline}</li>
                                <li><b>Thèmes :</b> {themes.join(", ")}</li>
                                <li><b>Nombre de questions :</b> {numQuestions}</li>
                            </ul>
                            {error && (
                                <>
                                    {logger.debug('Résumé création tournoi', { niveau, discipline, themes, numQuestions, error })}
                                    <div className={`alert ${error.startsWith("Seulement") ? "alert-warning" : "alert-error"} justify-center mb-2`}>
                                        {error}
                                    </div>
                                </>
                            )}
                            {/* Info message before creating the tournament */}
                            <div className="text-base text-base-content/80 mb-2 mt-2">
                                {isTraining
                                    ? "Mode entraînement : vous allez être redirigé vers une session d'entraînement personnalisée."
                                    : "Le tournoi est prêt ! Vous allez être redirigé vers le lobby, où vous pourrez récupérer le lien à partager."}
                            </div>
                            <button
                                className="btn btn-primary w-fit self-center mt-4"
                                disabled={!canCreate || loading}
                                onClick={handleCreateTournament}
                            >
                                {loading ? 'Création...' : isTraining ? 'Commencer l\'entraînement' : 'Continuer'}
                            </button>
                            {/* The tournament code and copy button are no longer shown after creation */}
                            {/* 
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
                            */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function StudentCreateTournamentPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <StudentCreateTournamentPageInner />
        </Suspense>
    );
}
