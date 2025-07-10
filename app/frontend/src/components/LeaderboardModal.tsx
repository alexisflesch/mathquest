/**
 * LeaderboardModal Component
 * 
 * Mobile-first modal for displaying the full leaderboard during live games.
 * Features:
 * - Full leaderboard list with rank, avatar, username, and score
 * - Highlights the current user's avatar with primary color background
 * - Responsive design optimized for mobile
 * - Uses SharedModal for consistent styling and behavior
 * - Fully theme-aware with CSS variables
 */

import React from 'react';
import InfoModal from './SharedModal';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { LeaderboardEntry } from '@shared/types/core/leaderboardEntry.zod';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    leaderboard: LeaderboardEntry[];
    currentUserId: string;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
    isOpen,
    onClose,
    leaderboard,
    currentUserId,
}) => {
    // Sort leaderboard by score (descending) and add ranks if not present
    const sortedLeaderboard = React.useMemo(() => {
        const sorted = [...leaderboard].sort((a, b) => b.score - a.score);
        return sorted.map((entry, index) => ({
            ...entry,
            rank: entry.rank ?? index + 1
        }));
    }, [leaderboard]);

    return (
        <InfoModal
            isOpen={isOpen}
            onClose={onClose}
            title="Classement"
            size="md"
            className="max-h-[80vh]"
        >
            <div className="max-h-96 overflow-y-auto">
                {sortedLeaderboard.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, -3, 3, -3, 0]
                            }}
                            transition={{
                                duration: 1.5,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        </motion.div>
                        <p>Aucun classement disponible</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedLeaderboard.map((entry, index) => {
                            const isCurrentUser = entry.userId === currentUserId;
                            return (
                                <div
                                    key={entry.userId}
                                    className="flex items-center p-3 rounded-lg border transition-colors"
                                    style={{
                                        backgroundColor: 'var(--card-bg)',
                                        borderColor: 'var(--border)',
                                        color: 'var(--text)'
                                    }}
                                >
                                    {/* Rank Number */}
                                    <div className="flex-shrink-0 mr-3 w-8 h-8 flex items-center justify-center">
                                        <span
                                            className="text-sm font-medium"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            {entry.rank || index + 1}
                                        </span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex-shrink-0 mr-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                            style={{
                                                backgroundColor: isCurrentUser ? 'var(--primary)' : 'var(--input-bg)',
                                                color: isCurrentUser ? 'white' : 'var(--text)'
                                            }}
                                        >
                                            {entry.avatarEmoji || '👤'}
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm truncate ${isCurrentUser ? 'font-semibold' : 'font-medium'}`}
                                            style={{ color: 'var(--text)' }}
                                        >
                                            {entry.username}
                                            {isCurrentUser && (
                                                <span
                                                    className="ml-2 text-xs opacity-75"
                                                    style={{ color: 'var(--text-muted)' }}
                                                >
                                                    (Vous)
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Score */}
                                    <div className="flex-shrink-0">
                                        <span
                                            className="text-sm font-semibold"
                                            style={{ color: 'var(--text)' }}
                                        >
                                            {entry.score} pts
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </InfoModal>
    );
};

export default LeaderboardModal;
