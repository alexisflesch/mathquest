'use client';

import React, { useRef, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { createLogger } from '@/clientLogger';

const logger = createLogger('LeaderboardFAB');

interface LeaderboardFABProps {
    isMobile: boolean;
    userId: string | null;
    leaderboardLength: number;
    userRank: number | null;
    userScore: number;
    isQuestionCompleted: boolean;
    questionIndex: number;
    isFirstQuestionOfSession: boolean;
    onOpen: () => void;
}

// Memoized Leaderboard FAB Component (Mobile: right side, Desktop: top left)
const LeaderboardFAB = React.memo(({
    isMobile,
    userId,
    leaderboardLength,
    userRank,
    userScore,
    isQuestionCompleted,
    questionIndex,
    isFirstQuestionOfSession,
    onOpen
}: LeaderboardFABProps) => {
    // Re-render logging for LeaderboardFAB
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        if (typeof window !== 'undefined' && window.location.search.includes('mqdebug=1')) {
            logger.info(`🔄 [FAB-RERENDER] LeaderboardFAB re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
        }
    });

    if (!userId || leaderboardLength === 0) {
        return null;
    }

    // Mobile positioning (right side, fixed to viewport)
    const mobileClasses = "fixed right-4 z-[150] flex items-center space-x-2 px-3 py-2 bg-transparent text-[var(--success)] rounded-full hover:bg-white/10 transition-all duration-200";
    const mobileStyle = {
        zIndex: 150,
        top: 'calc(var(--navbar-height) / 2)',
        transform: 'translateY(-50%)'
    };

    // Desktop positioning (relative to main-content, absolute inside)
    const desktopClasses = "absolute left-4 top-4 z-[150] flex items-center space-x-2 px-4 py-2 bg-[var(--navbar)] backdrop-blur-sm text-[var(--success)] rounded-full transition-all duration-200 shadow-lg";
    const desktopStyle = {
        zIndex: 150,
    };

    // For single players: always show score
    // For multiple players: show ranking
    const isSinglePlayer = leaderboardLength === 1;
    const showScore = isSinglePlayer;

    // For first question: don't show until completed
    // For subsequent questions: show immediately
    const shouldHideForFirstQuestion = isFirstQuestionOfSession && !isQuestionCompleted;

    if (shouldHideForFirstQuestion) {
        return null;
    }

    const handleClick = !isSinglePlayer ? onOpen : undefined;

    // Use Math.floor for rounding (no decimals)
    const flooredScore = Math.floor(userScore);

    // Animation key changes when rank or points change
    const animationKey = showScore ? `score-${flooredScore}` : `rank-${userRank}`;

    return (
        <button
            onClick={handleClick}
            className={isMobile ? mobileClasses : desktopClasses}
            style={isMobile ? mobileStyle : desktopStyle}
            aria-label={isSinglePlayer ? "Points" : "Voir le classement complet"}
        >
            <motion.div
                key={animationKey}
                animate={{
                    scale: [1, 1.3, 1.2, 1.3, 1],
                    rotate: [0, -8, 8, -8, 8, -8, 0],
                }}
                transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    repeat: 1,
                }}
            >
                <Trophy className="w-5 h-5" />
            </motion.div>
            <span className="text-md font-bold">
                {showScore ? `${flooredScore} pts` : `#${userRank}`}
            </span>
        </button>
    );
});

LeaderboardFAB.displayName = 'LeaderboardFAB';

export default LeaderboardFAB;
