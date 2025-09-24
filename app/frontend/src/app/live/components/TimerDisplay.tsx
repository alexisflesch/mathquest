'use client';

import React, { useRef, useEffect } from 'react';
import TournamentTimer from '@/components/TournamentTimer';
import { createLogger } from '@/clientLogger';

const logger = createLogger('TimerDisplay');

interface TimerDisplayProps {
    gameMode: string;
    timerState: any;
    isMobile: boolean;
}

// Memoized Timer Display Component
const TimerDisplay = React.memo(({
    gameMode,
    timerState,
    isMobile
}: TimerDisplayProps) => {
    // Re-render logging for TimerDisplay
    const renderCount = useRef(0);
    const lastRenderTime = useRef(Date.now());

    useEffect(() => {
        renderCount.current++;
        const now = Date.now();
        const timeSinceLastRender = now - lastRenderTime.current;
        lastRenderTime.current = now;

        logger.info(`🔄 [TIMER-RERENDER] TimerDisplay re-render #${renderCount.current} (${timeSinceLastRender}ms since last)`);
    });

    if (gameMode === 'practice') return null;

    const timerSeconds = timerState?.timeLeftMs ? Math.floor(timerState.timeLeftMs / 1000) : null;
    return <TournamentTimer timerS={timerSeconds} isMobile={isMobile} />;
});

TimerDisplay.displayName = 'TimerDisplay';

export default TimerDisplay;
