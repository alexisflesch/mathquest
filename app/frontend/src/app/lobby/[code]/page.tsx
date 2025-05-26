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
import Image from 'next/image';
import { Share2 } from "lucide-react";
import { createLogger } from '@/clientLogger';
import { SOCKET_CONFIG } from '@/config';

// Create a logger for this component
const logger = createLogger('Lobby');

export default function LobbyPage() {
    const { code } = useParams();
    const router = useRouter();
    const { isTeacher, isStudent, isLoading } = useAuth();
    const [isCreator, setIsCreator] = useState(true); // TODO: Replace with real logic
    const [countdown, setCountdown] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [participants, setParticipants] = useState<{ id: string; username: string; avatar: string }[]>([]);
    const [creator, setCreator] = useState<{ username: string; avatar: string } | null>(null);
    const [isQuizLinked, setIsQuizLinked] = useState<boolean | null>(null);    // Function to check tournament status and redirect if needed
    const checkTournamentStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/tournament-status?code=${code}`);
            if (!res.ok) return;
            const status = await res.json();

            if (status.statut === 'terminé') {
                logger.info(`Tournament ${code} is finished, redirecting to leaderboard`);
                router.replace(`/leaderboard/${code}`);
            } else if (status.statut === 'en cours') {
                logger.info(`Tournament ${code} is already in progress, redirecting`);
                if (socketRef.current) {
                    socketRef.current.emit("leave_lobby", { code });
                }

                // Check if this is a quiz-linked tournament
                try {
                    const quizRes = await fetch(`/api/quiz?tournament_code=${code}`);
                    if (quizRes.ok) {
                        const quizData = await quizRes.json();
                        if (quizData && quizData.id) {
                            logger.info(`Tournament ${code} is linked to quiz ${quizData.id}, forcing immediate redirect`);
                            window.location.href = `/live/${code}`;
                            return; // Skip router.replace after forcing navigation
                        }
                    }
                } catch (quizErr) {
                    logger.error(`Error checking if tournament is quiz-linked: ${quizErr}`);
                }

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
        logger.debug('Identity check', { isTeacher, isStudent });
        if (isTeacher) {
            const username = localStorage.getItem('mathquest_username');
            const avatar = localStorage.getItem('mathquest_avatar');
            logger.debug('Teacher identity', { username, avatar });
            if (username && avatar) return { username, avatar: `/avatars/${avatar}` };
        } else if (isStudent) {
            const username = localStorage.getItem('mathquest_username');
            const avatar = localStorage.getItem('mathquest_avatar');
            logger.debug('Student identity', { username, avatar });
            if (username && avatar) return { username, avatar: `/avatars/${avatar}` };
        }
        logger.warn('No valid identity found');
        return null;
    }, [isTeacher, isStudent]);

    // Fetch tournament and creator info
    useEffect(() => {
        async function fetchCreator() {
            const res = await fetch(`/api/tournament-status?code=${code}`);
            if (!res.ok) return;
            const status = await res.json();
            if (status.statut === 'terminé') {
                router.replace(`/leaderboard/${code}`);
                return;
            }
            if (status.statut === 'en cours') {
                router.replace(`/live/${code}`);
                return;
            }
            const tournoiRes = await fetch(`/api/tournament?code=${code}`);
            if (!tournoiRes.ok) return;
            const tournoi = await tournoiRes.json();
            logger.debug("Tournament fetched", { id: tournoi.id, code: tournoi.code, statut: tournoi.statut });
            // If the tournament is already started, redirect to tournament page
            if (tournoi.statut && tournoi.statut !== 'en préparation') {
                router.replace(`/live/${code}`);
                return;
            }
            let creatorData = null;
            if (tournoi.cree_par_joueur_id) {
                // Fetch student creator
                logger.debug("Fetching student creator", { id: tournoi.cree_par_joueur_id });
                const resJ = await fetch(`/api/joueur?id=${tournoi.cree_par_joueur_id}`);
                logger.debug("Joueur fetch status", { status: resJ.status });
                if (resJ.ok) {
                    const joueur = await resJ.json();
                    logger.debug("Joueur fetched", { id: joueur.id, username: joueur.username });
                    creatorData = { username: joueur.username, avatar: `/avatars/${joueur.avatar || "cat-face.svg"}` };
                }
            } else if (tournoi.cree_par_enseignant_id) {
                // Fetch teacher creator
                logger.debug("Fetching teacher creator", { id: tournoi.cree_par_enseignant_id });
                const resE = await fetch(`/api/enseignant?id=${tournoi.cree_par_enseignant_id}`);
                logger.debug("Enseignant fetch status", { status: resE.status });
                if (resE.ok) {
                    const enseignant = await resE.json();
                    logger.debug("Enseignant fetched", { id: enseignant.id, username: enseignant.username });
                    creatorData = { username: enseignant.username, avatar: `/avatars/${enseignant.avatar || "cat-face.svg"}` };
                }
            } else {
                // No creator found
                logger.warn("No creator found in tournament");
                creatorData = { username: "Inconnu", avatar: "/avatars/cat-face.svg" };
            }
            if (creatorData) setCreator(creatorData);
        }
        fetchCreator();
    }, [code, router]);

    // Determine if the current user is the creator
    useEffect(() => {
        if (!creator) return;
        const identity = getCurrentIdentity();
        setIsCreator(
            !!identity &&
            identity.username === creator.username &&
            identity.avatar === creator.avatar
        );
    }, [creator, isTeacher, isStudent, getCurrentIdentity]);

    useEffect(() => {
        // Connect to socket.io server
        logger.info('Creating socket connection with config:', SOCKET_CONFIG);
        // Use the centralized SOCKET_CONFIG without local overrides for transports and timeout
        const socket = io(SOCKET_CONFIG.url, {
            ...SOCKET_CONFIG,
        });
        socketRef.current = socket;

        // Handle connection errors and reconnection
        socket.on('connect_error', (err) => {
            logger.error(`Socket connection error: ${err.message}`);
        });

        socket.on('disconnect', (reason) => {
            logger.warn(`Socket disconnected: ${reason}`);
            // Check tournament status on disconnect to ensure we don't miss redirection
            setTimeout(checkTournamentStatus, 1000);
        });

        socket.on('reconnect', (attemptNumber) => {
            logger.info(`Socket reconnected after ${attemptNumber} attempts`);
            // Re-join room after reconnection
            const identity = getCurrentIdentity();
            if (identity) {
                const userId = localStorage.getItem('mathquest_cookie_id') || `temp_${socket.id}`;
                socket.emit("join_lobby", {
                    accessCode: code,
                    userId,
                    username: identity.username,
                    avatarUrl: identity.avatar,
                });
                // Check tournament status after reconnect
                checkTournamentStatus();
            }
        });

        // Join the lobby room with correct identity
        const identity = getCurrentIdentity();
        if (!identity) return;
        // Get userId from localStorage (using cookie_id as userId for compatibility)
        let userId = null;
        if (typeof window !== 'undefined') {
            userId = localStorage.getItem('mathquest_cookie_id') || `temp_${socket.id}`;
            logger.debug('userId before join_lobby', { userId });
        }
        socket.emit("join_lobby", {
            accessCode: code,
            userId,
            username: identity.username,
            avatarUrl: identity.avatar,
        });

        // Debug: log after join_lobby
        logger.info("Joined lobby", { code });

        // Request the current participants list
        socket.emit("get_participants", { accessCode: code });

        // Listen for the full participants list
        socket.on("participants_list", (data) => {
            if (Array.isArray(data)) {
                setParticipants(data);
                setIsQuizLinked(false); // fallback for old format
            } else {
                setParticipants(data.participants || []);
                setIsQuizLinked(data.isQuizLinked === undefined ? false : !!data.isQuizLinked);
            }
        });

        // Listen for participant join/leave events
        socket.on("participant_joined", (participant) => {
            setParticipants((prev) => {
                if (prev.some((p) => p.id === participant.id)) return prev;
                return [...prev, participant];
            });
            logger.debug("Participant joined", { id: participant.id, username: participant.username });
        });

        socket.on("participant_left", (participant) => {
            setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
            logger.debug("Participant left", { id: participant.id, username: participant.username });
        });

        // Listen for redirect_to_game event (new backend event for game start)
        socket.on("redirect_to_game", ({ accessCode, gameId }) => {
            const targetCode = accessCode || code;
            logger.info(`Received redirect_to_game event, redirecting immediately to ${targetCode}`);

            // Add direct console.log for visibility in browser console
            console.log(`%c⚠️ REDIRECT TO GAME EVENT RECEIVED! Redirecting to /live/${targetCode}`, 'background: #ff0000; color: white; font-size: 16px; padding: 5px;');

            // Force-leave the lobby room before redirecting
            socket.emit("leave_lobby", { accessCode: targetCode });

            // Use immediate window.location navigation instead of Next.js router to ensure redirection
            console.log('Executing window.location navigation now...');
            window.location.href = `/live/${targetCode}`;

            // Also try the Next.js router as a fallback
            try {
                router.replace(`/live/${targetCode}`);
            } catch (err) {
                logger.error(`Router redirect error: ${err}`);
            }
        });

        // Listen for game_started event (new backend event)
        socket.on("game_started", ({ accessCode, gameId }) => {
            const targetCode = accessCode || code;
            logger.info(`Game started (code: ${targetCode}), beginning countdown`);
            setCountdown(5);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(interval);
                        logger.info(`Countdown complete, will redirect to /live/${targetCode}`);

                        // Force-leave the lobby room before redirecting
                        socket.emit("leave_lobby", { accessCode: targetCode });

                        // Use immediate window.location navigation for more reliable redirects
                        window.location.href = `/live/${targetCode}`;

                        // Also try router as fallback
                        try {
                            router.replace(`/live/${targetCode}`);
                        } catch (err) {
                            logger.error(`Router redirect error: ${err}`);
                        }

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        // Keep legacy support for old events during transition
        // Listen for redirect_to_tournament event (legacy support - immediate redirect for quiz-triggered tournaments)
        socket.on("redirect_to_tournament", ({ code: redirectCode }) => {
            const targetCode = redirectCode || code;
            logger.info(`Received redirect_to_tournament event, redirecting immediately to ${targetCode}`);

            // Add direct console.log for visibility in browser console
            console.log(`%c⚠️ REDIRECT EVENT RECEIVED! Redirecting to /live/${targetCode}`, 'background: #ff0000; color: white; font-size: 16px; padding: 5px;');

            // Force-leave the lobby room before redirecting
            socket.emit("leave_lobby", { accessCode: targetCode });

            // Use immediate window.location navigation instead of Next.js router to ensure redirection
            console.log('Executing window.location navigation now...');
            window.location.href = `/live/${targetCode}`;

            // Also try the Next.js router as a fallback
            try {
                router.replace(`/live/${targetCode}`);
            } catch (err) {
                logger.error(`Router redirect error: ${err}`);
            }
        });

        // Additional check for tournament status on connection to catch cases where
        // the tournament started but we missed the start event

        // Check status initially
        checkTournamentStatus();

        // Listen for tournament_started event from server (legacy - normal tournaments with countdown)
        socket.on("tournament_started", (data) => {
            const tournamentCode = data?.code || code; // Use provided code or current code
            logger.info(`Tournament started (code: ${tournamentCode}), beginning countdown`);
            setCountdown(5);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(interval);
                        logger.info(`Countdown complete, will redirect to /live/${tournamentCode}`);

                        // Force-leave the lobby room before redirecting
                        socket.emit("leave_lobby", { accessCode: tournamentCode });

                        // Use immediate window.location navigation for more reliable redirects
                        window.location.href = `/live/${tournamentCode}`;

                        // Also try router as fallback
                        try {
                            router.replace(`/live/${tournamentCode}`);
                        } catch (err) {
                            logger.error(`Router redirect error: ${err}`);
                        }

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        // Listen for the event indicating the tournament already started
        socket.on("tournament_already_started", ({ code: tournamentCode, status }) => {
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
        socket.on("lobby_error", ({ error, message }) => {
            logger.error(`Lobby error received: ${message} (${error})`);
            // TODO: Display this error to the user appropriately
            alert(`Erreur: ${message}`); // Simple alert for now
            router.replace('/'); // Redirect home on error
        });        // Debug: log all socket events
        socket.onAny((event, ...args) => {
            logger.debug(`Socket event: ${event}`, args);
        });

        // Add global notification handler to catch tournament notifications
        socket.on("tournament_notification", (data) => {
            logger.info(`Received tournament_notification: ${JSON.stringify(data)}`);

            if (data.type === "redirect" && data.code === code) {
                logger.info(`Global notification to redirect to tournament ${data.code}. isQuizMode=${data.isQuizMode}, immediate=${data.immediate}`);

                // Skip countdown for quiz mode - force an immediate redirect
                if (data.isQuizMode || data.immediate) {
                    logger.info(`QUIZ MODE REDIRECT: Forcing immediate redirect to /live/${data.code}`);
                    // Force-leave the lobby first
                    socket.emit("leave_lobby", { accessCode: code });

                    // Force a hard navigation (most reliable)
                    window.location.href = `/live/${data.code}`;

                    try {
                        router.replace(`/live/${data.code}`);
                    } catch (err) {
                        logger.error(`Router redirect error: ${err}`);
                    }
                } else {
                    // For non-quiz tournaments, we might show countdown (handled by tournament_started event)
                    logger.info(`Regular tournament redirect notification received for code ${data.code}`);
                    window.location.href = `/live/${data.code}`;
                }
            }
        });

        // Add safeguards to explicitly ignore live tournament-specific events
        // that should not be processed in the lobby context
        socket.on("tournament_question", () => {
            // Explicitly ignore - these events should be handled in the live tournament page
            logger.warn("Received tournament_question event in lobby - ignoring");
        });

        socket.on("tournament_set_timer", () => {
            // Explicitly ignore - these events should be handled in the live tournament page
            logger.warn("Received tournament_set_timer event in lobby - ignoring");
        });

        // Clean up on unmount
        return () => {
            socket.emit("leave_lobby", { accessCode: code });
            socket.disconnect();
        };
    }, [code, isTeacher, isStudent, getCurrentIdentity, router]);

    useEffect(() => {
        if (countdown === 0) {
            // Redirect to tournament page when countdown ends
            logger.info(`Countdown reached zero, redirecting to live/${code}`);

            // Force redirect with window.location for reliability
            window.location.href = `/live/${code}`;

            // Also try Next.js router as backup
            try {
                router.replace(`/live/${code}`);
            } catch (err) {
                logger.error(`Router redirect error: ${err}`);
            }
        }
    }, [countdown, code, router]);

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io();
        }

        const socket = socketRef.current;

        // Listen for redirect_to_quiz event
        socket.on('redirect_to_quiz', ({ quizId }) => {
            logger.info(`Received redirect_to_quiz for quiz ${quizId}, redirecting...`);
            router.push(`/quiz/${quizId}`);
        });

        return () => {
            if (socket) {
                socket.off('redirect_to_quiz');
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
            socketRef.current.emit("start_tournament", { accessCode: code });
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
    // --- LOGIN CHECK AND REDIRECT ---
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const username = localStorage.getItem('mathquest_username');
        const avatar = localStorage.getItem('mathquest_avatar');
        if (!username || !avatar) {
            router.replace(`/student?redirect=/lobby/${code}`);
        }
    }, [code, router]);

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
                                    <Image src={creator.avatar} alt="avatar" width={44} height={44} className="w-[50px] h-[50px] rounded-full border-2" style={{ borderColor: "var(--secondary)" }} />
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
                            {participants.map((p, i) => (
                                <div key={p.id ? `${p.id}-${i}` : i} className="flex flex-col items-center">
                                    <Image
                                        src={p.avatar.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`}
                                        alt="avatar"
                                        width={40}
                                        height={40}
                                        className="w-[49px] h-[49px] rounded-full border-2"
                                        style={{ borderColor: "var(--primary)" }}
                                    />
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
