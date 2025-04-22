'use client'; // Likely needs client-side logic for real-time updates

import React, { useState, useEffect } from 'react';
// import Scoreboard from '@/components/Scoreboard'; // Import when ready

// Mock data structure - replace with actual data fetching
interface CurrentQuestion {
    question: string;
    reponses: { texte: string }[]; // Only show text, not correctness
    temps?: number;
}

interface PlayerScore {
    pseudo: string;
    score: number;
    avatar?: string;
}

export default function ProjectorView() {
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [scores, setScores] = useState<PlayerScore[]>([]);
    const [tournamentStatus, setTournamentStatus] = useState<'waiting' | 'question' | 'results' | 'finished'>('waiting');

    // TODO: Implement real-time connection (WebSocket/SSE) to receive updates
    useEffect(() => {
        const eventSource = new EventSource('/api/tournament/stream');
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'update' && data.tournamentState) {
                    // Example: update projector state from SSE
                    setTournamentStatus(data.tournamentState.status || 'waiting');
                    setCurrentQuestion(data.tournamentState.currentQuestion || null);
                    setScores(data.tournamentState.scores || []);
                    setTimeLeft(data.tournamentState.timeLeft || null);
                }
            } catch { }
        };
        return () => eventSource.close();
    }, []);

    useEffect(() => {
        // Placeholder: Simulate receiving data
        const timer = setTimeout(() => {
            setTournamentStatus('question');
            setCurrentQuestion({
                question: 'Combien font 2 + 2 ?',
                reponses: [{ texte: '3' }, { texte: '4' }, { texte: '5' }],
                temps: 30,
            });
            setTimeLeft(30);
            setScores([
                { pseudo: 'Alice', score: 100 },
                { pseudo: 'Bob', score: 80 },
                { pseudo: 'Charlie', score: 120 },
            ]);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    // Timer countdown effect
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || tournamentStatus !== 'question') return;
        const intervalId = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft, tournamentStatus]);

    // Display based on status
    const renderContent = () => {
        switch (tournamentStatus) {
            case 'waiting':
                return <p className="text-2xl">En attente du démarrage du tournoi...</p>;
            case 'question':
                return (
                    <>
                        {currentQuestion && (
                            <div className="mb-8 p-6 bg-blue-100 rounded-lg shadow">
                                <h2 className="text-3xl font-semibold mb-4">{currentQuestion.question}</h2>
                                <ul className="list-disc list-inside space-y-2 text-xl">
                                    {currentQuestion.reponses.map((rep, index) => (
                                        <li key={index}>{rep.texte}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {timeLeft !== null && (
                            <div className="text-6xl font-bold text-red-600 mb-8">
                                Temps restant : {timeLeft}s
                            </div>
                        )}
                        {/* <Scoreboard scores={scores} /> */}
                        <h3 className="text-2xl font-semibold mt-8 mb-4">Classement Actuel (Placeholder)</h3>
                        <ol className="list-decimal list-inside space-y-1">
                            {scores.sort((a, b) => b.score - a.score).slice(0, 5).map(s => (
                                <li key={s.pseudo}>{s.pseudo} - {s.score} pts</li>
                            ))}
                        </ol>
                    </>
                );
            case 'results':
                return <p className="text-2xl">Affichage des résultats...</p>; // TODO
            case 'finished':
                return <p className="text-2xl">Tournoi terminé !</p>; // TODO: Show final podium
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-base-200">
            <div className="card w-full max-w-2xl shadow-xl bg-base-100">
                <div className="card-body items-center gap-8">
                    <h1 className="card-title text-4xl mb-10 text-center">Vue Projecteur - MathQuest</h1>
                    <div className="w-full flex flex-col items-center">
                        {(() => {
                            switch (tournamentStatus) {
                                case 'waiting':
                                    return <div className="alert alert-info text-xl justify-center">En attente du démarrage du tournoi...</div>;
                                case 'question':
                                    return (
                                        <>
                                            {currentQuestion && (
                                                <div className="card w-full bg-primary bg-opacity-10 mb-8">
                                                    <div className="card-body items-center">
                                                        <h2 className="card-title text-3xl mb-4">{currentQuestion.question}</h2>
                                                        <ul className="flex flex-col gap-2 w-full">
                                                            {currentQuestion.reponses.map((rep, index) => (
                                                                <li key={index} className="badge badge-lg badge-outline w-full text-xl justify-center">{rep.texte}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                            {timeLeft !== null && (
                                                <div className="text-6xl font-bold text-error mb-8">
                                                    Temps restant : {timeLeft}s
                                                </div>
                                            )}
                                            <h3 className="text-2xl font-semibold mt-8 mb-4">Classement Actuel (Placeholder)</h3>
                                            <ol className="flex flex-col gap-1 w-full items-center">
                                                {scores.sort((a, b) => b.score - a.score).slice(0, 5).map(s => (
                                                    <li key={s.pseudo} className="badge badge-secondary badge-lg w-full justify-center">{s.pseudo} - {s.score} pts</li>
                                                ))}
                                            </ol>
                                        </>
                                    );
                                case 'results':
                                    return <div className="alert alert-info text-xl justify-center">Affichage des résultats...</div>;
                                case 'finished':
                                    return <div className="alert alert-success text-xl justify-center">Tournoi terminé !</div>;
                                default:
                                    return null;
                            }
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
