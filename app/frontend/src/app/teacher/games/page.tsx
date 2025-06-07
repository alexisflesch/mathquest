"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { makeApiRequest } from '@/config/api';

// Interface for game template from backend
interface GameTemplate {
    id: string;
    name: string;
    gradeLevel: string | null;
    themes: string[];
    discipline: string | null;
    description: string | null;
    defaultMode: string | null;
    createdAt: string;
    updatedAt: string;
    creatorId: string;
    questions?: Array<{
        id: string;
        sequence: number;
    }>;
}

// Response interface for fetching game templates
interface GameTemplatesResponse {
    gameTemplates: GameTemplate[];
}

export default function TeacherGamesPage() {
    // Access guard: Require teacher access
    const { isAllowed } = useAccessGuard({
        allowStates: ['teacher'],
        redirectTo: '/teacher/login'
    });

    // If access is denied, the guard will handle redirection
    if (!isAllowed) {
        return null;
    }

    const [games, setGames] = useState<GameTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
    const { teacherId, userState, isTeacher } = useAuth();

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        setLoading(true);
        setError(null);
        try {
            // Check if user is authenticated as a teacher (use same logic as game creation)
            if (userState !== 'teacher' && !isTeacher) {
                setError('Impossible de trouver votre identifiant enseignant. Veuillez vous reconnecter.');
                setLoading(false);
                return;
            }

            console.log('Fetching game templates for teacher...');
            const response = await makeApiRequest<GameTemplatesResponse>(
                '/api/game-templates'
            );

            console.log('Game templates response:', response);
            setGames(response.gameTemplates);
        } catch (err: unknown) {
            setError((err as Error).message || 'Erreur lors du chargement de vos activités.');
        } finally {
            setLoading(false);
        }
    };

    const toggleGameExpansion = (gameId: string) => {
        setExpandedGameId(expandedGameId === gameId ? null : gameId);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const startActivity = async (templateId: string, playMode: 'quiz' | 'tournament' | 'practice') => {
        try {
            // Create a game instance from the template
            const gameData = {
                gameTemplateId: templateId,
                playMode: playMode,
                settings: {}
            };

            const response = await makeApiRequest<{ gameInstance: { id: string } }>('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });

            // Redirect to the game control dashboard
            window.open(`/teacher/dashboard/${response.gameInstance.id}`, '_blank');
        } catch (err: unknown) {
            alert(`Erreur lors du démarrage de l'activité: ${(err as Error).message}`);
        }
    };

    const duplicateTemplate = async (templateId: string) => {
        try {
            // Get the original template details first
            const originalTemplate = games.find(g => g.id === templateId);
            if (!originalTemplate) return;

            // Create a duplicate template
            const duplicateData = {
                name: `${originalTemplate.name} (Copie)`,
                gradeLevel: originalTemplate.gradeLevel,
                themes: originalTemplate.themes,
                discipline: originalTemplate.discipline,
                description: originalTemplate.description,
                defaultMode: originalTemplate.defaultMode,
                questions: originalTemplate.questions
            };

            await makeApiRequest('/api/game-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(duplicateData)
            });

            // Refresh the templates list
            await fetchGames();
            alert('Modèle d\'activité dupliqué avec succès !');
        } catch (err: unknown) {
            alert(`Erreur lors de la duplication: ${(err as Error).message}`);
        }
    };

    const deleteTemplate = async (templateId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle d\'activité ? Cette action est irréversible.')) {
            return;
        }

        try {
            await makeApiRequest(`/api/game-templates/${templateId}`, {
                method: 'DELETE'
            });

            // Refresh the templates list
            await fetchGames();
            alert('Modèle d\'activité supprimé avec succès !');
        } catch (err: unknown) {
            alert(`Erreur lors de la suppression: ${(err as Error).message}`);
        }
    };

    return (
        <div className="main-content">
            <div className="card w-full max-w-6xl shadow-xl bg-base-100 my-6">
                <div className="card-body">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="card-title text-3xl">Mes Activités</h1>
                        <Link href="/teacher/games/new" className="btn btn-primary">
                            Créer une nouvelle activité
                        </Link>
                    </div>

                    {loading && (
                        <div className="text-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                            <div className="text-muted mt-4">Chargement de vos activités...</div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mb-6">
                            <span>{error}</span>
                            <button className="btn btn-sm btn-outline" onClick={fetchGames}>
                                Réessayer
                            </button>
                        </div>
                    )}

                    {!loading && !error && games.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold mb-2">Aucune activité créée</h3>
                            <p className="text-muted mb-6">
                                Commencez par créer votre première activité pour engager vos élèves.
                            </p>
                            <Link href="/teacher/games/new" className="btn btn-primary">
                                Créer ma première activité
                            </Link>
                        </div>
                    )}

                    {!loading && !error && games.length > 0 && (
                        <div className="space-y-4">
                            {games.map((template) => (
                                <div key={template.id} className="card bg-base-200 shadow-sm">
                                    <div className="card-body">
                                        <div
                                            className="flex justify-between items-start cursor-pointer"
                                            onClick={() => toggleGameExpansion(template.id)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">{template.name}</h3>
                                                    {template.defaultMode && (
                                                        <span className="badge badge-outline">
                                                            {template.defaultMode === 'quiz' ? 'Quiz' :
                                                                template.defaultMode === 'tournament' ? 'Tournoi' :
                                                                    template.defaultMode === 'practice' ? 'Pratique' :
                                                                        template.defaultMode}
                                                        </span>
                                                    )}
                                                    {template.gradeLevel && (
                                                        <span className="badge badge-secondary">{template.gradeLevel}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted">
                                                    <div>Créé le: {formatDate(template.createdAt)}</div>
                                                    {template.discipline && <div>Discipline: {template.discipline}</div>}
                                                    {template.themes && template.themes.length > 0 && (
                                                        <div>Thèmes: {template.themes.join(', ')}</div>
                                                    )}
                                                    {template.questions && (
                                                        <div>Questions: {template.questions.length}</div>
                                                    )}
                                                    {template.description && (
                                                        <div className="mt-1 text-xs">{template.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className={`btn btn-sm btn-ghost ${expandedGameId === template.id ? 'btn-active' : ''}`}
                                                >
                                                    {expandedGameId === template.id ? '▲' : '▼'}
                                                </button>
                                            </div>
                                        </div>

                                        {expandedGameId === template.id && (
                                            <div className="mt-4 pt-4 border-t border-base-300">
                                                <div className="mb-4">
                                                    <h4 className="font-semibold mb-3">Démarrer une activité:</h4>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => startActivity(template.id, 'quiz')}
                                                        >
                                                            🎯 Démarrer un Quiz
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => startActivity(template.id, 'tournament')}
                                                        >
                                                            🏆 Démarrer un Tournoi
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => startActivity(template.id, 'practice')}
                                                        >
                                                            📝 Démarrer un Entraînement
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        href={`/teacher/games/${template.id}/edit`}
                                                        className="btn btn-sm btn-outline btn-primary"
                                                    >
                                                        Éditer le modèle
                                                    </Link>

                                                    <button
                                                        className="btn btn-sm btn-outline btn-secondary"
                                                        onClick={() => duplicateTemplate(template.id)}
                                                    >
                                                        Dupliquer
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-outline btn-error"
                                                        onClick={() => deleteTemplate(template.id)}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
