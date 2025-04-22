"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

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
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<TournamentQuestion | null>(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const [waiting, setWaiting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<{ id: string; pseudo: string; avatar: string; score: number }[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Connect to socket.io and handle real-time events
    useEffect(() => {
        const s = io({
            path: "/api/socket/io",
            transports: ["websocket"],
        });
        setSocket(s);

        // Join the tournament room
        s.emit("join_tournament", { code });

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
        s.on("tournament_answer_result", ({ correct, score: newScore, explanation }) => {
            setAnswered(true);
            setShowResult(true);
            setResult(correct ? "Bonne réponse !" : "Mauvaise réponse.");
            setScore(newScore);
            setWaiting(true);
            if (timerRef.current) clearInterval(timerRef.current);
        });

        // Receive tournament end
        s.on("tournament_end", ({ finalScore, leaderboard }) => {
            setShowResult(true);
            setResult(`Tournoi terminé ! Score : ${finalScore}`);
            setCurrentQuestion(null);
            setWaiting(false);
            setLeaderboard(leaderboard || []);
            if (timerRef.current) clearInterval(timerRef.current);
            // Optionally: show leaderboard
        });

        return () => {
            s.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [code]);

    // Send answer to server
    const handleAnswer = (repIdx: number) => {
        if (!socket || !currentQuestion || answered || waiting) return;
        const clientTimestamp = Date.now();
        socket.emit("tournament_answer", {
            code,
            questionUid: currentQuestion.uid,
            answerIdx: repIdx,
            clientTimestamp,
        });
        setAnswered(true);
        setWaiting(true);
    };

    // Show leaderboard at the end
    if (!currentQuestion && showResult && result?.startsWith("Tournoi terminé") && leaderboard) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card w-full max-w-xl shadow-xl bg-base-100">
                    <div className="card-body items-center gap-8">
                        <h1 className="card-title text-3xl mb-2 text-center">Classement final</h1>
                        <ol className="w-full flex flex-col gap-2">
                            {leaderboard.map((p, idx) => (
                                <li key={p.id} className={`flex items-center gap-4 p-2 rounded ${idx === 0 ? 'bg-yellow-100 font-bold' : ''}`}>
                                    <img src={p.avatar?.startsWith('/') ? p.avatar : `/avatars/${p.avatar}`} alt="avatar" className="w-8 h-8 rounded-full border border-base-300" />
                                    <span className="w-8 text-center">#{idx + 1}</span>
                                    <span className="flex-1">{p.pseudo || 'Joueur'}</span>
                                    <span className="font-mono text-lg">{p.score}</span>
                                </li>
                            ))}
                        </ol>
                        <div className="alert alert-info text-center text-lg font-bold">{result}</div>
                        <button className="btn btn-primary mt-4" onClick={() => router.push("/")}>Retour &apos;à l&apos;accueil</button>
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
            <div className="card w-full max-w-xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-3xl mb-2 text-center">Tournoi</h1>
                    {currentQuestion && (
                        <div className="card w-full bg-base-200 shadow-inner">
                            <div className="card-body flex flex-col gap-6 items-center">
                                <h3 className="card-title text-2xl mb-2">Question {questionIndex + 1} / {totalQuestions}</h3>
                                <div className="mb-4 text-xl font-semibold text-center">
                                    {currentQuestion.question}
                                </div>
                                <ul className="flex flex-col gap-3 w-full">
                                    {currentQuestion.reponses.map((rep, idx) => (
                                        <li key={idx} className="card-answer">
                                            <button
                                                className={`btn-answer w-full text-left ${answered ? 'btn-disabled' : ''}`}
                                                onClick={() => handleAnswer(idx)}
                                                disabled={answered || waiting}
                                            >
                                                {rep.texte}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className="font-bold">Score: {score}</div>
                                {timer !== null && (
                                    <div className="text-2xl font-mono text-primary">⏰ {timer}s</div>
                                )}
                            </div>
                        </div>
                    )}
                    {showResult && (
                        <div className="alert alert-info text-center text-lg font-bold">{result}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
