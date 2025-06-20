import React from "react";
import { Timer } from 'lucide-react';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface TournamentTimerProps {
    timerS: number | null; // Timer value in seconds for display
    isMobile: boolean;
}

// Helper to format timer as MM:SS if >= 60, else just seconds
// Uses Math.ceil for better UX: if backend sends 3.5s, show 4 for 0.5s, then 3 for 1s, etc.
function formatTimer(val: number | null) {
    if (val === null || val < 0) return '0'; // Show "0" instead of "-" when timer reaches zero
    const rounded = Math.max(0, Math.ceil(val)); // Use ceil for smooth countdown experience
    if (rounded >= 60) {
        const m = Math.floor(rounded / 60);
        const s = rounded % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return rounded.toString();
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({ timerS, isMobile }) => {
    return isMobile ? (
        <div className="fixed top-16 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
            style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
            <div className="flex items-center gap-1 align-middle">
                <Timer className="w-5 h-5" style={{ display: 'block', color: 'var(--light-foreground)' }} />
                <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--light-foreground)' }}>{formatTimer(timerS)}</span>
            </div>
        </div>
    ) : (
        <div className="fixed top-4 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
            style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
            <Timer className="w-5 h-5 mr-2" style={{ display: 'block', color: 'var(--light-foreground)' }} />
            <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--light-foreground)' }}>{formatTimer(timerS)}</span>
        </div>
    );
};

export default TournamentTimer;
