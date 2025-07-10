"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface LeaderboardEntry {
    userId: string;
    username: string;
    avatarEmoji?: string;
    score: number;
    rank?: number;
}

interface LeaderboardContextValue {
    leaderboard: LeaderboardEntry[];
    setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
    showLeaderboardModal: boolean;
    setShowLeaderboardModal: (show: boolean) => void;
    currentUserId: string | null;
    setCurrentUserId: (userId: string | null) => void;
}

const LeaderboardContext = createContext<LeaderboardContextValue | null>(null);

interface LeaderboardProviderProps {
    children: ReactNode;
}

export function LeaderboardProvider({ children }: LeaderboardProviderProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    return (
        <LeaderboardContext.Provider value={{
            leaderboard,
            setLeaderboard,
            showLeaderboardModal,
            setShowLeaderboardModal,
            currentUserId,
            setCurrentUserId,
        }}>
            {children}
        </LeaderboardContext.Provider>
    );
}

export function useLeaderboard() {
    const context = useContext(LeaderboardContext);
    if (!context) {
        throw new Error('useLeaderboard must be used within a LeaderboardProvider');
    }
    return context;
}
