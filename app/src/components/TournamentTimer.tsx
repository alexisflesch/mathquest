import React from "react";
import { Timer } from 'lucide-react';

interface TournamentTimerProps {
    timer: number | null;
    isMobile: boolean;
}

// Helper to format timer as MM:SS if >= 60, else just seconds
function formatTimer(val: number | null) {
    if (val === null) return '-';
    if (val >= 60) {
        const m = Math.floor(val / 60);
        const s = val % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return val.toString();
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({ timer, isMobile }) => {
    return isMobile ? (
        <div className="fixed top-16 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
            style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
            <div className="flex items-center gap-1 align-middle">
                <Timer className="w-5 h-5" style={{ display: 'block', color: 'var(--light-foreground)' }} />
                <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--light-foreground)' }}>{formatTimer(timer)}</span>
            </div>
        </div>
    ) : (
        <div className="fixed top-4 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
            style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
            <Timer className="w-5 h-5 mr-2" style={{ display: 'block', color: 'var(--light-foreground)' }} />
            <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--light-foreground)' }}>{formatTimer(timer)}</span>
        </div>
    );
};

export default TournamentTimer;
