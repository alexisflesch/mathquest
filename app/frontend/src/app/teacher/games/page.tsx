"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useAccessGuard } from '@/hooks/useAccessGuard';
import { makeApiRequest } from '@/config/api';
import { ChevronDown, ChevronUp, ChevronRight, Plus, Play, Edit2, Copy, Trash2, Clock, BookOpen, Users, Target, Zap, MoreHorizontal, X, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Snackbar from '@/components/Snackbar';
import ConfirmationModal from '@/components/ConfirmationModal';
import InfinitySpin from '@/components/InfinitySpin';

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

// Interface for game instance
interface GameInstance {
    id: string;
    name: string;
    accessCode: string | null;
    playMode: 'quiz' | 'tournament' | 'practice';
    status: 'pending' | 'active' | 'paused' | 'completed' | 'archived';
    createdAt: string;
    startedAt: string | null;
    endedAt: string | null;
    playerCount?: number;
}

// ActivityCard Component
interface ActivityCardProps {
    template: GameTemplate;
    expanded: boolean;
    onToggle: () => void;
    onStartActivity: (templateId: string, mode: 'quiz' | 'tournament' | 'practice') => Promise<{ gameId: string; gameCode?: string; mode: 'quiz' | 'tournament' | 'practice' }>;
    onDuplicate: (templateId: string) => void;
    onDelete: (templateId: string) => void;
    onDeleteInstance: (instanceId: string, instanceName: string) => void;
    formatDate: (dateString: string) => string;
    gameInstances: GameInstance[];
    onFetchGameInstances: (templateId: string) => Promise<void>;
}

function ActivityCard({ template, expanded, onToggle, onStartActivity, onDuplicate, onDelete, onDeleteInstance, formatDate, gameInstances, onFetchGameInstances }: ActivityCardProps) {
    const [startModal, setStartModal] = useState<{
        isOpen: boolean;
        templateId: string | null;
        templateName: string;
    }>({ isOpen: false, templateId: null, templateName: '' });
    const [loadingInstances, setLoadingInstances] = useState(false);

    const openStartModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setStartModal({ isOpen: true, templateId: template.id, templateName: template.name });
    };

    // Fetch game instances when expanded
    React.useEffect(() => {
        if (expanded && gameInstances.length === 0) {
            setLoadingInstances(true);
            onFetchGameInstances(template.id).finally(() => setLoadingInstances(false));
        }
    }, [expanded, template.id, gameInstances.length, onFetchGameInstances]);

    const handleStartActivity = async (mode: 'quiz' | 'tournament' | 'practice') => {
        const result = await onStartActivity(template.id, mode);
        // Don't close modal here - let the modal handle the transition
        return result;
    };

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'quiz': return <Target size={16} />;
            case 'tournament': return <Users size={16} />;
            case 'practice': return <Zap size={16} />;
            default: return <Play size={16} />;
        }
    };

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'quiz': return 'bg-[color:var(--muted)] text-[color:var(--primary)] border-[color:var(--border)]';
            case 'tournament': return 'bg-[color:var(--muted)] text-[color:var(--accent)] border-[color:var(--border)]';
            case 'practice': return 'bg-[color:var(--muted)] text-[color:var(--success)] border-[color:var(--border)]';
            default: return 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)] border-[color:var(--border)]';
        }
    };

    return (
        <>
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] hover:border-[color:var(--muted-foreground)] transition-colors rounded-lg overflow-hidden">
                {/* Card Header - Always Visible */}
                <div
                    className="p-3 sm:p-4 cursor-pointer"
                    onClick={onToggle}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <h3 className="text-lg font-semibold text-[color:var(--foreground)] truncate">{template.name}</h3>
                                {template.defaultMode && (
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getModeColor(template.defaultMode)}`}>
                                        {getModeIcon(template.defaultMode)}
                                        {template.defaultMode === 'quiz' ? 'Quiz' :
                                            template.defaultMode === 'tournament' ? 'Tournoi' :
                                                template.defaultMode === 'practice' ? 'Pratique' :
                                                    template.defaultMode}
                                    </span>
                                )}
                                {template.themes && template.themes.length > 0 && (
                                    <span className="text-xs text-[color:var(--muted-foreground)]">
                                        {template.themes.slice(0, 2).join(', ')}
                                        {template.themes.length > 2 && ` +${template.themes.length - 2}`}
                                    </span>
                                )}
                            </div>

                            <div className="text-sm text-[color:var(--muted-foreground)]">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatDate(template.createdAt)}
                                    </span>
                                    {template.questions && (
                                        <span className="flex items-center gap-1">
                                            <BookOpen size={14} />
                                            {template.questions.length} question{template.questions.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={openStartModal}
                                className="p-2 text-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:bg-opacity-10 rounded transition-colors"
                                title="Lancer l'activité"
                            >
                                <Play size={16} />
                            </button>
                            <Link
                                href={`/teacher/games/${template.id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded transition-colors"
                                title="Éditer l'activité"
                            >
                                <Edit2 size={16} />
                            </Link>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicate(template.id);
                                }}
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] hover:bg-[color:var(--muted)] rounded transition-colors"
                                title="Dupliquer l'activité"
                            >
                                <Copy size={16} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(template.id);
                                }}
                                className="p-2 text-[color:var(--alert)] hover:bg-[color:var(--alert)] hover:bg-opacity-10 rounded transition-colors"
                                title="Supprimer l'activité"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                className="p-2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                                title={expanded ? "Réduire" : "Développer"}
                            >
                                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expanded Content with Framer Motion */}
                <AnimatePresence initial={false}>
                    {expanded && (
                        <motion.div
                            key="expanded"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="border-t border-[color:var(--border)] bg-[color:var(--muted)] rounded-b-lg overflow-hidden"
                        >
                            <div className="p-3 sm:p-4">
                                {template.description && (
                                    <div className="mb-3">
                                        <p className="text-sm text-[color:var(--muted-foreground)]">{template.description}</p>
                                    </div>
                                )}

                                {/* Game Instances Section */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-[color:var(--foreground)] mb-2">
                                        Sessions actives
                                        {!loadingInstances && (
                                            <span className="ml-2 text-xs text-[color:var(--muted-foreground)] font-normal">
                                                ({gameInstances.length})
                                            </span>
                                        )}
                                    </h4>
                                    {loadingInstances ? (
                                        <div className="flex items-center gap-3 text-sm text-[color:var(--muted-foreground)]">
                                            <InfinitySpin size={20} />
                                            Chargement des sessions...
                                        </div>
                                    ) : gameInstances.length > 0 ? (
                                        <div className="space-y-2">
                                            {gameInstances.map((instance) => (
                                                <div
                                                    key={instance.id}
                                                    className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1 rounded ${getModeColor(instance.playMode)}`}>
                                                                {getModeIcon(instance.playMode)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-[color:var(--foreground)]">
                                                                    {instance.playMode === 'quiz' ? 'Quiz' :
                                                                        instance.playMode === 'tournament' ? 'Tournoi' : 'Entraînement'}
                                                                </div>
                                                                <div className="text-xs text-[color:var(--muted-foreground)]">
                                                                    {formatDate(instance.createdAt)}
                                                                    {instance.accessCode && (
                                                                        <span className="ml-2">• Code: {instance.accessCode}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-1 text-xs rounded-full ${instance.status === 'pending' ? 'bg-[color:var(--muted)] text-[color:var(--muted-foreground)]' :
                                                                instance.status === 'active' ? 'bg-[color:var(--success)] text-[color:var(--card)]' :
                                                                    instance.status === 'completed' ? 'bg-[color:var(--primary)] text-[color:var(--card)]' :
                                                                        'bg-[color:var(--alert)] text-[color:var(--card)]'
                                                                }`}>
                                                                {instance.status === 'pending' ? 'En attente' :
                                                                    instance.status === 'active' ? 'Active' :
                                                                        instance.status === 'completed' ? 'Terminée' : 'Annulée'}
                                                            </span>
                                                            {instance.playMode === 'quiz' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        window.open(`/teacher/dashboard/${instance.accessCode}`, '_blank');
                                                                    }}
                                                                    className="text-xs px-2 py-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded hover:bg-opacity-90 transition-colors"
                                                                >
                                                                    {instance.status === 'active' || instance.status === 'pending' ? 'Piloter' :
                                                                        instance.status === 'completed' ? 'Voir résultats' : 'Voir détails'}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onDeleteInstance(instance.id, `${instance.playMode === 'quiz' ? 'Quiz' : instance.playMode === 'tournament' ? 'Tournoi' : 'Entraînement'} - ${formatDate(instance.createdAt)}`);
                                                                }}
                                                                className="p-1 text-[color:var(--alert)] hover:bg-[color:var(--alert)] hover:bg-opacity-10 rounded transition-colors"
                                                                title="Supprimer cette session"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[color:var(--muted-foreground)]">
                                            Aucune session active pour cette activité.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Start Activity Modal */}
            {startModal.isOpen && (
                <StartActivityModal
                    isOpen={startModal.isOpen}
                    templateName={startModal.templateName}
                    onClose={() => setStartModal({ isOpen: false, templateId: null, templateName: '' })}
                    onStart={handleStartActivity}
                />
            )}
        </>
    );
}

// StartActivityModal Component
interface StartActivityModalProps {
    isOpen: boolean;
    templateName: string;
    onClose: () => void;
    onStart: (mode: 'quiz' | 'tournament' | 'practice') => Promise<{ gameId: string; gameCode?: string; mode: 'quiz' | 'tournament' | 'practice' }>;
}

function StartActivityModal({ isOpen, templateName, onClose, onStart }: StartActivityModalProps) {
    const [currentStep, setCurrentStep] = useState<'selection' | 'success'>('selection');
    const [gameInfo, setGameInfo] = useState<{
        gameId: string;
        gameCode?: string;
        mode: 'quiz' | 'tournament' | 'practice';
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    if (!isOpen) return null;

    const handleStart = async (mode: 'quiz' | 'tournament' | 'practice') => {
        setIsLoading(true);
        try {
            const result = await onStart(mode);
            setGameInfo(result);
            setCurrentStep('success');
        } catch (error) {
            console.error('Error starting activity:', error);
            alert('Erreur lors du démarrage de l\'activité');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentStep('selection');
        setGameInfo(null);
        setIsLoading(false);
        onClose();
    };

    const copyGameCode = () => {
        if (gameInfo?.gameCode) {
            navigator.clipboard.writeText(gameInfo.gameCode);
            setSnackbarOpen(true);
        }
    };

    const shareGameCode = () => {
        if (gameInfo?.gameCode && navigator.share) {
            navigator.share({
                title: `Code d'accès pour ${templateName}`,
                text: `Rejoignez l'activité "${templateName}" avec le code: ${gameInfo.gameCode}`,
            }).catch(console.error);
        } else if (gameInfo?.gameCode) {
            // Fallback to copy if Web Share API is not available
            copyGameCode();
        }
    };

    const modes = [
        {
            id: 'quiz' as const,
            name: 'Quiz',
            description: 'Évaluation en temps réel avec classement instantané',
            icon: <Target size={22} className="text-primary" />,
        },
        {
            id: 'tournament' as const,
            name: 'Tournoi',
            description: 'Compétition par équipes avec élimination',
            icon: <Users size={22} className="text-accent" />,
        },
        {
            id: 'practice' as const,
            name: 'Entraînement',
            description: 'Pratique libre sans contrainte de temps',
            icon: <Zap size={22} className="text-success" />,
        }
    ];

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
        >
            <motion.div
                className="bg-[color:var(--card)] rounded-lg p-6 w-full max-w-md mx-4 relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <AnimatePresence mode="wait">
                    {currentStep === 'selection' && (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Démarrer "{templateName}"</h3>
                                <button
                                    onClick={handleClose}
                                    className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-[color:var(--muted-foreground)] mb-6 text-sm">
                                Choisissez le mode de jeu qui correspond le mieux à vos objectifs pédagogiques.
                            </p>

                            <div className="space-y-3">
                                {modes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => handleStart(mode.id)}
                                        disabled={isLoading}
                                        className="w-full p-4 text-left border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex-shrink-0">{mode.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-[color:var(--primary)]">{mode.name}</div>
                                                <div className="text-sm text-[color:var(--muted-foreground)] mt-1">
                                                    {mode.description}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {isLoading && (
                                <div className="flex items-center justify-center mt-4">
                                    <InfinitySpin size={24} />
                                    <span className="ml-2 text-sm text-[color:var(--muted-foreground)]">Création en cours...</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {currentStep === 'success' && gameInfo && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-[color:var(--foreground)]">Activité créée !</h3>
                                <button
                                    onClick={handleClose}
                                    className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {gameInfo.mode === 'quiz' ? (
                                <>
                                    <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg p-4 mb-4">
                                        <div className="text-sm text-[color:var(--success)] mb-2">
                                            Code d'accès pour vos élèves :
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-[color:var(--card)] px-3 py-2 rounded border text-lg font-mono font-bold text-[color:var(--success)] flex-1">
                                                {gameInfo.gameCode}
                                            </code>
                                            <button
                                                onClick={copyGameCode}
                                                className="p-2 text-[color:var(--success)] hover:bg-[color:var(--muted)] rounded"
                                                title="Copier le code"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={shareGameCode}
                                                className="p-2 text-[color:var(--success)] hover:bg-[color:var(--muted)] rounded"
                                                title="Partager le code"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[color:var(--muted-foreground)] mb-6 text-sm">
                                        Partagez ce code avec vos élèves pour qu'ils puissent rejoindre l'activité.
                                        Vous pouvez maintenant surveiller leur progression en temps réel.
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => window.open(`/teacher/dashboard/${gameInfo.gameId}`, '_blank')}
                                            className="flex-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-center"
                                        >
                                            Surveiller l'activité
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </>
                            ) : gameInfo.mode === 'tournament' ? (
                                <>
                                    <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg p-4 mb-4">
                                        <div className="text-sm text-[color:var(--accent)] mb-2">
                                            Code d'accès pour vos élèves :
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-[color:var(--card)] px-3 py-2 rounded border text-lg font-mono font-bold text-[color:var(--accent)] flex-1">
                                                {gameInfo.gameCode}
                                            </code>
                                            <button
                                                onClick={copyGameCode}
                                                className="p-2 text-[color:var(--accent)] hover:bg-[color:var(--muted)] rounded"
                                                title="Copier le code"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={shareGameCode}
                                                className="p-2 text-[color:var(--accent)] hover:bg-[color:var(--muted)] rounded"
                                                title="Partager le code"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[color:var(--muted-foreground)] mb-6 text-sm">
                                        Partagez ce code avec vos élèves pour qu'ils puissent rejoindre le tournoi.
                                        Les équipes s'affronteront dans une compétition passionnante !
                                    </p>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="bg-[color:var(--muted)] border border-[color:var(--border)] rounded-lg p-4 mb-4">
                                        <div className="text-sm text-[color:var(--primary)] mb-2">
                                            Code d'accès pour vos élèves :
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="bg-[color:var(--card)] px-3 py-2 rounded border text-lg font-mono font-bold text-[color:var(--primary)] flex-1">
                                                {gameInfo.gameCode}
                                            </code>
                                            <button
                                                onClick={copyGameCode}
                                                className="p-2 text-[color:var(--primary)] hover:bg-[color:var(--muted)] rounded"
                                                title="Copier le code"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={shareGameCode}
                                                className="p-2 text-[color:var(--primary)] hover:bg-[color:var(--muted)] rounded"
                                                title="Partager le code"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[color:var(--muted-foreground)] mb-6 text-sm">
                                        En mode pratique, les élèves peuvent s'entraîner à leur rythme sans contrainte de temps.
                                        Partagez ce code pour qu'ils puissent accéder à l'activité.
                                    </p>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleClose}
                                            className="px-6 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Snackbar for copy notification */}
            <Snackbar
                open={snackbarOpen}
                message="Copié dans le presse-papier"
                type="success"
                onClose={() => setSnackbarOpen(false)}
                duration={2000}
            />
        </motion.div>
    );
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
    const [expandedGameIds, setExpandedGameIds] = useState<Set<string>>(new Set());
    const [gameInstances, setGameInstances] = useState<Record<string, GameInstance[]>>({});
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        templateId: string | null;
        templateName: string;
        isLoading: boolean;
        forceDelete?: boolean;
    }>({ isOpen: false, templateId: null, templateName: '', isLoading: false });

    const [deleteInstanceModal, setDeleteInstanceModal] = useState<{
        isOpen: boolean;
        instanceId: string | null;
        instanceName: string;
        isLoading: boolean;
    }>({ isOpen: false, instanceId: null, instanceName: '', isLoading: false });
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        defaultMode: 'success' | 'error';
    }>({ open: false, message: '', defaultMode: 'success' });
    const { teacherId, userState, isTeacher } = useAuth();

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = useCallback(async () => {
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
    }, [userState, isTeacher]);

    const toggleGameExpansion = useCallback((gameId: string) => {
        setExpandedGameIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(gameId)) {
                newSet.delete(gameId);
            } else {
                newSet.add(gameId);
            }
            return newSet;
        });
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []); const fetchGameInstances = useCallback(async (templateId: string) => {
        try {
            const response = await makeApiRequest<{ gameInstances: GameInstance[] }>(
                `/api/game-templates/${templateId}/instances`
            );

            setGameInstances(prev => ({
                ...prev,
                [templateId]: response.gameInstances
            }));
        } catch (err: unknown) {
            console.error('Error fetching game instances:', err);
            // Set empty array on error to avoid infinite loading
            setGameInstances(prev => ({
                ...prev,
                [templateId]: []
            }));
        }
    }, []);

    const startActivity = useCallback(async (templateId: string, playMode: 'quiz' | 'tournament' | 'practice') => {
        try {
            // Find the template to get its name
            const template = games.find(g => g.id === templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Create a game instance from the template
            const gameData = {
                name: template.name, // Include the required name field
                gameTemplateId: templateId,
                playMode: playMode,
                settings: {}
            };

            const response = await makeApiRequest<{ gameInstance: { id: string, accessCode?: string } }>('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gameData)
            });

            // Refresh the game instances for this template
            await fetchGameInstances(templateId);

            // Return the game info for the modal
            return {
                gameId: response.gameInstance.id,
                gameCode: response.gameInstance.accessCode, // Map accessCode to gameCode for compatibility
                mode: playMode
            };
        } catch (err: unknown) {
            throw new Error(`Erreur lors du démarrage de l'activité: ${(err as Error).message}`);
        }
    }, [games, fetchGameInstances]);

    const duplicateTemplate = useCallback(async (templateId: string) => {
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
    }, [games, fetchGames]);

    const deleteTemplate = useCallback(async (templateId: string) => {
        // Find the template to get its name for the modal
        const template = games.find(g => g.id === templateId);
        if (!template) return;

        // Open the confirmation modal
        setDeleteModal({
            isOpen: true,
            templateId,
            templateName: template.name,
            isLoading: false
        });
    }, [games]);

    const handleConfirmDelete = async () => {
        if (!deleteModal.templateId) return;

        setDeleteModal(prev => ({ ...prev, isLoading: true }));

        try {
            const url = deleteModal.forceDelete
                ? `/api/game-templates/${deleteModal.templateId}?force=true`
                : `/api/game-templates/${deleteModal.templateId}`;

            await makeApiRequest(url, {
                method: 'DELETE'
            });

            // Refresh the templates list
            await fetchGames();

            // Close modal and show success message
            setDeleteModal({ isOpen: false, templateId: null, templateName: '', isLoading: false });
            const successMessage = deleteModal.forceDelete
                ? 'Activité et toutes ses sessions supprimées avec succès !'
                : 'Activité supprimée avec succès !';
            setSnackbar({
                open: true,
                message: successMessage,
                defaultMode: 'success'
            });
        } catch (err: unknown) {
            const error = err as Error;
            setDeleteModal(prev => ({ ...prev, isLoading: false }));

            // If it's a 409 conflict error, offer force delete option
            if (error.message.includes('game session') && !deleteModal.forceDelete) {
                // Don't show error snackbar, just update modal to show force delete option
                setDeleteModal(prev => ({ ...prev, forceDelete: true }));
            } else {
                // Close modal and show error message
                const errorMessage = `Erreur lors de la suppression: ${error.message}`;
                setDeleteModal({ isOpen: false, templateId: null, templateName: '', isLoading: false });
                setSnackbar({
                    open: true,
                    message: errorMessage,
                    defaultMode: 'error'
                });
            }
        }
    };

    const handleDeleteInstance = useCallback(async (instanceId: string, instanceName: string) => {
        setDeleteInstanceModal({
            isOpen: true,
            instanceId,
            instanceName,
            isLoading: false
        });
    }, []);

    const handleConfirmDeleteInstance = async () => {
        if (!deleteInstanceModal.instanceId) return;

        setDeleteInstanceModal(prev => ({ ...prev, isLoading: true }));

        try {
            await makeApiRequest(`/api/games/${deleteInstanceModal.instanceId}`, {
                method: 'DELETE'
            });

            // Refresh game instances for all expanded templates
            const promises = Array.from(expandedGameIds).map(templateId =>
                fetchGameInstances(templateId)
            );
            await Promise.all(promises);

            // Close modal and show success message
            setDeleteInstanceModal({ isOpen: false, instanceId: null, instanceName: '', isLoading: false });
            setSnackbar({
                open: true,
                message: 'Session supprimée avec succès !',
                defaultMode: 'success'
            });
        } catch (err: unknown) {
            setDeleteInstanceModal(prev => ({ ...prev, isLoading: false }));
            setSnackbar({
                open: true,
                message: `Erreur lors de la suppression: ${(err as Error).message}`,
                defaultMode: 'error'
            });
        }
    };

    const handleCancelDelete = () => {
        if (!deleteModal.isLoading) {
            setDeleteModal({ isOpen: false, templateId: null, templateName: '', isLoading: false });
        }
    };

    const handleCancelDeleteInstance = () => {
        if (!deleteInstanceModal.isLoading) {
            setDeleteInstanceModal({ isOpen: false, instanceId: null, instanceName: '', isLoading: false });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background border-b border-[color:var(--border)] px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mes Activités</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                {games.length} activité{games.length !== 1 ? 's' : ''} créée{games.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="hidden sm:block">
                            <Link href="/teacher/games/new" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                                <Plus size={20} />
                                Créer une activité
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <InfinitySpin size={48} />
                        <p className="text-muted-foreground mt-4">Chargement de vos activités...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-[color:var(--alert)] bg-opacity-10 border border-[color:var(--alert)] border-opacity-30 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <p className="text-[color:var(--alert)]">{error}</p>
                            <button
                                onClick={fetchGames}
                                className="text-[color:var(--alert)] hover:text-[color:var(--alert)] hover:opacity-80 font-medium text-sm"
                            >
                                Réessayer
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && games.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 mx-auto mb-6 bg-[color:var(--muted)] rounded-full flex items-center justify-center">
                            <BookOpen size={40} className="text-[color:var(--muted-foreground)]" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Aucune activité créée</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Commencez par créer votre première activité pour engager vos élèves dans l'apprentissage des mathématiques.
                        </p>
                        <Link href="/teacher/games/new" className="btn-primary flex items-center gap-2 whitespace-nowrap">
                            <Plus size={20} />
                            Créer ma première activité
                        </Link>
                    </div>
                )}

                {!loading && !error && games.length > 0 && (
                    <div className="grid gap-3 sm:gap-4">
                        {games.map((template) => (
                            <ActivityCard
                                key={template.id}
                                template={template}
                                expanded={expandedGameIds.has(template.id)}
                                onToggle={() => toggleGameExpansion(template.id)}
                                onStartActivity={startActivity}
                                onDuplicate={duplicateTemplate}
                                onDelete={deleteTemplate}
                                onDeleteInstance={handleDeleteInstance}
                                formatDate={formatDate}
                                gameInstances={gameInstances[template.id] || []}
                                onFetchGameInstances={fetchGameInstances}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile FAB */}
            <div className="sm:hidden">
                <Link
                    href="/teacher/games/new"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-navbar transition-colors"
                >
                    <Plus size={24} />
                </Link>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Supprimer l'activité"
                message={deleteModal.forceDelete
                    ? `Il existe des sessions de jeu liées à "${deleteModal.templateName}". Voulez-vous supprimer l'activité ET toutes ses sessions ? Cette action est irréversible.`
                    : `Êtes-vous sûr de vouloir supprimer "${deleteModal.templateName}" ? Cette action est irréversible.`
                }
                confirmText={deleteModal.forceDelete ? "Supprimer tout" : "Supprimer"}
                cancelText="Annuler"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                type="danger"
                isLoading={deleteModal.isLoading}
            />

            {/* Delete Instance Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteInstanceModal.isOpen}
                title="Supprimer la session de jeu"
                message={`Êtes-vous sûr de vouloir supprimer la session "${deleteInstanceModal.instanceName}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                onConfirm={handleConfirmDeleteInstance}
                onCancel={handleCancelDeleteInstance}
                type="danger"
                isLoading={deleteInstanceModal.isLoading}
            />

            {/* Success/Error Snackbar */}
            <Snackbar
                open={snackbar.open}
                message={snackbar.message}
                type={snackbar.defaultMode}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                duration={3000}
            />
        </div>
    );
}
