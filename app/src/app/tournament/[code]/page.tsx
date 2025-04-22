"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import Image from 'next/image';
import { Timer } from 'lucide-react';

interface TournamentQuestion {
    uid: string;
    question: string;
    reponses: { texte: string; correct?: boolean }[];
    type: string;
    discipline: string;
    theme: string;
    difficulte: number;
    niveau: string;
    auteur?: string;
    explication?: string;
    tags?: string[];
    temps?: number;
}

export default function TournamentSessionPage() {
    const { code } = useParams();
    const router = useRouter();
    // DEV MODE: check for ?dev=1&mode=choix_simple or ?dev=1&mode=choix_multiple
    const [devMode, setDevMode] = useState(false);
    const [devModeType, setDevModeType] = useState<'choix_simple' | 'choix_multiple'>('choix_simple');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<TournamentQuestion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const [waiting, setWaiting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { isStudent, isTeacher } = useAuth();
    const [myPseudo, setMyPseudo] = useState<string | null>(null);
    const [myAvatar, setMyAvatar] = useState<string | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]); // For multiple choice

    // Add responsive countdown timer display
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Connect to socket.io and handle real-time events
    useEffect(() => {
        // DEV MODE: check URL params
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('dev') === '1') {
                setDevMode(true);
                const mode = params.get('mode');
                if (mode === 'choix_multiple') setDevModeType('choix_multiple');
                else setDevModeType('choix_simple');
            }
        }
    }, []);

    useEffect(() => {
        if (devMode) {
            // Mock question for dev mode
            const mockQuestion = devModeType === 'choix_multiple' ? {
                uid: 'mock2',
                question: 'Quelles sont les couleurs primaires ?',
                reponses: [
                    { texte: 'Rouge', correct: true },
                    { texte: 'Vert', correct: false },
                    { texte: 'Bleu', correct: true },
                    { texte: 'Jaune', correct: true },
                ],
                type: 'choix_multiple',
                discipline: 'Arts',
                theme: 'Couleurs',
                difficulte: 1,
                niveau: 'CE2',
            } : {
                uid: 'mock1',
                question: 'Combien font 7 + 5 ?',
                reponses: [
                    { texte: '10', correct: false },
                    { texte: '12', correct: true },
                    { texte: '13', correct: false },
                    { texte: '14', correct: false },
                ],
                type: 'choix_simple',
                discipline: 'Maths',
                theme: 'Additions',
                difficulte: 1,
                niveau: 'CE2',
            };
            setCurrentQuestion(mockQuestion);
            setQuestionIndex(0);
            setTotalQuestions(1);
            setAnswered(false);
            setShowResult(false);
            setResult(null);
            setTimer(20); // Only set timer here, when question changes
            setWaiting(false);
            return;
        }
        const s = io({
            path: "/api/socket/io",
            transports: ["websocket"],
        });
        setSocket(s);

        // Join the tournament room
        let cookie_id = null;
        let pseudo = null;
        let avatar = null;
        if (typeof window !== 'undefined') {
            cookie_id = localStorage.getItem('mathquest_cookie_id');
            pseudo = localStorage.getItem('mathquest_pseudo');
            avatar = localStorage.getItem('mathquest_avatar');
            console.log('[Tournament] cookie_id before join_tournament:', cookie_id);
            console.log('[Tournament] pseudo before join_tournament:', pseudo);
            console.log('[Tournament] avatar before join_tournament:', avatar);
        }
        s.emit("join_tournament", { code, cookie_id, pseudo, avatar });

        // Receive a new question
        s.on("tournament_question", ({ question, index, total, time }) => {
            setCurrentQuestion(question);
            setQuestionIndex(index);
            setTotalQuestions(total);
            setAnswered(false);
            setShowResult(false);
            setResult(null);
            setTimer(time || 20);
            setWaiting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setWaiting(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        });

        // Receive answer result
        s.on("tournament_answer_result", ({ /* correct, newScore */ }) => {
            setAnswered(true);
            setShowResult(false); // Don't show result
            setResult(null);      // Don't show result
        });

        // Receive tournament end
        s.on("tournament_end", ({ finalScore }) => {
            setShowResult(true);
            setResult(`Tournoi terminé ! Score : ${finalScore}`);
            setCurrentQuestion(null);
            setWaiting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optionally: show leaderboard
        });

        // Get pseudo/avatar from localStorage for highlighting
        if (typeof window !== 'undefined') {
            let pseudo = null;
            let avatar = null;
            if (isStudent) {
                pseudo = localStorage.getItem('mathquest_pseudo');
                avatar = localStorage.getItem('mathquest_avatar');
            } else if (isTeacher) {
                pseudo = localStorage.getItem('mathquest_teacher_pseudo');
                avatar = localStorage.getItem('mathquest_teacher_avatar');
            }
            setMyPseudo(pseudo);
            setMyAvatar(avatar);
        }

        return () => {
            s.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [code, isStudent, isTeacher, devMode, devModeType]);

    // Timer logic for dev mode
    useEffect(() => {
        if (!devMode) return;
        if (timerRef.current) clearInterval(timerRef.current);
        if (timer !== null && timer > 0) {
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [devMode, timer]);

    useEffect(() => {
        if (devMode) return; // In dev mode, skip socket logic and timer end handling
        if (!currentQuestion || timer === null) return;
        if (timer === 0) {
            setWaiting(true);
        }
    }, [timer, currentQuestion, devMode]);

    useEffect(() => {
        if (devMode) return; // In dev mode, skip socket logic
        if (!socket) return;
        // Listen for tournament finished redirect
        socket.on("tournament_finished_redirect", ({ code }) => {
            router.replace(`/tournament/leaderboard/${code}`);
        });
        return () => {
            socket.off("tournament_finished_redirect");
        };
    }, [socket, router, devMode]);

    // Reset selected answers when new question arrives
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswers([]);
    }, [currentQuestion]);

    // Helper: is multiple choice
    const isMultipleChoice = currentQuestion?.type === "choix_multiple";

    // Submit for multiple choice
    const handleSubmitMultiple = () => {
        if (devMode) {
            if (!currentQuestion || answered || waiting || selectedAnswers.length === 0) return;
            setAnswered(true);
            // Calculate score: +10 if all correct selected, else 0
            // In dev mode, do NOT show leaderboard or set showResult/result
            // Optionally, you can show a feedback message here if you want
            return;
        }
        if (!socket || !currentQuestion || answered || waiting || selectedAnswers.length === 0) return;
        const clientTimestamp = Date.now();
        socket.emit("tournament_answer", {
            code,
            questionUid: currentQuestion.uid,
            answerIdx: selectedAnswers, // Send array for multiple
            clientTimestamp,
        });
        setAnswered(true);
    };

    // Instead, just show a simple end message if needed
    if (devMode && !currentQuestion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card bg-base-100 shadow-xl p-8">
                    <div className="card-body items-center">
                        <div className="text-xl font-bold">Fin du test dev mode.</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion && !showResult) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card bg-base-100 shadow-xl p-8">
                    <div className="card-body items-center">
                        <div className="text-xl font-bold">En attente du début du tournoi…</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            {isMobile ? (
                <div className="fixed top-16 right-4 z-50 flex items-center navbar-timer-bg px-4 py-2 rounded-full shadow-lg border border-primary"
                    style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
                    <div className="flex items-center gap-1 align-middle">
                        <Timer className="w-5 h-5" style={{ display: 'block', color: 'var(--primary-foreground)' }} />
                        <span className="text-lg font-bold flex items-center leading-none" style={{ color: 'var(--primary-foreground)' }}>{timer !== null ? timer : '-'}</span>
                    </div>
                </div>
            ) : (
                <div className="fixed top-4 right-8 z-50 flex items-center justify-center navbar-timer-bg px-6 py-2 rounded-full shadow-lg border border-primary"
                    style={{ background: 'var(--navbar)', color: 'var(--primary-foreground)' }}>
                    <Timer className="w-6 h-6 mr-2" style={{ display: 'block', color: 'var(--primary-foreground)' }} />
                    <span className="text-xl font-bold flex items-center leading-none" style={{ color: 'var(--primary-foreground)' }}>{timer !== null ? timer : '-'}</span>
                </div>
            )}
            <div className="card w-full max-w-xl shadow-xl bg-base-100 mt-20">
                <div className="card-body items-center gap-8">
                    {currentQuestion && (
                        <>
                            <div className="w-full bg-base-200 rounded-xl p-6 flex flex-col gap-6 items-center">
                                <h3 className="text-2xl mb-2 font-bold">Question {questionIndex + 1} / {totalQuestions}</h3>
                                <div className="mb-4 text-xl font-semibold text-center">
                                    {currentQuestion.question}
                                </div>
                                <ul className="flex flex-col w-full">
                                    {currentQuestion.reponses.map((rep, idx) => {
                                        const isSelected = isMultipleChoice
                                            ? selectedAnswers.includes(idx)
                                            : selectedAnswer === idx;
                                        return (
                                            <li
                                                key={idx}
                                                className={idx !== currentQuestion.reponses.length - 1 ? "mb-2" : ""}
                                            >
                                                <button
                                                    className={[
                                                        "btn-answer w-full text-left transition-colors",
                                                        "bg-base-100",
                                                        "rounded-lg py-3 px-4"
                                                    ].join(" ")}
                                                    style={{
                                                        border: isSelected ? '2px solid var(--navbar)' : '2px solid transparent',
                                                        boxShadow: isSelected ? '0 0 0 2px var(--navbar)' : undefined,
                                                        background: isSelected ? 'var(--light-blue)' : undefined,
                                                    }}
                                                    onClick={() => {
                                                        if (waiting) return;
                                                        if (isMultipleChoice) {
                                                            if (answered) return;
                                                            setSelectedAnswers((prev) =>
                                                                prev.includes(idx)
                                                                    ? prev.filter((i) => i !== idx)
                                                                    : [...prev, idx]
                                                            );
                                                        } else {
                                                            // choix_simple: send answer immediately, allow changing answer
                                                            if (devMode) {
                                                                setSelectedAnswer(idx === selectedAnswer ? null : idx);
                                                                setAnswered(true);
                                                                // Optionally: handle dev mode feedback here
                                                                return;
                                                            }
                                                            setSelectedAnswer(idx === selectedAnswer ? null : idx);
                                                            if (!socket || !currentQuestion) return;
                                                            const clientTimestamp = Date.now();
                                                            socket.emit("tournament_answer", {
                                                                code,
                                                                questionUid: currentQuestion.uid,
                                                                answerIdx: idx,
                                                                clientTimestamp,
                                                            });
                                                            setAnswered(true);
                                                        }
                                                    }}
                                                >
                                                    {rep.texte}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {isMultipleChoice && (
                                    <button
                                        className="btn btn-primary mt-2 self-end"
                                        onClick={handleSubmitMultiple}
                                        disabled={answered || selectedAnswers.length === 0}
                                    >
                                        Valider
                                    </button>
                                )}
                                {/* Remove score display */}
                                {/* <div className="font-bold">Score: {score}</div> */}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
