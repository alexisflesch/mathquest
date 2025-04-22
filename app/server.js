const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");

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
            if (!questions.length) {
                io.to(code).emit("tournament_end", { finalScore: 0, leaderboard: [] });
                return;
            }
            tournamentState[code] = {
                participants: {},
                questions,
                currentIndex: 0,
                started: true,
                answers: {},
                timer: null,
                questionStart: null,
            };
            // Start the first question
            const sendQuestion = (idx) => {
                const q = questions[idx];
                if (!q) return;
                const time = q.temps || 20;
                tournamentState[code].currentIndex = idx;
                tournamentState[code].questionStart = Date.now();
                io.to(`tournament_${code}`).emit("tournament_question", {
                    question: q,
                    index: idx,
                    total: questions.length,
                    time,
                });
                // Start timer for this question
                if (tournamentState[code].timer) clearTimeout(tournamentState[code].timer);
                tournamentState[code].timer = setTimeout(() => {
                    // Move to next question or end
                    if (idx + 1 < questions.length) {
                        sendQuestion(idx + 1);
                    } else {
                        // End tournament
                        const leaderboard = Object.entries(tournamentState[code].participants)
                            .map(([id, p]) => ({ id, ...p }))
                            .sort((a, b) => b.score - a.score);
                        io.to(`tournament_${code}`).emit("tournament_end", {
                            finalScore: leaderboard.find(p => p.id === socket.id)?.score || 0,
                            leaderboard,
                        });
                        delete tournamentState[code];
                    }
                }, time * 1000);
            };
            sendQuestion(0);
        });

        // --- TOURNAMENT REAL-TIME LOGIC ---
        socket.on("join_tournament", async ({ code }) => {
            socket.join(`tournament_${code}`);
            // Add participant to tournament state if not present
            if (!tournamentState[code]) return;
            if (!tournamentState[code].participants[socket.id]) {
                // Try to get pseudo/avatar from lobbyParticipants
                const lobby = lobbyParticipants[code] || [];
                const found = lobby.find(p => p.id === socket.id);
                tournamentState[code].participants[socket.id] = {
                    score: 0,
                    pseudo: found?.pseudo || 'Joueur',
                    avatar: found?.avatar || '/avatars/cat-face.svg',
                };
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
