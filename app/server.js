const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3007;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer, {
        path: "/api/socket/io",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    // In-memory maps for lobby and tournament state
    const lobbyParticipants = {};
    const tournamentState = {};

    io.on("connection", (socket) => {
        console.log("[Socket.IO] New connection:", socket.id);

        socket.on("join_lobby", ({ code, pseudo, avatar }) => {
            console.log(`[Socket.IO] join_lobby: code=${code}, pseudo=${pseudo}, avatar=${avatar}, socket.id=${socket.id}`);
            socket.join(code);
            if (!lobbyParticipants[code]) lobbyParticipants[code] = [];
            lobbyParticipants[code] = [
                ...lobbyParticipants[code].filter((p) => p.id !== socket.id),
                { id: socket.id, pseudo, avatar },
            ];
            io.to(code).emit("participant_joined", { pseudo, avatar, id: socket.id });
            io.to(code).emit("participants_list", lobbyParticipants[code]);
        });

        socket.on("leave_lobby", ({ code }) => {
            console.log(`[Socket.IO] leave_lobby: code=${code}, socket.id=${socket.id}`);
            socket.leave(code);
            if (lobbyParticipants[code]) {
                lobbyParticipants[code] = lobbyParticipants[code].filter((p) => p.id !== socket.id);
                io.to(code).emit("participant_left", { id: socket.id });
                io.to(code).emit("participants_list", lobbyParticipants[code]);
            }
        });

        socket.on("get_participants", ({ code }) => {
            console.log(`[Socket.IO] get_participants: code=${code}, socket.id=${socket.id}`);
            socket.emit("participants_list", lobbyParticipants[code] || []);
        });

        socket.on("start_tournament", async ({ code }) => {
            try {
                console.log('[Socket.IO] start_tournament code type:', typeof code, 'value:', code);
                console.log(`[Socket.IO] start_tournament: code=${code}, socket.id=${socket.id}`);
                // Fetch questions from the database for this tournament
                // For simplicity, fetch from REST API (could use Prisma directly if desired)
                const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
                let questions = [];
                try {
                    const res = await fetch(`http://localhost:${port}/api/tournament-questions?code=${code}`);
                    if (res.ok) {
                        questions = await res.json();
                    }
                } catch (e) {
                    console.error('[Socket.IO] Failed to fetch questions:', e);
                }
                console.log('[Socket.IO] Questions fetched:', questions.length, questions.map(q => q.uid));
                if (!questions.length) {
                    io.to(code).emit("tournament_end", { finalScore: 0, leaderboard: [] });
                    return;
                }
                // Log all rooms and sockets in the room before emitting
                console.log('[Socket.IO] Rooms:', Array.from(io.sockets.adapter.rooms.keys()));
                console.log('[Socket.IO] Sockets in room', code, ':', io.sockets.adapter.rooms.get(code));
                // Notify lobby clients to start countdown
                io.to(code).emit("tournament_started");
                console.log(`[Socket.IO] tournament_started emitted to room ${code}`);
                await prisma.tournoi.update({
                    where: { code },
                    data: { date_debut: new Date(), statut: 'en cours' }
                });
                tournamentState[code] = {
                    participants: {},
                    questions,
                    currentIndex: 0,
                    started: true,
                    answers: {},
                    timer: null,
                    questionStart: null,
                };
                // Wait 5 seconds before starting the tournament
                setTimeout(() => {
                    sendQuestionWithState(code, 0);
                }, 5000);
                function sendQuestionWithState(code, idx) {
                    const state = tournamentState[code];
                    if (!state) return;
                    const q = state.questions[idx];
                    if (!q) return;
                    const time = q.temps || 20;
                    state.currentIndex = idx;
                    state.questionStart = Date.now();
                    io.to(`tournament_${code}`).emit("tournament_question", {
                        question: q,
                        index: idx,
                        total: state.questions.length,
                        time,
                    });
                    if (state.timer) clearTimeout(state.timer);
                    state.timer = setTimeout(async () => {
                        if (idx + 1 < state.questions.length) {
                            sendQuestionWithState(code, idx + 1);
                        } else {
                            const leaderboard = Object.entries(state.participants)
                                .map(([id, p]) => ({ id, ...p }))
                                .sort((a, b) => b.score - a.score);
                            io.to(`tournament_${code}`).emit("tournament_end", {
                                finalScore: leaderboard.find(p => p.id === socket.id)?.score || 0,
                                leaderboard,
                            });
                            await prisma.tournoi.update({
                                where: { code },
                                data: { date_fin: new Date(), statut: 'terminé', leaderboard }, // leaderboard is the final leaderboard array
                            });
                            io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
                            delete tournamentState[code];
                        }
                    }, time * 1000);
                }
            } catch (err) {
                console.error('[Socket.IO] Error in start_tournament:', err);
            }
        });

        // --- TOURNAMENT REAL-TIME LOGIC ---
        socket.on("join_tournament", async ({ code }) => {
            socket.join(`tournament_${code}`);
            // Add participant to tournament state if not present
            if (!tournamentState[code]) return;
            if (!tournamentState[code].participants[socket.id]) {
                const lobby = lobbyParticipants[code] || [];
                const found = lobby.find(p => p.id === socket.id);
                tournamentState[code].participants[socket.id] = {
                    score: 0,
                    pseudo: found?.pseudo || 'Joueur',
                    avatar: found?.avatar || '/avatars/cat-face.svg',
                };
            }
            // Late joiner: send current question with adjusted timer
            const state = tournamentState[code];
            if (state && state.currentIndex !== undefined && state.questionStart) {
                const idx = state.currentIndex;
                const q = state.questions[idx];
                const time = q.temps || 20;
                const elapsed = Math.ceil((Date.now() - state.questionStart) / 1000);
                const remaining = Math.max(0, time - elapsed);
                if (remaining >= 0) {
                    socket.emit("tournament_question", {
                        question: q,
                        index: idx,
                        total: state.questions.length,
                        time: remaining,
                    });
                }
            }
        });

        socket.on("tournament_answer", ({ code, questionUid, answerIdx, clientTimestamp }) => {
            const state = tournamentState[code];
            if (!state) return;
            const qIdx = state.currentIndex;
            const question = state.questions[qIdx];
            const timeAllowed = question.temps || 20;
            const questionStart = state.questionStart;
            // Only accept answers within the allowed window
            if (!questionStart || (clientTimestamp - questionStart) > timeAllowed * 1000) return;
            if (!state.answers[socket.id]) state.answers[socket.id] = {};
            // Prevent multiple answers for the same question
            if (state.answers[socket.id][questionUid]) return;
            state.answers[socket.id][questionUid] = { answerIdx, clientTimestamp };

            // --- SCORING LOGIC ---
            let baseScore = 0;
            if (question.type === 'choix_multiple') {
                // Multiple choice: answerIdx is an array of selected indices
                // (for now, assume answerIdx is a single index; adapt if needed)
                // TODO: update client to send array for multiple choice
                const selected = Array.isArray(answerIdx) ? answerIdx : [answerIdx];
                let good = 0, bad = 0, totalGood = 0;
                question.reponses.forEach((rep, idx) => {
                    if (rep.correct) totalGood++;
                    if (selected.includes(idx)) {
                        if (rep.correct) good++;
                        else bad++;
                    }
                });
                let raw = 100 * good - 100 * bad;
                // Normalize: min 0, max 100
                baseScore = Math.max(0, Math.min(100, totalGood ? raw / totalGood : 0));
            } else {
                // Single choice: +100 for correct
                const correct = question && question.reponses[answerIdx]?.correct;
                baseScore = correct ? 100 : 0;
            }
            // Rapidity bonus: up to 5 points
            let rapidity = 0;
            if (questionStart && clientTimestamp) {
                const timeUsed = (clientTimestamp - questionStart) / 1000;
                rapidity = Math.max(0, Math.min(5, 5 * (1 - timeUsed / timeAllowed)));
            }
            const totalScore = Math.round(baseScore + rapidity);
            if (!state.participants[socket.id]) state.participants[socket.id] = { score: 0 };
            state.participants[socket.id].score += totalScore;
            socket.emit("tournament_answer_result", {
                correct: baseScore > 0,
                score: state.participants[socket.id].score,
                explanation: question?.explication || null,
                baseScore,
                rapidity: Math.round(rapidity * 100) / 100,
                totalScore,
            });
        });

        socket.on("disconnecting", () => {
            console.log(`[Socket.IO] disconnecting: socket.id=${socket.id}, rooms=`, Array.from(socket.rooms));
            socket.rooms.forEach((room) => {
                if (room !== socket.id && lobbyParticipants[room]) {
                    lobbyParticipants[room] = lobbyParticipants[room].filter((p) => p.id !== socket.id);
                    io.to(room).emit("participant_left", { id: socket.id });
                    io.to(room).emit("participants_list", lobbyParticipants[room]);
                }
            });
        });
    });

    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
