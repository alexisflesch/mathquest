'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { createLogger } from '@/clientLogger';
import { makeApiRequest } from '@/config/api';
import type { PracticeSettings } from '@shared/types/practice/session';
import type { GameInstanceResponse } from '@shared/types/api/responses';
import type { GameInstance } from '@shared/types/core/game';

const logger = createLogger('PracticeSessionWithAccessCode');

export default function PracticeSessionWithAccessCodePage() {
    const params = useParams();
    const router = useRouter();
    const accessCode = params?.accessCode as string;

    const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!accessCode) {
            setError('No access code provided');
            setLoading(false);
            return;
        }

        const fetchGameInstance = async () => {
            try {
                logger.info('Fetching game instance for access code:', accessCode);

                const response = await makeApiRequest<GameInstanceResponse>(`/api/games/${accessCode}`, {
                    method: 'GET',
                });

                if (!response || !response.gameInstance) {
                    throw new Error('Failed to fetch game instance');
                }

                const instance = response.gameInstance;

                // Verify this is a practice session
                if (instance.playMode !== 'practice') {
                    logger.warn('Game instance is not a practice session, redirecting to appropriate page');
                    // Redirect to the appropriate page based on playMode
                    router.push(`/student/join?accessCode=${accessCode}`);
                    return;
                }

                logger.info('Successfully loaded practice game instance:', instance);
                setGameInstance(instance);
                setLoading(false);
            } catch (err) {
                logger.error('Error fetching game instance:', err);
                setError(err instanceof Error ? err.message : 'Failed to load practice session');
                setLoading(false);
            }
        };

        fetchGameInstance();
    }, [accessCode, router]);

    // Show loading state
    if (loading) {
        return (
            <LoadingScreen
                message="Loading practice session..."
            />
        );
    }

    // Show error state
    if (error || !gameInstance) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Session Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        {error || 'Could not find a practice session with this access code.'}
                    </p>
                    <button
                        onClick={() => router.push('/student')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }    // Extract practice settings and redirect to practice session
    let practiceSettings = gameInstance.settings?.practiceSettings;

    // If no practiceSettings in GameInstance, extract from GameTemplate (teacher-created sessions)
    if (!practiceSettings && gameInstance.gameTemplate) {
        const template = gameInstance.gameTemplate;
        practiceSettings = {
            discipline: template.discipline || '',
            gradeLevel: template.gradeLevel || '',
            themes: template.themes || [],
            questionCount: template.questions?.length || 10,
            showImmediateFeedback: true,
            allowRetry: true,
            randomizeQuestions: false
        };
        logger.info('Extracted practice settings from GameTemplate:', practiceSettings);
    }

    if (!practiceSettings) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Invalid Session Configuration</h1>
                    <p className="text-gray-600 mb-6">
                        This practice session does not have valid configuration settings.
                    </p>
                    <button
                        onClick={() => router.push('/student')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Redirect to practice session with URL parameters
    useEffect(() => {
        if (gameInstance && practiceSettings) {
            const params = new URLSearchParams({
                discipline: practiceSettings.discipline || '',
                gradeLevel: practiceSettings.gradeLevel || '',
                themes: (practiceSettings.themes || []).join(','),
                limit: String(practiceSettings.questionCount || 10),
                ...(gameInstance.gameTemplateId ? { gameTemplateId: gameInstance.gameTemplateId } : {})
            });

            router.push(`/student/practice/session?${params.toString()}`);
        }
    }, [gameInstance, practiceSettings, router]);

    // Show loading while redirecting
    return (
        <LoadingScreen
            message="Redirecting to practice session..."
        />
    );
}
