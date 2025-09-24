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
import EnhancedSingleSelectDropdown from "@/components/EnhancedSingleSelectDropdown";
import { createLogger } from '@/clientLogger';
import { makeApiRequest } from '@/config/api';
import { QuestionsCountResponseSchema, GameCreationResponseSchema, type QuestionsCountResponse, type GameCreationResponse, type Question } from '@/types/api';
import { QuestionsFiltersResponseSchema, type QuestionsFiltersResponse } from '@shared/types/api/schemas';
import { useAuth } from '@/components/AuthProvider';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { sortGradeLevels } from '@/utils/gradeLevelSort';

// Create a logger for this component
const logger = createLogger('CreateTournament');

interface Filters {
    gradeLevel: string[];
    disciplines: string[];
    themes: string[];
}

const QUESTION_OPTIONS = [5, 10, 20, 30];

function StudentCreateTournamentPageInner() {
    const { userProfile } = useAuth();

    const [step, setStep] = useState(1);
    const [filters, setFilters] = useState<Filters>({ gradeLevel: [], disciplines: [], themes: [] });
    const [niveau, setNiveau] = useState("");
    const [discipline, setDiscipline] = useState("");
    const [themes, setThemes] = useState<string[]>([]);
    const [numQuestions, setNumQuestions] = useState(5);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [canCreate, setCanCreate] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isTraining, setIsTraining] = useState(false);
    const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([]);
    const [availableThemes, setAvailableThemes] = useState<string[]>([]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (isTraining) {
            params.append('mode', 'practice');
        } else {
            params.append('mode', 'tournament');
        }

        const url = params.toString() ? `/api/questions/filters?${params.toString()}` : '/api/questions/filters';

        makeApiRequest<QuestionsFiltersResponse>(url, undefined, undefined, QuestionsFiltersResponseSchema)
            .then((data) => {
                // Extract values from FilterOption objects to match local Filters interface
                const cleanedData = {
                    gradeLevel: sortGradeLevels(data.gradeLevel.map(option => option.value)),
                    disciplines: data.disciplines.map(option => option.value),
                    themes: data.themes.map(option => option.value)
                };
                setFilters(cleanedData);
                logger.debug("Loaded filters", cleanedData);
            })
            .catch((err) => {
                logger.error("Error loading filters", err);
            });
    }, [isTraining]);

    // Fetch disciplines when niveau changes
    useEffect(() => {
        if (niveau) {
            setDiscipline("");
            setThemes([]);
            setAvailableThemes([]);

            // Use secure filters API to get disciplines filtered by niveau
            const params = new URLSearchParams();
            params.append('gradeLevel', niveau);
            if (isTraining) {
                params.append('mode', 'practice');
            } else {
                params.append('mode', 'tournament');
            }

            makeApiRequest<QuestionsFiltersResponse>(`/api/questions/filters?${params.toString()}`, undefined, undefined, QuestionsFiltersResponseSchema)
                .then(data => {
                    setAvailableDisciplines(data.disciplines.filter(option => option.isCompatible).map(option => option.value).sort());
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
    }, [niveau, isTraining]);

    // Fetch themes when discipline changes
    useEffect(() => {
        if (discipline && niveau) {
            setThemes([]);

            // Use secure filters API to get themes filtered by discipline and niveau
            const params = new URLSearchParams();
            params.append('gradeLevel', niveau);
            params.append('discipline', discipline);
            if (isTraining) {
                params.append('mode', 'practice');
            } else {
                params.append('mode', 'tournament');
            }

            makeApiRequest<QuestionsFiltersResponse>(`/api/questions/filters?${params.toString()}`, undefined, undefined, QuestionsFiltersResponseSchema)
                .then(data => {
                    setAvailableThemes(data.themes.filter(option => option.isCompatible).map(option => option.value).sort());
                })
                .catch(err => {
                    logger.error("Error loading themes", err);
                    setAvailableThemes([]);
                });
        } else {
            setAvailableThemes([]);
            setThemes([]);
        }
    }, [discipline, niveau, isTraining]);    // Check if enough questions exist for the selected filters
    useEffect(() => {
        if (niveau && discipline && themes.length > 0) {
            setLoading(true);
            setError(null);
            logger.debug("Checking question count for", { gradeLevel: niveau, discipline, themes, numQuestions });

            // Use secure list API to get question UIDs and count them locally
            const listParams = new URLSearchParams({
                gradeLevel: niveau,
                discipline: discipline,
                themes: themes.join(',')
            });

            // Add mode parameter based on training flag
            if (isTraining) {
                listParams.append('mode', 'practice');
            } else {
                listParams.append('mode', 'tournament');
            }

            makeApiRequest<string[]>(`/api/questions/list?${listParams.toString()}`)
                .then((questions) => {
                    const count = questions.length;
                    logger.debug("Question count response", { count });
                    if (count === 0) {
                        setCanCreate(false);
                        setError("Aucune question ne correspond à ces critères.");
                    } else if (count < numQuestions) {
                        // Show warning but still allow creation
                        setCanCreate(true);
                        setError(`Attention: Seulement ${count} question(s) disponible(s) pour ces critères. Vous en demandez ${numQuestions}. Le tournoi utilisera toutes les questions disponibles.`);
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
            logger.info("Creating tournament with", { gradeLevel: niveau, discipline, themes, numQuestions });
            // Defensive: ensure all filters are strings (not objects)
            const safeNiveau = typeof niveau === 'string' ? niveau : '';
            const safeDiscipline = typeof discipline === 'string' ? discipline : '';
            const safeThemes = Array.isArray(themes)
                ? themes.map((t: any) => typeof t === 'string' ? t : (t?.value || ''))
                : (typeof themes === 'string' ? [themes] : []);

            // Check if this is a training session - create practice GameInstance
            if (isTraining) {
                const avatar = getAvatar();
                const username = getUsername();

                // Create practice GameInstance with access code
                const requestBody = {
                    name: `${username}`,
                    playMode: 'practice',
                    gradeLevel: safeNiveau,
                    discipline: safeDiscipline,
                    themes: safeThemes,
                    nbOfQuestions: numQuestions,
                    settings: {
                        type: 'practice',
                        avatar: avatar,
                        username: username,
                        // Store practice criteria in settings for later extraction
                        practiceSettings: {
                            gradeLevel: safeNiveau,
                            discipline: safeDiscipline,
                            themes: safeThemes,
                            questionCount: numQuestions,
                            showImmediateFeedback: true,
                            allowRetry: true,
                            randomizeQuestions: false
                        }
                    }
                };

                logger.debug("Creating practice GameInstance", requestBody);
                const gameData = await makeApiRequest<GameCreationResponse>(
                    'games',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(requestBody),
                    },
                    undefined,
                    GameCreationResponseSchema
                );

                logger.info("Practice GameInstance created", gameData);

                // Redirect to new practice session page with access code
                // Don't reset loading state - let the redirect happen smoothly
                router.push(`/student/practice/${gameData.gameInstance.accessCode}`);
                return;
            }

            const avatar = getAvatar();
            const username = getUsername();

            // Create tournament directly - backend will handle authentication
            const requestBody = {
                name: `${username}`,
                playMode: 'tournament',
                gradeLevel: safeNiveau,
                discipline: safeDiscipline,
                themes: safeThemes,
                nbOfQuestions: numQuestions,
                status: 'pending',
                settings: {
                    type: 'direct', // for compatibility
                    defaultMode: 'direct',
                    avatar: avatar,
                    username: username
                }
            };

            logger.debug("Games API request body", requestBody);
            const gameData = await makeApiRequest<GameCreationResponse>(
                'games',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include', // Include cookies for authentication
                    body: JSON.stringify(requestBody),
                },
                undefined,
                GameCreationResponseSchema
            );

            logger.info("Tournament created successfully", { code: gameData.gameInstance.accessCode });
            // Don't reset loading state - let the redirect happen smoothly
            router.push(`/live/${gameData.gameInstance.accessCode}`);
        } catch (err: unknown) {
            logger.error("Error creating tournament", err);
            if (err instanceof Error) setError(err.message);
            else setError('Erreur lors de la création du tournoi.');
            // Only reset loading state on error
            setLoading(false);
        }
    };

    const getUsername = () => userProfile?.username || localStorage.getItem('mathquest_username') || 'Élève';
    const getAvatar = () => userProfile?.avatar || localStorage.getItem('mathquest_avatar') || '🐨';

    return (
        <div className="main-content" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <div className="card w-full max-w-xl shadow-xl" style={{ background: 'var(--card)', color: 'var(--foreground)' }}>
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
                            <EnhancedSingleSelectDropdown
                                label="Choisis un niveau"
                                options={filters.gradeLevel}
                                value={niveau}
                                onChange={(val) => { setNiveau(val); setStep(2); }}
                                placeholder="Niveau"
                                data-testid="grade-level-dropdown"
                            />
                        </div>
                    )}
                    {/* Step 2: Discipline */}
                    {step === 2 && (
                        <div className="w-full flex flex-col gap-4">
                            <EnhancedSingleSelectDropdown
                                label="Choisis une discipline"
                                options={availableDisciplines}
                                value={discipline}
                                onChange={(val) => { setDiscipline(val); setStep(3); }}
                                placeholder="Discipline"
                                data-testid="discipline-dropdown"
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
                                data-testid="themes-dropdown"
                            />
                            <div className="flex justify-end w-full">
                                <button
                                    className="btn btn-primary btn-sm mt-2"
                                    disabled={themes.length === 0}
                                    onClick={() => setStep(4)}
                                    style={{ minWidth: 90 }}
                                >
                                    Valider
                                </button>
                            </div>
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
                                        className="flex-1 rounded-lg border transition-colors duration-100 py-3 text-lg font-semibold"
                                        style={
                                            numQuestions === n
                                                ? {
                                                    background: 'var(--primary)',
                                                    color: 'var(--primary-foreground)',
                                                    borderColor: 'var(--primary)'
                                                }
                                                : {
                                                    background: 'var(--dropdown)',
                                                    color: 'var(--dropdown-foreground)',
                                                    borderColor: 'var(--primary)'
                                                }
                                        }
                                        onClick={() => setNumQuestions(n)}
                                        aria-pressed={numQuestions === n}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-end w-full">
                                <button
                                    className="btn btn-primary btn-sm mt-2"
                                    onClick={() => setStep(5)}
                                    style={{ minWidth: 90 }}
                                >
                                    Valider
                                </button>
                            </div>
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
                                    {logger.debug('Résumé création tournoi', { gradeLevel: niveau, discipline, themes, numQuestions, error })}
                                    <div className={`alert ${error.startsWith("Attention:") ? "alert-warning" : "alert-error"} justify-center mb-2`}>
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
                            <div className="flex justify-end w-full mt-4">
                                <button
                                    className="btn btn-primary btn-sm"
                                    disabled={!canCreate || loading}
                                    onClick={handleCreateTournament}
                                    style={{ minWidth: 120 }}
                                >
                                    {loading ? 'Création...' : isTraining ? 'Démarrer' : 'Continuer'}
                                </button>
                            </div>
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

// Access is now enforced by middleware; no need for useAccessGuard
