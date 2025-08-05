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
    top3: PodiumUser[]; // max 3
    others: { userId?: string; name: string; score: number }[];
    zoomFactor?: number; // Add optional zoomFactor prop
    correctAnswers?: boolean[]; // Allow correctAnswers prop - changed to boolean[]
    animate?: boolean; // NEW: Only animate when true
    animationKey?: number; // NEW: Force re-animation when this changes
};

const medalEmojis = ['🥇', '🥈', '🥉'];

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: ClassementPodiumProps, nextProps: ClassementPodiumProps): boolean => {
    // Compare top3 array
    if (prevProps.top3.length !== nextProps.top3.length) return false;
    for (let i = 0; i < prevProps.top3.length; i++) {
        const prev = prevProps.top3[i];
        const next = nextProps.top3[i];
        if (prev.userId !== next.userId ||
            prev.name !== next.name ||
            prev.avatarEmoji !== next.avatarEmoji ||
            prev.score !== next.score) {
            return false;
        }
    }

    // Compare others array
    if (prevProps.others.length !== nextProps.others.length) return false;
    for (let i = 0; i < prevProps.others.length; i++) {
        const prev = prevProps.others[i];
        const next = nextProps.others[i];
        if (prev.userId !== next.userId ||
            prev.name !== next.name ||
            prev.score !== next.score) {
            return false;
        }
    }

    // Compare other props
    if (prevProps.zoomFactor !== nextProps.zoomFactor) return false;
    if (prevProps.animate !== nextProps.animate) return false;
    if (prevProps.animationKey !== nextProps.animationKey) return false;

    // Only compare correctAnswers if both are defined (ignore changes when it's irrelevant)
    if (prevProps.correctAnswers && nextProps.correctAnswers) {
        if (prevProps.correctAnswers.length !== nextProps.correctAnswers.length) return false;
        for (let i = 0; i < prevProps.correctAnswers.length; i++) {
            if (prevProps.correctAnswers[i] !== nextProps.correctAnswers[i]) return false;
        }
    } else if (prevProps.correctAnswers !== nextProps.correctAnswers) {
        // If one is undefined and the other isn't, they're different
        return false;
    }

    return true;
};

function ClassementPodium({ top3, others, zoomFactor = 1, correctAnswers, animate = true, animationKey = 0 }: ClassementPodiumProps) { // Destructure zoomFactor with default, animate default true
    // ANIMATION DEBUG: Easily filterable logs
    console.log('[ANIM-DEBUG] 🏆 ClassementPodium render - animate:', animate, 'animationKey:', animationKey, 'top3 length:', top3.length);

    // SIMPLIFIED: Just animate all when animate=true and animationKey changes
    console.log('[ANIM-DEBUG] 🎭 Simple approach: animate all when animate=true, animationKey:', animationKey);

    const podiumOrder = [1, 0, 2];
    const podiumMargins = ['mb-4', 'mb-8', 'mb-0'];

    return (
        <div className="w-full h-full flex flex-col items-center justify-start pt-0 flex-1 min-h-0">
            {/* Podium */}
            <div className="flex flex-row items-end justify-center gap-4 mb-4 w-full max-w-2xl mx-auto">
                {podiumOrder.map((podiumIdx, pos) => {
                    const user = top3[podiumIdx];
                    if (!user) return <div key={pos} className="w-20" />;
                    const heightClass = podiumMargins[pos];
                    const zIndex = pos === 1 ? 'z-10' : 'z-0';

                    // SIMPLIFIED: Animate if animate=true (animate everyone)
                    const shouldAnimate = animate;

                    // Animation delays: Start with 1st place, then 2nd, then 3rd
                    let animationDelay = 0;
                    if (podiumIdx === 0) animationDelay = 0.0; // 1ère place (first to animate)
                    if (podiumIdx === 1) animationDelay = 0.3; // 2ème place 
                    if (podiumIdx === 2) animationDelay = 0.6; // 3ème place

                    console.log(`[ANIM-DEBUG] 🎯 Podium setup: podiumIdx=${podiumIdx}, pos=${pos}, delay=${animationDelay}, user=${user.name}, userId=${user.userId?.slice(-4)}, shouldAnimate=${shouldAnimate}, animate=${animate}`);

                    return (
                        <motion.div
                            key={`${user.userId || `player-${podiumIdx}`}-${shouldAnimate ? animationKey : 'static'}`}
                            initial={shouldAnimate ? {
                                opacity: 0,
                                scale: 0.8,
                                y: -window.innerHeight // Start from top of screen, not just div
                            } : {
                                opacity: 1,
                                scale: 1,
                                y: 0 // Already in position
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0
                            }}
                            transition={{
                                type: 'spring',
                                bounce: 0.4,
                                duration: shouldAnimate ? 1.2 : 0,
                                delay: shouldAnimate ? animationDelay : 0 // Only delay if animating
                            }}
                            onAnimationStart={() => {
                                if (shouldAnimate) {
                                    console.log(`[ANIM-DEBUG] 🎬 TOP 3 Animation START for position ${podiumIdx + 1} (${user.name}) userId=${user.userId?.slice(-4)}`);
                                }
                            }}
                            onAnimationComplete={() => {
                                if (shouldAnimate) {
                                    console.log(`[ANIM-DEBUG] ✅ TOP 3 Animation COMPLETE for position ${podiumIdx + 1} (${user.name}) userId=${user.userId?.slice(-4)}`);
                                }
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
                        // SIMPLIFIED: Animate if animate=true (animate everyone)
                        const shouldAnimate = animate;
                        const delay = 1.5 + (idx * 0.1);
                        console.log(`[ANIM-DEBUG] 🎯 Others setup: idx=${idx}, delay=${delay}, user=${user.name}, userId=${user.userId?.slice(-4)}, shouldAnimate=${shouldAnimate}, animate=${animate}`);
                        return (
                            <motion.div
                                key={`${user.userId || `other-${idx}`}-${shouldAnimate ? animationKey : 'static'}`}
                                initial={shouldAnimate ? {
                                    opacity: 0,
                                    scale: 0.8,
                                    x: 300 // Start from right of the div
                                } : {
                                    opacity: 1,
                                    scale: 1,
                                    x: 0 // Already in position
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: 0
                                }}
                                transition={{
                                    type: 'spring',
                                    bounce: 0.3,
                                    duration: shouldAnimate ? 0.8 : 0,
                                    delay: shouldAnimate ? delay : 0 // Only delay if animating
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
