/**
 * Lobby Page Component
 * 
 * This component manages the tournament lobby/waiting room where participants
 * gather before the tournament begins. Key functionalities include:
 * 
 * - Socket.IO connection for real-time participant updates
 * - Display of connected participants with avatars
 * - Tournament start controls (for tournament creator only)
 * - Countdown animation before tournament starts
 * - Tournament code sharing
 * - Identity management for teachers and students
 * 
 * The lobby handles the transition between tournament creation and actual
 * tournament participation, and ensures all participants are properly
 * redirected when the tournament begins.
 */

"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from '@/components/AuthProvider';
import { Share2 } from "lucide-react";
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';
import { SOCKET_EVENTS } from '@shared/types/socket/events';
import { GameState } from '@shared/types/core/game';
import { makeApiRequest } from '@/config/api';
import { getSocketAuth } from '@/utils';
import InfinitySpin from '@/components/InfinitySpin';

// Tournament status response interface
interface TournamentStatusResponse {
    status: string;
    statut: string;
    currentQuestionIndex?: number;
    isLive?: boolean;
    gameState?: GameState;
}

// Create a logger for this component
const logger = createLogger('LobbyPage');

export default function LobbyPage() {
    const { code } = useParams();
    const router = useRouter();
    const { isTeacher, isStudent, isLoading, userProfile, userState } = useAuth();
    const [isCreator, setIsCreator] = useState(true); // TODO: Replace with real logic
    const [countdown, setCountdown] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [participants, setParticipants] = useState<{ id: string; username: string; avatarEmoji: string }[]>([]);
    const [creator, setCreator] = useState<{ id: string | null; username: string; avatar: string } | null>(null);
    const [isQuizLinked, setIsQuizLinked] = useState<boolean | null>(null);

    // Authentication guard - redirect if user is not properly authenticated
    useEffect(() => {
        if (isLoading) {
            // Still checking authentication, wait
            return;
        }

        if (userState === 'anonymous') {
            logger.warn('User is anonymous, redirecting to home page');
            router.push('/');
            return;
        }

        if (!userProfile.username || !userProfile.avatar) {
            logger.warn('User profile incomplete, redirecting to home page', { userProfile });
            router.push('/');
            return;
        }

        logger.info('User authentication verified for lobby', { userState, userProfile });
    }, [isLoading, userState, userProfile, router]);

    // Show loading while authentication is being checked
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <InfinitySpin size={48} />
                    <p className="mt-4 text-lg text-gray-600">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    // Show loading if user is anonymous (will redirect shortly)
    if (userState === 'anonymous' || !userProfile.username || !userProfile.avatar) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <InfinitySpin size={48} />
                    <p className="mt-4 text-lg text-gray-600">Redirection...</p>
                </div>
            </div>
        );
    }

    // Function to check tournament status and redirect if needed
    const checkTournamentStatus = useCallback(async () => {
        try {
            const status = await makeApiRequest<TournamentStatusResponse>(`games/${code}/state`);

            if (status.statut === 'terminé') {
                logger.info(`Tournament ${code} is finished, redirecting to leaderboard`);
                router.replace(`/leaderboard/${code}`);
            } else if (status.statut === 'en cours') {
                logger.info(`Tournament ${code} is already in progress, redirecting`);
                if (socketRef.current) {
                    socketRef.current.emit(SOCKET_EVENTS.LOBBY.LEAVE_LOBBY, { code });
                }

                // For games in progress, redirect immediately to live page
                // The game state data already provides all needed information
                router.replace(`/live/${code}`);
            }
        } catch (err) {
            logger.error(`Error checking tournament status: ${err}`);
        }
    }, [code, router]);

    // Get correct username/avatar for current session
    const getCurrentIdentity = useCallback(() => {
        if (typeof window === 'undefined') {
            logger.debug('Not running in browser, window is undefined');
            return null;
        }

        logger.debug('Identity check', { userState, userProfile });

        // Check if user has a valid profile with username and avatar
        if (userProfile.username && userProfile.avatar) {
            logger.debug('User identity from AuthProvider', {
                username: userProfile.username,
                avatar: userProfile.avatar,
                userId: userProfile.userId || userProfile.cookieId
            });
            return {
                username: userProfile.username,
                avatar: userProfile.avatar,
                userId: userProfile.userId || userProfile.cookieId || null
            };
        }

        logger.warn('No valid identity found in AuthProvider');
        return null;
    }, [userState, userProfile]);

    // Fetch tournament and creator info (only once when component mounts)
    useEffect(() => {
        let mounted = true; // Prevent state updates if component unmounts

        async function fetchCreator() {
            try {
                const status = await makeApiRequest<TournamentStatusResponse>(`games/${code}/state`);
                if (!mounted) return; // Component unmounted, don't update state

                if (status.statut === 'terminé') {
                    router.replace(`/leaderboard/${code}`);
                    return;
                }
                if (status.statut === 'en cours') {
                    router.replace(`/live/${code}`);
                    return;
                }

                // Get the game instance details instead of tournament
                const gameInstance = await makeApiRequest<{
                    gameInstance: {
                        id: string;
                        accessCode: string;
                        status?: string;
                        initiatorUserId?: string;
                        name: string;
                    }
                }>(`games/${code}`);

                if (!mounted) return; // Component unmounted, don't update state

                logger.debug("Game instance fetched", {
                    id: gameInstance.gameInstance.id,
                    accessCode: gameInstance.gameInstance.accessCode,
                    status: gameInstance.gameInstance.status
                });

                // If the game is already started, redirect to game page
                if (gameInstance.gameInstance.status && gameInstance.gameInstance.status !== 'pending') {
                    router.replace(`/live/${code}`);
                    return;
                }

                let creatorData = null;
                if (gameInstance.gameInstance.initiatorUserId) {
                    // Fetch user info from the users API
                    logger.debug("Fetching game creator", { id: gameInstance.gameInstance.initiatorUserId });
                    try {
                        const userResponse = await makeApiRequest<{
                            id: string;
                            username: string;
                            email: string;
                            role: string;
                            avatarEmoji: string;
                            createdAt: string;
                            updatedAt: string;
                        }>(`users/${gameInstance.gameInstance.initiatorUserId}`, {
                            method: 'GET'
                        });

                        if (!mounted) return; // Component unmounted, don't update state

                        if (userResponse) {
                            creatorData = {
                                id: userResponse.id,
                                username: userResponse.username,
                                avatar: userResponse.avatarEmoji
                            };
                        } else {
                            logger.warn("Creator user data not found");
                            creatorData = { id: gameInstance.gameInstance.initiatorUserId, username: "Unknown", avatar: "🐱" };
                        }
                    } catch (error) {
                        logger.error("Error fetching game creator:", error);
                        creatorData = { id: gameInstance.gameInstance.initiatorUserId, username: "Unknown", avatar: "🐱" };
                    }
                } else {
                    // No creator found
                    logger.warn("No creator found in game instance");
                    creatorData = { id: null, username: "Unknown", avatar: "🐱" };
                }

                if (mounted && creatorData) setCreator(creatorData);
            } catch (error) {
                logger.error("Error fetching tournament info:", error);
            }
        }

        fetchCreator();

        return () => {
            mounted = false; // Cleanup flag
        };
    }, [code, router]);

    // Determine if the current user is the creator
    useEffect(() => {
        if (!creator) return;
        const identity = getCurrentIdentity();
        setIsCreator(
            !!identity &&
            !!creator.id &&
            identity.userId === creator.id
        );
    }, [creator, getCurrentIdentity]);

    // Socket connection effect - only run once when the component mounts and user is authenticated
    useEffect(() => {
        // Skip if we don't have proper authentication or user profile
        if (isLoading || !userProfile.username || !userProfile.avatar) {
            return;
        }

        // Get authentication data for socket connection
        const socketAuth = getSocketAuth();
        logger.info('Creating socket connection with auth:', {
            config: SOCKET_CONFIG,
            hasAuth: !!socketAuth,
            authKeys: socketAuth ? Object.keys(socketAuth) : [],
            authData: socketAuth // Log the actual auth data for debugging
        });

        // Connect to socket.io server with authentication
        const socket = io(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG,
            autoConnect: true, // Enable auto-connect for lobby
            auth: socketAuth || undefined, // Pass authentication data
            query: socketAuth || undefined, // Also pass in query for backend compatibility
        });
        socketRef.current = socket;

        // Add connection success logging
        socket.on('connect', () => {
            logger.info(`Socket connected successfully! Socket ID: ${socket.id}`);
        });

        // Handle connection errors and reconnection
        socket.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
            logger.error(`Socket connection error: ${err.message}`, err);
        });

        socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            // Check tournament status on disconnect to ensure we don't miss redirection
            setTimeout(checkTournamentStatus, 1000);
        });

        socket.on(SOCKET_EVENTS.GAME.RECONNECT, (attemptNumber) => {
            logger.info(`Socket reconnected after ${attemptNumber} attempts`);
            // Re-join room after reconnection
            const identity = getCurrentIdentity();
            if (identity) {
                // Use userId from AuthProvider, fallback to cookieId, then temp ID
                const userId = userProfile.userId || userProfile.cookieId || `temp_${socket.id}`;
                socket.emit(SOCKET_EVENTS.LOBBY.JOIN_LOBBY, {
                    accessCode: code,
                    userId,
                    username: identity.username,
                    avatarEmoji: identity.avatar,
                });
                // Check tournament status after reconnect
                checkTournamentStatus();
            }
        });

        // Join the lobby room with correct identity
        const identity = getCurrentIdentity();
        if (!identity) {
            logger.error('No identity found, cannot join lobby. Redirecting to home.');
            router.push('/');
            return;
        }

        // Get userId from AuthProvider (userId for authenticated users, cookieId for guests)
        const userId = userProfile.userId || userProfile.cookieId || `temp_${socket.id}`;
        logger.debug('userId before join_lobby', { userId, userProfile });

        socket.emit(SOCKET_EVENTS.LOBBY.JOIN_LOBBY, {
            accessCode: code,
            userId,
            username: identity.username,
            avatarEmoji: identity.avatar,
        });

        // Debug: log after join_lobby
        logger.info("Joined lobby", { code });

        // Request the current participants list
        socket.emit(SOCKET_EVENTS.LOBBY.GET_PARTICIPANTS, { accessCode: code });

        // Listen for the full participants list
        socket.on(SOCKET_EVENTS.LOBBY.PARTICIPANTS_LIST, (data) => {
            if (Array.isArray(data)) {
                setParticipants(data);
                setIsQuizLinked(false); // fallback for old format
            } else {
                setParticipants(data.participants || []);
                setIsQuizLinked(data.isQuizLinked === undefined ? false : !!data.isQuizLinked);
            }
        });

        // Listen for participant join/leave events
        socket.on(SOCKET_EVENTS.LOBBY.PARTICIPANT_JOINED, (participant) => {
            setParticipants((prev) => {
                if (prev.some((p) => p.id === participant.id)) return prev;
                return [...prev, participant];
            });
            logger.debug("Participant joined", { id: participant.id, username: participant.username });
        });

        socket.on(SOCKET_EVENTS.LOBBY.PARTICIPANT_LEFT, (participant) => {
            setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
            logger.debug("Participant left", { id: participant.id, username: participant.username });
        });

        // Listen for game_started event - unified 5-second countdown for all game types
        socket.on(SOCKET_EVENTS.LOBBY.GAME_STARTED, ({ accessCode, gameId }) => {
            const targetCode = accessCode || code;
            logger.info(`Game started (code: ${targetCode}), waiting for backend countdown events`);
            // Don't start our own countdown timer - wait for backend events
        });

        // Listen for backend countdown events
        socket.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STARTING, ({ countdown }) => {
            logger.info(`Tournament starting countdown: ${countdown} seconds`);
            setCountdown(countdown);
        });

        socket.on(SOCKET_EVENTS.TOURNAMENT.COUNTDOWN_TICK, ({ countdown }) => {
            logger.debug(`Countdown tick: ${countdown}`);
            setCountdown(countdown);
        });

        socket.on(SOCKET_EVENTS.TOURNAMENT.COUNTDOWN_COMPLETE, () => {
            logger.info(`Countdown complete, redirecting to /live/${code}`);
            setCountdown(0);

            // Force-leave the lobby room before redirecting
            socket.emit(SOCKET_EVENTS.LOBBY.LEAVE_LOBBY, { accessCode: code });

            // Use immediate window.location navigation for more reliable redirects
            window.location.href = `/live/${code}`;

            // Also try router as fallback
            try {
                router.replace(`/live/${code}`);
            } catch (err) {
                logger.error(`Router redirect error: ${err}`);
            }
        });

        // Check status initially
        checkTournamentStatus();

        // Listen for the event indicating the tournament already started
        socket.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_ALREADY_STARTED, ({ code: tournamentCode, status }) => {
            logger.info(`Received tournament_already_started event for code ${tournamentCode} with status ${status}. Redirecting...`);

            if (status === 'en cours') {
                // Use immediate window.location navigation for more reliable redirects
                logger.info(`Tournament ${tournamentCode} is in progress, forcing redirect to live page`);
                window.location.href = `/live/${tournamentCode}`;

                // Also try router as fallback
                try {
                    router.replace(`/live/${tournamentCode}`);
                } catch (err) {
                    logger.error(`Router redirect error: ${err}`);
                }
            } else if (status === 'terminé') {
                // Redirect to leaderboard if finished
                logger.info(`Tournament ${tournamentCode} is finished, redirecting to leaderboard`);
                window.location.href = `/leaderboard/${tournamentCode}`;

                try {
                    router.replace(`/leaderboard/${tournamentCode}`);
                } catch (err) {
                    logger.error(`Router redirect error: ${err}`);
                }
            } else {
                // Fallback or error handling
                logger.warn(`Unexpected status received in tournament_already_started: ${status}`);
                window.location.href = '/';
            }
        });

        // Listen for potential lobby errors from the server
        socket.on(SOCKET_EVENTS.LOBBY.LOBBY_ERROR, ({ error, message }) => {
            logger.error(`Lobby error received: ${message} (${error})`);
            // TODO: Display this error to the user appropriately
            alert(`Erreur: ${message}`); // Simple alert for now
            router.replace('/'); // Redirect home on error
        });

        // Debug: log all socket events
        socket.onAny((event, ...args) => {
            logger.debug(`Socket event: ${event}`, args);
        });

        // Add safeguards to explicitly ignore live tournament-specific events
        // that should not be processed in the lobby context
        socket.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_QUESTION, () => {
            // Explicitly ignore - these events should be handled in the live tournament page
            logger.warn("Received tournament_question event in lobby - ignoring");
        });

        socket.on(SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_SET_TIMER, () => {
            // Explicitly ignore - these events should be handled in the live tournament page
            logger.warn("Received tournament_set_timer event in lobby - ignoring");
        });

        // Clean up on unmount
        return () => {
            if (socket && socket.connected) {
                socket.emit(SOCKET_EVENTS.LOBBY.LEAVE_LOBBY, { accessCode: code });
                socket.disconnect();
            }
        };
    }, [code, userState, userProfile.username, userProfile.avatar, isLoading]); // Only depend on stable values

    // Note: Removed old countdown effect - redirect now handled by COUNTDOWN_COMPLETE event

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io();
        }

        const socket = socketRef.current;

        // Listen for redirect_to_quiz event
        socket.on(SOCKET_EVENTS.LOBBY.REDIRECT_TO_QUIZ, ({ quizId }) => {
            logger.info(`Received redirect_to_quiz for quiz ${quizId}, redirecting...`);
            router.push(`/quiz/${quizId}`);
        });

        return () => {
            if (socket) {
                socket.off(SOCKET_EVENTS.LOBBY.REDIRECT_TO_QUIZ);
            }
        };
    }, [router]);

    // Add debug logging to see which events are received but don't add duplicate listeners
    useEffect(() => {
        if (!socketRef.current) return;

        const socket = socketRef.current;

        // Only add logging for events, not handlers
        socket.onAny((event, ...args) => {
            console.log(`[Lobby] Socket event received: ${event}`, args);
        });

        return () => {
            // Remove the debug listener on cleanup
            socket.offAny();
        };
    }, [socketRef]);

    // Handler for start button
    const handleStart = () => {
        if (isCreator && socketRef.current) {
            logger.info("Starting tournament", { code, socketConnected: socketRef.current.connected });
            // Updated to use new backend API payload format
            socketRef.current.emit(SOCKET_EVENTS.TOURNAMENT.START_TOURNAMENT, { accessCode: code });
        } else {
            logger.warn("Cannot start tournament", { isCreator, socketReady: !!socketRef.current });
        }
    };

    // Handler for share button
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: "Rejoignez le tournoi !",
                text: `Code du tournoi : ${code}`,
                url: window.location.href,
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Lien copié dans le presse-papier !");
        }
    };

    // Normalize participant avatars: always use backend-provided avatarEmoji only, no fallback or normalization
    const normalizedParticipants = participants.map((p) => ({
        ...p,
        avatar: p.avatarEmoji
    }));

    return (
        <div className="main-content">
            <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
                <div className="flex flex-col gap-8 w-full">
                    {/* First row: Avatar/username | Code | Share button */}
                    <div className="flex flex-row items-center justify-between w-full gap-4">
                        {/* Avatar + username */}
                        <div className="flex items-center gap-3 min-w-0">
                            {creator ? (
                                <>
                                    <div className="w-[50px] h-[50px] rounded-full border-2 flex items-center justify-center text-3xl" style={{ borderColor: "var(--secondary)" }}>
                                        {creator.avatar}
                                    </div>
                                    <span className="font-bold text-lg truncate">{creator.username}</span>
                                </>
                            ) : (
                                <span>Chargement...</span>
                            )}
                        </div>
                        {/* Tournament code */}
                        <div className="flex flex-col items-center flex-1">
                            <span className="text-lg font-mono font-bold tracking-widest bg-base-200 rounded px-2 py-0.5 mt-1">{code}</span>
                        </div>
                        {/* Share button */}
                        <button
                            className="btn btn-sm btn-outline flex items-center justify-center"
                            onClick={handleShare}
                            aria-label="Partager le code du tournoi"
                            type="button"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                    <hr className="w-full border-base-300" />
                    <div className="w-full mt-0 mb-0 text-left">
                        <div className="font-semibold text-lg">Participants connectés</div>
                        <div className="h-4" />
                    </div>
                    <div className="w-full flex flex-col gap-0">
                        <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-4 justify-start w-full" style={{ maxHeight: '40vh' }}>
                            {normalizedParticipants.map((p, i) => (
                                <div key={p.id ? `${p.id}-${i}` : i} className="flex flex-col items-center">
                                    <div
                                        className="w-[49px] h-[49px] rounded-full border-2 flex items-center justify-center text-3xl"
                                        style={{ borderColor: "var(--primary)" }}
                                    >
                                        {p.avatar}
                                    </div>
                                    <span className="text-sm mt-0 truncate max-w-[70px]">{p.username}</span>
                                </div>
                            ))}
                        </div>
                        {isCreator && countdown === null && isQuizLinked === false && (
                            <div className="w-full flex justify-end">
                                <button className="btn btn-primary btn-lg mt-4" onClick={handleStart}>
                                    Démarrer le tournoi
                                </button>
                            </div>
                        )}
                        {countdown !== null && (
                            <div className="text-5xl font-extrabold text-primary mt-2 text-right w-full">{countdown}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
