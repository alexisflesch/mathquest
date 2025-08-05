import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export type PodiumUser = {
    userId?: string;
    name: string;
    avatarEmoji?: string;
    score: number;
};

export type ClassementPodiumProps = {
    leaderboard: PodiumUser[]; // Full leaderboard, ordered by rank
    zoomFactor?: number;
    correctAnswers?: boolean[];
};

const medalEmojis = ['🥇', '🥈', '🥉'];

// Custom comparison function to prevent unnecessary re-renders
/**
 * Returns an array of indices (ranks) where the leaderboard entry has changed.
 * Compares by userId and score.
 */
export function getChangedRanks(prev: PodiumUser[], next: PodiumUser[]): number[] {
    const changed: number[] = [];
    const maxLen = Math.max(prev.length, next.length);
    for (let i = 0; i < maxLen; i++) {
        const prevUser = prev[i];
        const nextUser = next[i];
        if (
            !prevUser ||
            !nextUser ||
            prevUser.userId !== nextUser.userId ||
            prevUser.score !== nextUser.score
        ) {
            changed.push(i);
        }
    }
    return changed;
}
const arePropsEqual = (prevProps: ClassementPodiumProps, nextProps: ClassementPodiumProps): boolean => {
    // Use getChangedRanks for leaderboard comparison
    if (getChangedRanks(prevProps.leaderboard, nextProps.leaderboard).length > 0) return false;

    if (prevProps.zoomFactor !== nextProps.zoomFactor) return false;
    if (prevProps.correctAnswers && nextProps.correctAnswers) {
        if (prevProps.correctAnswers.length !== nextProps.correctAnswers.length) return false;
        for (let i = 0; i < prevProps.correctAnswers.length; i++) {
            if (prevProps.correctAnswers[i] !== nextProps.correctAnswers[i]) return false;
        }
    } else if (prevProps.correctAnswers !== nextProps.correctAnswers) {
        return false;
    }
    return true;
};

function ClassementPodium({ leaderboard, zoomFactor = 1, correctAnswers }: ClassementPodiumProps) {
    // Animate on every re-render (no external control)
    const podiumOrder = [1, 0, 2];
    const podiumMargins = ['mb-4', 'mb-8', 'mb-0'];
    const top3 = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-0 flex-1 min-h-0">
            {/* Podium */}
            <div className="flex flex-row items-end justify-center gap-4 mb-4 w-full max-w-2xl mx-auto">
                {podiumOrder.map((podiumIdx, pos) => {
                    const user = top3[podiumIdx];
                    if (!user) return <div key={pos} className="w-20" />;
                    const heightClass = podiumMargins[pos];
                    const zIndex = pos === 1 ? 'z-10' : 'z-0';

                    // Animate on every re-render
                    let animationDelay = 0;
                    if (podiumIdx === 0) animationDelay = 0.0;
                    if (podiumIdx === 1) animationDelay = 0.3;
                    if (podiumIdx === 2) animationDelay = 0.6;
                    return (
                        <motion.div
                            key={`${user.userId || `player-${podiumIdx}`}`}
                            initial={{
                                opacity: 0,
                                scale: 0.8,
                                y: -window.innerHeight
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0
                            }}
                            transition={{
                                type: 'spring',
                                bounce: 0.4,
                                duration: 1.2,
                                delay: animationDelay
                            }}
                            data-podium-pos={pos}
                            className={`flex flex-col items-center justify-end ${zIndex} ${heightClass}`}
                            style={{
                                flex: pos === 1 ? 1.2 : 1,
                                position: 'relative',
                            }}
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                                {user.avatarEmoji ? (
                                    <span className="text-3xl">{user.avatarEmoji}</span>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-700">{(user.name || 'UP').slice(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <span
                                className="font-semibold text-center truncate max-w-[100px]"
                                style={{ fontSize: `calc(1.125rem * ${zoomFactor})` }} // Base size text-lg (1.125rem)
                            >
                                {user.name || 'Unknown Player'}
                            </span>
                            <span
                                className="font-bold text-primary"
                                style={{ fontSize: `calc(1.25rem * ${zoomFactor})` }} // Base size text-xl (1.25rem)
                            >
                                {Math.round(user.score)}
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
                    {others.map((user, idx) => {
                        // Animate on every re-render
                        const delay = 1.5 + (idx * 0.1);
                        return (
                            <motion.div
                                key={`${user.userId || `other-${idx}`}`}
                                initial={{
                                    opacity: 0,
                                    scale: 0.8,
                                    x: 300
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: 0
                                }}
                                transition={{
                                    type: 'spring',
                                    bounce: 0.3,
                                    duration: 0.8,
                                    delay: delay
                                }}
                                className="w-full flex flex-row items-center justify-between bg-base-200/80 rounded-lg px-4 py-2 shadow"
                            >
                                <span className="font-mono w-8 text-center text-sm">{idx + 4}</span>
                                <span className="flex-1 text-left truncate mx-2">{user.name || 'Unknown Player'}</span>
                                <span className="font-bold text-primary w-12 text-right">{Math.round(user.score)}</span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Fade-out en bas - positionné sur le conteneur relatif */}
                <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-base-100 to-transparent" />
            </div>
        </div>
    );
}

// Export the memoized component to prevent unnecessary re-renders
export default React.memo(ClassementPodium, arePropsEqual);
