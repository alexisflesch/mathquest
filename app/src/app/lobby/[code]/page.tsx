"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useAuth } from '@/components/AuthProvider';

// Placeholder avatars and participants for now
const mockCreator = {
    pseudo: "Créateur",
    avatar: "/avatars/cat-face.svg",
};

export default function LobbyPage() {
    const { code } = useParams();
    const router = useRouter();
    const { isTeacher, isStudent } = useAuth();
    const [isCreator, setIsCreator] = useState(true); // TODO: Replace with real logic
    const [countdown, setCountdown] = useState<number | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [participants, setParticipants] = useState<{ id: string; pseudo: string; avatar: string }[]>([]);
    const [creator, setCreator] = useState<{ pseudo: string; avatar: string } | null>(null);

    // Get correct pseudo/avatar for current session
    function getCurrentIdentity() {
        if (typeof window === 'undefined') return null;
        if (isTeacher) {
            const pseudo = localStorage.getItem('mathquest_teacher_pseudo');
            const avatar = localStorage.getItem('mathquest_teacher_avatar');
            if (pseudo && avatar) return { pseudo, avatar: `/avatars/${avatar}` };
        } else if (isStudent) {
            const pseudo = localStorage.getItem('mathquest_pseudo');
            const avatar = localStorage.getItem('mathquest_avatar');
            if (pseudo && avatar) return { pseudo, avatar: `/avatars/${avatar}` };
        }
        return null;
    }

    // Redirect to home if not logged in as teacher or student
    useEffect(() => {
        const identity = getCurrentIdentity();
        if (!identity) {
            router.replace('/');
        }
    }, [isTeacher, isStudent]);

    // Fetch tournament and creator info
    useEffect(() => {
        async function fetchCreator() {
            const res = await fetch(`/api/tournament?code=${code}`);
            console.log("[Lobby] Tournament fetch status:", res.status);
            if (!res.ok) return;
            const tournoi = await res.json();
            console.log("[Lobby] Tournament fetched:", tournoi);
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
    }, [code]);

    // Determine if the current user is the creator
    useEffect(() => {
        if (!creator) return;
        const identity = getCurrentIdentity();
        setIsCreator(
            !!identity &&
            identity.pseudo === creator.pseudo &&
            identity.avatar === creator.avatar
        );
    }, [creator, isTeacher, isStudent]);

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
        socket.emit("join_lobby", {
            code,
            pseudo: identity.pseudo,
            avatar: identity.avatar,
        });

        // Debug: log after join_lobby
        console.log("[Lobby] Emitted join_lobby for code", code);

        // Request the current participants list
        socket.emit("get_participants", { code });

        // Listen for the full participants list
        socket.on("participants_list", (list) => {
            setParticipants(list);
        });

        // Listen for participant join/leave events
        socket.on("participant_joined", (participant) => {
            setParticipants((prev) => {
                if (prev.some((p) => p.id === participant.id)) return prev;
                return [...prev, participant];
            });
            console.log("Participant joined:", participant);
        });
        socket.on("participant_left", (participant) => {
            setParticipants((prev) => prev.filter((p) => p.id !== participant.id));
            console.log("Participant left:", participant);
        });
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [code, isTeacher, isStudent]);

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
                {/* Share button */}
                <button
                    className="absolute top-4 right-4 btn btn-sm btn-outline"
                    onClick={handleShare}
                    aria-label="Partager le code du tournoi"
                >
                    <span className="material-icons">share</span>
                </button>
                <div className="card-body items-center gap-8">
                    {/* Creator info */}
                    <div className="flex items-center gap-4 mt-2">
                        {creator ? (
                            <>
                                <img src={creator.avatar} alt="avatar" className="w-[50px] h-[50px] rounded-full border-2 border-primary" />
                                <span className="font-bold text-xl">{creator.pseudo}</span>
                                {/* <span className="badge badge-primary ml-2">Créateur</span> */}
                            </>
                        ) : (
                            <span>Chargement du créateur...</span>
                        )}
                    </div>
                    {/* Tournament code */}
                    <div className="flex flex-col items-center">
                        <span className="text-lg text-gray-500">Code du tournoi</span>
                        <span className="text-3xl font-mono font-bold tracking-widest bg-base-200 rounded px-4 py-2 mt-1">{code}</span>
                    </div>
                    {/* Participants list */}
                    <div className="w-full">
                        <div className="mb-2 font-semibold text-lg">Participants connectés</div>
                        <div className="flex flex-wrap gap-4">
                            {participants.map((p, i) => (
                                <div key={p.id || i} className="flex flex-col items-center">
                                    <img src={p.avatar.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`} alt="avatar" className="w-[40px] h-[40px] rounded-full border border-base-300" />
                                    <span className="text-sm mt-1">{p.pseudo}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Only show the start button for the creator */}
                    {isCreator && countdown === null && (
                        <button className="btn btn-primary btn-lg mt-4" onClick={handleStart}>
                            Démarrer le tournoi
                        </button>
                    )}
                    {/* Countdown timer */}
                    {countdown !== null && (
                        <div className="text-5xl font-extrabold text-primary mt-4">{countdown}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
