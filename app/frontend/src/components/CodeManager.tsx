import React, { useState, useEffect } from 'react';
import { createLogger } from '@/clientLogger';
import { Socket } from 'socket.io-client';
import type { QuizState } from '@/hooks/useTeacherQuizSocket';
import { makeApiRequest } from '@/config/api';
import { TournamentCodeResponseSchema, type TournamentCodeResponse } from '@/types/api';

const logger = createLogger('CodeManager');

interface CodeManagerProps {
    quizId: string;
    quizSocket: Socket | null;
    quizState: QuizState | null;
    initialTournamentCode: string | null;
    onCodeGenerated: (code: string | null) => void;
    onCodeUpdateEmitted: (code: string) => void;
}

const CodeManager = ({
    quizId,
    quizSocket,
    quizState,
    initialTournamentCode,
    onCodeGenerated,
    onCodeUpdateEmitted,
}: CodeManagerProps) => {
    const [tournamentCode, setTournamentCode] = useState<string | null>(initialTournamentCode);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTournamentCode(initialTournamentCode);
    }, [initialTournamentCode]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Code&nbsp;:</h2>
                {tournamentCode && !error && (
                    <span className="font-mono text-2xl font-bold">{tournamentCode}</span>
                )}
            </div>
            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            )}
            {!tournamentCode && !error && (
                <div className="text-gray-500 italic">Aucun code tournoi actif.</div>
            )}
        </div>
    );
};
CodeManager.displayName = 'CodeManager';

export default CodeManager;

