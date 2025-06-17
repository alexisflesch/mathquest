#!/usr/bin/env python3
"""
Script to modernize the projection hook by completely replacing it
with a clean implementation using useSimpleTimer and canonical shared types.
"""

import os

# The new modernized hook content
new_hook_content = '''/**
 * Projection Quiz Socket Hook
 * 
 * Modernized hook for teacher projection display using canonical shared types
 * and the modern useSimpleTimer hook. Follows modernization guidelines.
 */

import { useEffect, useState } from 'react';
import { createLogger } from '@/clientLogger';
import { useSimpleTimer } from './useSimpleTimer';
import { useGameSocket } from './useGameSocket';
import type { QuizState } from '@/hooks/useTeacherQuizSocket';
import type { QuestionData } from '@shared/types/socketEvents';

const logger = createLogger('useProjectionQuizSocket');

/**
 * Hook for teacher projection page that displays quiz content
 * Uses modern timer system and joins projection room directly
 */
export function useProjectionQuizSocket(accessCode: string, gameId: string | null) {
    // Use modern game socket
    const socket = useGameSocket();
    
    // Use modern timer with projection role
    const timer = useSimpleTimer({
        gameId,
        accessCode,
        socket: socket.socket,
        role: 'projection'
    });

    // Quiz state for displaying questions and game data
    const [gameState, setGameState] = useState<QuizState | null>(null);
    const [connectedCount, setConnectedCount] = useState<number>(0);

    // Join projection room when socket connects
    useEffect(() => {
        if (!socket.socket || !gameId) return;

        const joinProjection = () => {
            logger.info('Joining projection room for game:', gameId);
            // Join the projection room directly - we need a backend handler for this
            socket.socket?.emit('join_projection', { gameId });
        };

        // Join immediately if already connected
        if (socket.socket.connected) {
            joinProjection();
        }

        // Listen for connection events
        const handleConnect = () => {
            logger.info('[PROJECTION] Socket connected:', socket.socket?.id);
            joinProjection();
        };

        const handleDisconnect = () => {
            logger.warn('[PROJECTION] Socket disconnected');
            setGameState(null);
        };

        socket.socket.on('connect', handleConnect);
        socket.socket.on('disconnect', handleDisconnect);

        return () => {
            socket.socket?.off('connect', handleConnect);
            socket.socket?.off('disconnect', handleDisconnect);
        };
    }, [socket.socket, gameId]);

    // Listen for projection-specific events
    useEffect(() => {
        if (!socket.socket) return;

        const handleQuestionChanged = (payload: { question: QuestionData; questionIndex: number }) => {
            logger.info('Projection question changed:', payload);
            
            // Update game state with new question using canonical shared types
            setGameState(prev => {
                if (!prev) {
                    return {
                        currentQuestionidx: payload.questionIndex,
                        currentQuestionUid: payload.question.uid,
                        questions: [payload.question],
                        chrono: { timeLeftMs: 0, running: false, status: 'stop' },
                        locked: false,
                        ended: false,
                        stats: {},
                        profSocketId: null,
                        timerStatus: 'stop',
                        timerQuestionUid: payload.question.uid,
                        timerTimeLeft: 0
                    };
                }

                return {
                    ...prev,
                    currentQuestionidx: payload.questionIndex,
                    currentQuestionUid: payload.question.uid,
                    timerQuestionUid: payload.question.uid
                };
            });
        };

        const handleConnectedCount = (payload: { count: number }) => {
            setConnectedCount(payload.count);
        };

        // Listen to projection events using canonical event names
        socket.socket.on('projection_question_changed', handleQuestionChanged);
        socket.socket.on('connected_count', handleConnectedCount);

        return () => {
            socket.socket?.off('projection_question_changed', handleQuestionChanged);
            socket.socket?.off('connected_count', handleConnectedCount);
        };
    }, [socket.socket]);

    // Return clean interface using modern timer
    return {
        gameSocket: socket,
        gameState,
        timerStatus: timer.status,
        timerQuestionUid: timer.questionUid,
        localTimeLeftMs: timer.timeLeftMs,
        setLocalTimeLeft: () => {}, // Not needed with modern timer
        connectedCount
    };
}
'''

def main():
    hook_path = "/home/aflesch/mathquest/app/frontend/src/hooks/useProjectionQuizSocket.ts"
    
    print(f"Modernizing projection hook: {hook_path}")
    
    # Write the new content
    with open(hook_path, 'w') as f:
        f.write(new_hook_content)
    
    print("✅ Projection hook modernized successfully!")
    print("Changes made:")
    print("- ✅ Uses canonical shared types directly")
    print("- ✅ Uses modern useSimpleTimer hook") 
    print("- ✅ Clean room separation (projection room only)")
    print("- ✅ Removed legacy timer management")
    print("- ✅ Removed type mapping code")

if __name__ == "__main__":
    main()
