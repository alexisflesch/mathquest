"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';
import { Share2 } from "lucide-react";

export default function LobbyPage() {
    const { code } = useParams();
    const router = useRouter();
    const { isTeacher, isStudent, isLoading } = useAuth();
    const [isCreator, setIsCreator] = useState(true); // TODO: Replace with real logic
    const [countdown, setCountdown] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [participants, setParticipants] = useState<{ id: string; pseudo: string; avatar: string }[]>([]);
    const [creator, setCreator] = useState<{ pseudo: string; avatar: string } | null>(null);

    // Get correct pseudo/avatar for current session
    const getCurrentIdentity = useCallback(() => {
        if (typeof window === 'undefined') {
            console.log('[Lobby][getCurrentIdentity] Not running in browser, window is undefined');
            return null;
        }
        console.log('[Lobby][getCurrentIdentity] isTeacher:', isTeacher, 'isStudent:', isStudent);
        if (isTeacher) {
            const pseudo = localStorage.getItem('mathquest_teacher_pseudo');
            const avatar = localStorage.getItem('mathquest_teacher_avatar');
            console.log('[Lobby][getCurrentIdentity] teacher pseudo:', pseudo, 'avatar:', avatar);
            if (pseudo && avatar) return { pseudo, avatar: `/avatars/${avatar}` };
        } else if (isStudent) {
            const pseudo = localStorage.getItem('mathquest_pseudo');
            const avatar = localStorage.getItem('mathquest_avatar');
            console.log('[Lobby][getCurrentIdentity] student pseudo:', pseudo, 'avatar:', avatar);
            if (pseudo && avatar) return { pseudo, avatar: `/avatars/${avatar}` };
        }
        console.log('[Lobby][getCurrentIdentity] No valid identity found');
        return null;
    }, [isTeacher, isStudent]);

    // Redirect to home if not logged in as teacher or student
    useEffect(() => {
        if (isLoading) return; // Wait for auth state to load
        const identity = getCurrentIdentity();
        console.log('[Lobby][useEffect redirect] identity:', identity);
        if (!identity) {
            console.log('[Lobby][useEffect redirect] No identity, redirecting to /');
            router.replace('/');
        }
    }, [isTeacher, isStudent, isLoading, getCurrentIdentity, router]);

    // Fetch tournament and creator info
    useEffect(() => {
        async function fetchCreator() {
            const res = await fetch(`/api/tournament-status?code=${code}`);
            if (!res.ok) return;
            const status = await res.json();
            if (status.statut === 'terminé') {
                router.replace(`/tournament/leaderboard/${code}`);
                return;
            }
            if (status.statut === 'en cours') {
                router.replace(`/tournament/${code}`);
                return;
            }
            const tournoiRes = await fetch(`/api/tournament?code=${code}`);
            if (!tournoiRes.ok) return;
            const tournoi = await tournoiRes.json();
            console.log("[Lobby] Tournament fetched:", tournoi);
            // If the tournament is already started, redirect to tournament page
            if (tournoi.statut && tournoi.statut !== 'en préparation') {
                router.replace(`/tournament/${code}`);
                return;
            }
            let creatorData = null;
            if (tournoi.cree_par_joueur_id) {
                // Fetch student creator
                console.log("[Lobby] Fetching student creator", tournoi.cree_par_joueur_id);
                const resJ = await fetch(`/api/joueur?id=${tournoi.cree_par_joueur_id}`);
                console.log("[Lobby] Joueur fetch status:", resJ.status);
                if (resJ.ok) {
                    const joueur = await resJ.json();
                    console.log("[Lobby] Joueur fetched:", joueur);
                    creatorData = { pseudo: joueur.pseudo, avatar: `/avatars/${joueur.avatar || "cat-face.svg"}` };
                }
            } else if (tournoi.cree_par_enseignant_id) {
                // Fetch teacher creator
                console.log("[Lobby] Fetching teacher creator", tournoi.cree_par_enseignant_id);
                const resE = await fetch(`/api/enseignant?id=${tournoi.cree_par_enseignant_id}`);
                console.log("[Lobby] Enseignant fetch status:", resE.status);
                if (resE.ok) {
                    const enseignant = await resE.json();
                    console.log("[Lobby] Enseignant fetched:", enseignant);
                    creatorData = { pseudo: enseignant.pseudo, avatar: `/avatars/${enseignant.avatar || "cat-face.svg"}` };
                }
            } else {
                // No creator found
                console.log("[Lobby] No creator found in tournament");
                creatorData = { pseudo: "Inconnu", avatar: "/avatars/cat-face.svg" };
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
            identity.pseudo === creator.pseudo &&
            identity.avatar === creator.avatar
        );
    }, [creator, isTeacher, isStudent, getCurrentIdentity]);

    useEffect(() => {
        // Connect to socket.io server
        const socket = io({
            path: "/api/socket/io",
            transports: ["websocket"],
        });
        socketRef.current = socket;

        // Join the lobby room with correct identity
        const identity = getCurrentIdentity();
        if (!identity) return;
        // Get cookie_id from localStorage
        let cookie_id = null;
        if (typeof window !== 'undefined') {
            cookie_id = localStorage.getItem('mathquest_cookie_id');
            console.log('[Lobby] cookie_id before join_lobby:', cookie_id);
        }
        socket.emit("join_lobby", {
            code,
            pseudo: identity.pseudo,
            avatar: identity.avatar,
            cookie_id,
        });

        // Debug: log after join_lobby
        console.log("[Lobby] Emitted join_lobby for code", code);

        // Request the current participants list
        socket.emit("get_participants", { code });

        // Listen for the full participants list
        socket.on("participants_list", (list) => {
            console.log("[Lobby] Received participants_list:", list);
            setParticipants(list);
        });

        // Listen for participant join/leave events
        socket.on("participant_joined", (participant) => {
            setParticipants((prev) => {
                if (prev.some((p) => p.id === participant.id)) return prev;
                return [...prev, participant];
            });
            console.log("[Lobby] participant_joined:", participant);
        });
        socket.on("participant_left", (participant) => {
            setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
            console.log("[Lobby] participant_left:", participant);
        });
        // Listen for tournament_started event from server
        socket.on("tournament_started", () => {
            console.log("[Lobby] Received tournament_started event");
            setCountdown(5);
            const interval = setInterval(() => {
                setCountdown((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });
        // Debug: log all socket events
        socket.onAny((event, ...args) => {
            console.log("[Lobby] socket event:", event, args);
        });

        // Clean up on unmount
        return () => {
            socket.emit("leave_lobby", { code });
            socket.disconnect();
        };
    }, [code, isTeacher, isStudent, getCurrentIdentity, router]);

    useEffect(() => {
        if (countdown === 0) {
            // Redirect to tournament page when countdown ends
            router.push(`/tournament/${code}`);
        }
    }, [countdown, code, router]);

    // Handler for start button
    const handleStart = () => {
        if (isCreator && socketRef.current) {
            console.log("[Lobby] Emitting start_tournament", code, socketRef.current.connected);
            socketRef.current.emit("start_tournament", { code });
        } else {
            console.log("[Lobby] Not creator or socket not ready", isCreator, !!socketRef.current);
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100 relative">
                <div className="card-body items-center gap-8 w-full">
                    {/* First row: Avatar/pseudo | Code | Share button */}
                    <div className="flex flex-row items-center justify-between w-full gap-4">
                        {/* Avatar + pseudo */}
                        <div className="flex items-center gap-3 min-w-0">
                            {creator ? (
                                <>
                                    <Image src={creator.avatar} alt="avatar" width={44} height={44} className="w-[44px] h-[44px] rounded-full border-2 border-primary" />
                                    <span className="font-bold text-lg truncate">{creator.pseudo}</span>
                                </>
                            ) : (
                                <span>Chargement...</span>
                            )}
                        </div>
                        {/* Tournament code */}
                        <div className="flex flex-col items-center flex-1">
                            {/* Removed "Code du tournoi" text */}
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
                    {/* Horizontal line after first row */}
                    <hr className="w-full border-base-300 my-2" />
                    {/* Second row: Participants connectés */}
                    <div className="w-full mt-10 mb-0 text-left">
                        <div className="font-semibold text-lg">Participants connectés</div>
                        <div className="h-4" /> {/* Add spacing after title */}
                    </div>
                    {/* Third row: Participants list, start button, countdown */}
                    <div className="w-full flex flex-col gap-6">
                        {/* Participants list */}
                        <div className="flex flex-wrap gap-4 justify-start w-full">
                            {participants.map((p, i) => (
                                <div key={p.id || i} className="flex flex-col items-center">
                                    <Image
                                        src={p.avatar.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`}
                                        alt="avatar"
                                        width={40}
                                        height={40}
                                        className="w-[40px] h-[40px] rounded-full border border-base-300"
                                    />
                                    <span className="text-sm mt-1 truncate max-w-[70px]">{p.pseudo}</span>
                                </div>
                            ))}
                        </div>
                        {/* Only show the start button for the creator */}
                        {isCreator && countdown === null && (
                            <div className="w-full flex justify-end">
                                <button className="btn btn-primary btn-lg mt-4" onClick={handleStart}>
                                    Démarrer le tournoi
                                </button>
                            </div>
                        )}
                        {/* Countdown timer */}
                        {countdown !== null && (
                            <div className="text-5xl font-extrabold text-primary mt-2 text-right w-full">{countdown}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
