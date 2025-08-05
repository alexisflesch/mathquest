import { AnimatePresence } from 'framer-motion';
// Factorized score animation component
function ScoreAnimate({ score, zoomFactor, animateScore }: { score: number, zoomFactor?: number, animateScore?: boolean }) {
    return (
        <div className="relative">
            <span
                className="font-bold text-primary relative z-10"
                style={{ fontSize: `calc(1.25rem * ${zoomFactor})` }}
            >
                {Math.round(score)}
            </span>
            {/* Glitch layers */}
            {animateScore && (
                <>
                    <motion.span
                        key={score + '-red'}
                        className="absolute inset-0 font-bold text-red-500 z-0"
                        style={{ fontSize: `calc(1.25rem * ${zoomFactor})` }}
                        animate={{
                            x: [-2, 2, -1, 1, 0],
                            opacity: [0.8, 0, 0.6, 0, 0]
                        }}
                        transition={{ duration: 0.3, times: [0, 0.25, 0.5, 0.75, 1] }}
                    >
                        {Math.round(score)}
                    </motion.span>
                    <motion.span
                        key={score + '-blue'}
                        className="absolute inset-0 font-bold text-blue-500 z-0"
                        style={{ fontSize: `calc(1.25rem * ${zoomFactor})` }}
                        animate={{
                            x: [2, -2, 1, -1, 0],
                            opacity: [0.8, 0, 0.6, 0, 0]
                        }}
                        transition={{ duration: 0.3, times: [0, 0.25, 0.5, 0.75, 1] }}
                    >
                        {Math.round(score)}
                    </motion.span>
                </>
            )}
        </div>
    );
}
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
    animateOnInitialLoad?: boolean;
};

const medalEmojis = ['🥇', '🥈', '🥉'];

// Custom comparison function to prevent unnecessary re-renders
/**
 * Returns a mapping of rank index to animation delay (i*0.3s) for changed ranks.
 * Only changed ranks get a delay, others get 0.
 */
export function getAnimationDelays(prev: PodiumUser[], next: PodiumUser[]): Record<number, number> {
    const changedRanks = getChangedRanks(prev, next).sort((a, b) => a - b);
    const delays: Record<number, number> = {};
    changedRanks.forEach((rank, i) => {
        delays[rank] = i * 0.3;
    });
    return delays;
}
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
    const { animateOnInitialLoad = false } = arguments[0];
    const podiumOrder = [1, 0, 2];
    const podiumMargins = ['mb-10', 'mb-20', 'mb-4'];
    const top3 = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    // Store previous leaderboard in a ref
    const prevLeaderboardRef = useRef<PodiumUser[] | null>(null);
    // Compute animation triggers for each rank
    const { animationDelays, animateScoreFlags } = useMemo(() => {
        let rankChanged: number[] = [];
        let scoreChanged: number[] = [];
        if (!prevLeaderboardRef.current) {
            // Initial render: treat all ranks as changed
            rankChanged = Array.from({ length: leaderboard.length }, (_, i) => i);
        } else {
            const maxLen = Math.max(prevLeaderboardRef.current.length, leaderboard.length);
            for (let i = 0; i < maxLen; i++) {
                const prevUser = prevLeaderboardRef.current[i];
                const nextUser = leaderboard[i];
                const prevId = prevUser?.userId ?? 'none';
                const nextId = nextUser?.userId ?? 'none';
                const prevScore = prevUser?.score ?? 'none';
                const nextScore = nextUser?.score ?? 'none';
                const rankChangedFlag = prevId !== nextId;
                const scoreChangedFlag = !rankChangedFlag && prevScore !== nextScore;
                if (!prevUser || !nextUser) {
                    rankChanged.push(i);
                } else if (rankChangedFlag) {
                    rankChanged.push(i);
                } else if (scoreChangedFlag) {
                    scoreChanged.push(i);
                }
                // Simple log for debugging
                console.log(`[LBDEBUG] i=${i} prevId=${prevId} nextId=${nextId} prevScore=${prevScore} nextScore=${nextScore} rankChanged=${rankChangedFlag} scoreChanged=${scoreChangedFlag}`);
            }
            console.log('[LBDEBUG] rankChanged:', rankChanged);
            console.log('[LBDEBUG] scoreChanged:', scoreChanged);
        }
        // Assign delays only to rankChanged, in sequential order; others get 0
        const delays: Record<number, number> = {};
        leaderboard.forEach((_, i) => {
            delays[i] = 0;
        });
        let delayIdx = 0;
        leaderboard.forEach((_, i) => {
            if (rankChanged.includes(i)) {
                delays[i] = delayIdx * 0.3;
                delayIdx++;
            }
        });
        // Score animation flags
        const scoreFlags: Record<number, boolean> = {};
        leaderboard.forEach((_, i) => {
            scoreFlags[i] = scoreChanged.includes(i);
        });
        return { animationDelays: delays, animateScoreFlags: scoreFlags };
    }, [leaderboard]);
    // Update ref after render
    React.useEffect(() => {
        prevLeaderboardRef.current = leaderboard;
    }, [leaderboard]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-0 flex-1 min-h-0">
            {/* Podium */}
            <div className="flex flex-row items-end justify-center gap-6 mb-4 w-full max-w-2xl mx-auto">
                {podiumOrder.map((podiumIdx, pos) => {
                    const user = top3[podiumIdx];
                    if (!user) return <div key={pos} className="w-24" />;
                    const heightClass = podiumMargins[pos];
                    const zIndex = pos === 1 ? 'z-10' : 'z-0';

                    // New animation delay logic
                    const rank = podiumIdx;
                    const animationDelay = animationDelays[rank] ?? 0;
                    const animateScore = animateScoreFlags[rank] ?? false;

                    return (
                        <motion.div
                            key={user.userId + '-' + rank}
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
                            className={`flex flex-col items-center justify-end ${zIndex} ${heightClass} w-24 min-w-0`}
                            style={{
                                position: 'relative',
                            }}
                        >
                            {/* AvatarEmoji only, bigger, no background */}
                            <div className="mb-2 flex items-center justify-center overflow-hidden">
                                {user.avatarEmoji ? (
                                    <span className="text-5xl">{user.avatarEmoji}</span>
                                ) : (
                                    <span className="text-2xl font-bold text-gray-700">{(user.name || 'UP').slice(0, 2).toUpperCase()}</span>
                                )}
                            </div>
                            <span
                                className="font-semibold text-center truncate max-w-[100px]"
                                style={{ fontSize: `calc(1.125rem * ${zoomFactor})` }}
                            >
                                {user.name || 'Unknown Player'}
                            </span>
                            <ScoreAnimate score={user.score} zoomFactor={zoomFactor} animateScore={animateScore} />
                            <span
                                className=""
                                style={{ fontSize: `calc(1.5rem * ${zoomFactor})` }}
                            >
                                {medalEmojis[podiumIdx]}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Liste des suivants - Conteneur relatif pour le fade, flex-1 pour prendre l'espace restant, ET overflow-hidden */}
            <div className="w-full max-w-xl mx-auto flex flex-col items-center relative flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-col gap-2 w-full px-2">
                    {others.map((user, idx) => {
                        const rank = idx + 3;
                        const animationDelay = animationDelays[rank] ?? 0;
                        const animateScore = animateScoreFlags[rank] ?? false;
                        return (
                            <motion.div
                                key={user.userId + '-' + rank}
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
                                    delay: animationDelay
                                }}
                                className="w-full flex flex-row items-center justify-between bg-base-200/80 rounded-lg px-4 py-2 shadow"
                            >
                                {/* Rank. avatarEmoji username */}
                                <span className="font-mono w-8 text-center text-sm">{idx + 4}.</span>
                                <span className="text-2xl mr-2">{user.avatarEmoji}</span>
                                <span className="flex-1 text-left truncate mx-2">{user.name || 'Unknown Player'}</span>
                                <ScoreAnimate score={user.score} zoomFactor={zoomFactor} animateScore={animateScore} />
                            </motion.div>
                        );
                    })}
                </div>
                <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-12 bg-gradient-to-t from-base-100 to-transparent" />
            </div>
        </div>
    );
}

// Export the memoized component to prevent unnecessary re-renders
export default React.memo(ClassementPodium, arePropsEqual);
