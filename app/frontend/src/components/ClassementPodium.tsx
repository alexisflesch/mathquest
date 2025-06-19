import React from 'react';
import { motion } from 'framer-motion';

export type PodiumUser = {
    name: string;
    avatarEmoji?: string;
    score: number;
};

export type ClassementPodiumProps = {
    top3: PodiumUser[]; // max 3
    others: { name: string; score: number }[];
    zoomFactor?: number; // Add optional zoomFactor prop
    correctAnswers?: boolean[]; // Allow correctAnswers prop - changed to boolean[]
};

const medalEmojis = ['🥇', '🥈', '🥉'];

export default function ClassementPodium({ top3, others, zoomFactor = 1, correctAnswers }: ClassementPodiumProps) { // Destructure zoomFactor with default
    const podiumOrder = [1, 0, 2];
    const podiumMargins = ['mb-4', 'mb-8', 'mb-0'];

    return (
        // Réduction du padding top de pt-4 à pt-2
        <div className="w-full h-full flex flex-col items-center justify-start pt-0 flex-1 min-h-0">
            {/* Podium */}
            <div className="flex flex-row items-end justify-center gap-4 mb-4 w-full max-w-2xl mx-auto">
                {podiumOrder.map((podiumIdx, pos) => {
                    const user = top3[podiumIdx];
                    if (!user) return <div key={pos} className="w-20" />;
                    const heightClass = podiumMargins[pos];
                    const zIndex = pos === 1 ? 'z-10' : 'z-0';

                    // Calcul du délai : 3ème (pos=2) -> 0s, 2ème (pos=0) -> 0.2s, 1er (pos=1) -> 0.4s
                    let animationDelay = 0;
                    if (pos === 0) animationDelay = 0.2; // 2ème place
                    if (pos === 1) animationDelay = 0.4; // 1ère place

                    return (
                        <motion.div
                            key={user.name}
                            // Utiliser une valeur relative à la hauteur du viewport
                            initial={{ y: "-100vh", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            // Utiliser une animation custom pour surmonter les limites du conteneur
                            transition={{
                                defaultMode: 'spring',
                                bounce: 0.3,
                                duration: 1.5,
                                delay: animationDelay
                            }}
                            className={`flex flex-col items-center justify-end ${zIndex} ${heightClass}`}
                            style={{
                                flex: pos === 1 ? 1.2 : 1,
                                position: 'relative', // Assurer que la position est relative
                            }}
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                                {user.avatarEmoji ? (
                                    <span className="text-3xl">{user.avatarEmoji}</span>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-700">{user.name.slice(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <span
                                className="font-semibold text-center truncate max-w-[100px]"
                                style={{ fontSize: `calc(1.125rem * ${zoomFactor})` }} // Base size text-lg (1.125rem)
                            >
                                {user.name}
                            </span>
                            <span
                                className="font-bold text-primary"
                                style={{ fontSize: `calc(1.25rem * ${zoomFactor})` }} // Base size text-xl (1.25rem)
                            >
                                {user.score}
                            </span>
                            <span
                                className=""
                                style={{ fontSize: `calc(1.5rem * ${zoomFactor})` }} // Base size text-2xl (1.5rem)
                            >
                                {medalEmojis[podiumIdx]}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Liste des suivants - Conteneur relatif pour le fade, flex-1 pour prendre l'espace restant, ET overflow-hidden */}
            <div className="w-full max-w-xl mx-auto flex flex-col items-center relative flex-1 min-h-0 overflow-hidden"> {/* Ajout de overflow-hidden */}
                {/* Conteneur interne pour la liste, SANS overflow */}
                <div className="flex flex-col gap-2 w-full px-2">
                    {others.map((user, idx) => (
                        <motion.div
                            key={user.name}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            className="w-full flex flex-row items-center justify-between bg-base-200/80 rounded-lg px-4 py-2 shadow"
                        >
                            <span className="font-mono w-8 text-center text-sm">{idx + 4}</span>
                            <span className="flex-1 text-left truncate mx-2">{user.name}</span>
                            <span className="font-bold text-primary w-12 text-right">{user.score}</span>
                        </motion.div>
                    ))}
                </div>

                {/* Fade-out en bas - positionné sur le conteneur relatif */}
                <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-base-100 to-transparent" />
            </div>
        </div>
    );
}
