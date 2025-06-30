import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Users, Dumbbell, Copy, Share2 } from 'lucide-react';
import InfinitySpin from '@/components/InfinitySpin';
import InfoModal from '@/components/SharedModal';
import Snackbar from '@/components/Snackbar';


interface StartActivityModalProps {
    isOpen: boolean;
    templateName: string;
    onClose: () => void;
    onStart: (mode: 'quiz' | 'tournament' | 'practice', name: string) => Promise<{ gameId: string; gameCode?: string; mode: 'quiz' | 'tournament' | 'practice' }>;
}


const StartActivityModal: React.FC<StartActivityModalProps> = ({ isOpen, templateName, onClose, onStart }) => {
    const [currentStep, setCurrentStep] = useState<'selection' | 'success'>('selection');
    const [gameInfo, setGameInfo] = useState<{
        gameId: string;
        gameCode?: string;
        mode: 'quiz' | 'tournament' | 'practice';
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [name, setName] = useState<string>('Ma session');
    const [nameTouched, setNameTouched] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setName('Ma session');
            setNameTouched(false);
        }
    }, [isOpen]);

    const handleStart = async (mode: 'quiz' | 'tournament' | 'practice') => {
        setNameTouched(true);
        if (!name.trim()) return;
        setIsLoading(true);
        try {
            const result = await onStart(mode, name.trim());
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
            copyGameCode();
        }
    };

    const modes = [
        {
            id: 'quiz' as const,
            name: 'Quiz',
            description: 'Pour une utilisation en classe',
            icon: (
                <span
                    style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    className="inline-flex items-center justify-center rounded-full w-9 h-9"
                >
                    <Target size={22} stroke="currentColor" />
                </span>
            ),
            action: () => handleStart('quiz')
        },
        {
            id: 'tournament' as const,
            name: 'Tournoi',
            description: 'Compétition en direct ou en différé',
            icon: (
                <span
                    style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
                    className="inline-flex items-center justify-center rounded-full w-9 h-9"
                >
                    <Users size={22} stroke="currentColor" />
                </span>
            ),
            action: () => handleStart('tournament')
        },
        {
            id: 'practice' as const,
            name: 'Entraînement',
            description: 'Pratique libre sans contrainte de temps',
            icon: (
                <span
                    style={{ background: 'var(--success)', color: 'var(--success-foreground)' }}
                    className="inline-flex items-center justify-center rounded-full w-9 h-9"
                >
                    <Dumbbell size={22} stroke="currentColor" />
                </span>
            ),
            action: () => handleStart('practice')
        }
    ];

    const getModeColor = (mode: string) => {
        switch (mode) {
            case 'quiz':
                return 'var(--primary)';
            case 'tournament':
                return 'var(--secondary)';
            case 'practice':
                return 'var(--success)';
            default:
                return 'var(--primary)';
        }
    };

    return (
        <>
            {/* Mode Selection Modal */}
            <AnimatePresence>
                {isOpen && currentStep === 'selection' && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    >
                        <motion.div
                            className="bg-[color:var(--card)] rounded-lg p-6 w-full max-w-md mx-4 relative border border-[color:var(--border)]"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}

                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg text-[color:var(--foreground)]">
                                    <span className="font-semibold">Démarrer l'activité </span>
                                    <span className="italic" style={{ color: 'var(--foreground)', fontWeight: 'normal' }}>{templateName}</span>
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                                    aria-label="Close modal"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Game Name Input */}
                            <div className="mb-4">
                                <label htmlFor="game-name-input" className="block text-sm font-medium text-[color:var(--foreground)] mb-2">
                                    Nom de la session
                                </label>
                                <input
                                    id="game-name-input"
                                    type="text"
                                    className="w-full border border-[color:var(--border)] rounded px-3 py-2 bg-[color:var(--input)] text-[color:var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    onBlur={() => setNameTouched(true)}
                                    placeholder="Nom de la session"
                                    maxLength={64}
                                    autoFocus
                                />
                                {nameTouched && !name.trim() && (
                                    <div className="text-xs text-red-500 mt-1">Le nom est requis.</div>
                                )}
                            </div>

                            <p className="text-sm font-medium text-[color:var(--foreground)] mb-4 mt-2">
                                Choisissez un mode de jeu.
                            </p>

                            <div className="space-y-3">
                                {modes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={mode.action}
                                        disabled={isLoading || !name.trim()}
                                        className="w-full p-4 text-left border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex-shrink-0">{mode.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-[color:var(--foreground)]">{mode.name}</div>
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal with Access Code */}
            <InfoModal
                isOpen={isOpen && currentStep === 'success' && gameInfo !== null}
                onClose={handleClose}
                showCloseButton={false}
                title={undefined}
                size="sm"
                className=""
            >
                <div className="space-y-4">
                    {/* Access code display */}
                    <div
                        className="bg-[color:var(--muted)] rounded-lg p-4 border"
                        style={{ borderColor: getModeColor(gameInfo?.mode || 'quiz') }}
                    >
                        <div className="text-sm mb-2 font-medium text-[color:var(--foreground)]">
                            Code d'accès pour vos élèves :
                        </div>
                        <div className="flex items-center gap-2">
                            <code
                                className="bg-[color:var(--card)] px-3 py-2 rounded border text-lg font-mono font-bold flex-1 text-[color:var(--foreground)]"
                                style={{ borderColor: getModeColor(gameInfo?.mode || 'quiz') }}
                            >
                                {gameInfo?.gameCode}
                            </code>
                            <button
                                onClick={copyGameCode}
                                className="p-2 hover:bg-[color:var(--muted)] rounded transition-colors text-[color:var(--foreground)]"
                                title="Copier le code"
                            >
                                <Copy size={16} />
                            </button>
                            <button
                                onClick={shareGameCode}
                                className="p-2 hover:bg-[color:var(--muted)] rounded transition-colors text-[color:var(--foreground)]"
                                title="Partager le code"
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Mode-specific instructions */}
                    <p className="text-[color:var(--muted-foreground)] text-sm">
                        {gameInfo?.mode === 'quiz' && (
                            "Partagez ce code avec vos élèves pour qu'ils puissent rejoindre l'activité. Vous pouvez maintenant surveiller leur progression en temps réel."
                        )}
                        {gameInfo?.mode === 'tournament' && (
                            "Partagez ce code avec vos élèves pour qu'ils puissent rejoindre le tournoi. Les équipes s'affronteront dans une compétition passionnante !"
                        )}
                        {gameInfo?.mode === 'practice' && (
                            "En mode pratique, les élèves peuvent s'entraîner à leur rythme sans contrainte de temps. Partagez ce code pour qu'ils puissent accéder à l'activité."
                        )}
                    </p>

                    {/* Action buttons */}
                    <div className={gameInfo?.mode === 'quiz' ? "flex gap-3 justify-center" : "flex justify-center"}>
                        {gameInfo?.mode === 'quiz' && (
                            <button
                                onClick={() => window.open(`/teacher/dashboard/${gameInfo.mode === 'quiz' ? gameInfo.gameCode : gameInfo.gameId}`, '_blank')}
                                className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition disabled:opacity-50 min-w-[120px]"
                            >
                                Piloter
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition disabled:opacity-50 min-w-[100px]"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </InfoModal>

            {/* Snackbar for copy notification */}
            <Snackbar
                open={snackbarOpen}
                message="Copié dans le presse-papier"
                type="success"
                onClose={() => setSnackbarOpen(false)}
                duration={2000}
            />
        </>
    );
};

export default StartActivityModal;
