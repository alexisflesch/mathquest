/**
 * tournamentHandler.js - Tournament Socket Event Handler
 * 
 * This module handles all Socket.IO events related to tournaments in MathQuest.
 * It manages the real-time game flow for both live and differed (asynchronous) tournaments.
 * 
 * Key responsibilities:
 * - Manage tournament state (questions, participants, timers, scores)
 * - Process student answers and calculate scores
 * - Handle tournament lifecycle (start, question progression, pause/resume, end)
 * - Support both live tournaments and differed (self-paced) tournaments
 * - Persist tournament results to the database
 * 
 * The module exports:
 * - registerTournamentHandlers: Function to register all socket event handlers
 * - tournamentState: In-memory state store of active tournaments
 * - trigger* functions: Functions that can be called by other modules to trigger tournament actions
 */

const prisma = require('../db'); // Adjust path as needed
const createLogger = require('../logger');
const logger = createLogger('TournamentHandler');

const tournamentState = {}; // Encapsulated state

// Helper function to calculate score (extracted for clarity)
function calculateScore(question, answer, questionStartTime) {
    let baseScore = 0, rapidity = 0, totalScore = 0;
    const timeAllowed = question.temps || 20;

    if (answer) {
        if (question.type === 'choix_multiple') {
            const selected = Array.isArray(answer.answerIdx) ? answer.answerIdx : [answer.answerIdx];
            let good = 0, bad = 0, totalGood = 0;
            question.reponses.forEach((rep, idx) => {
                if (rep.correct) totalGood++;
                if (selected.includes(idx)) {
                    if (rep.correct) good++;
                    else bad++;
                }
            });
            let raw = 100 * good - 100 * bad;
            baseScore = Math.max(0, Math.min(100, totalGood ? raw / totalGood : 0));
        } else {
            const correct = question?.reponses[answer.answerIdx]?.correct;
            baseScore = correct ? 100 : 0;
        }

        if (questionStartTime && answer.clientTimestamp) {
            const timeUsed = (answer.clientTimestamp - questionStartTime) / 1000;
            // Ensure timeUsed doesn't exceed timeAllowed for score calculation
            const effectiveTimeUsed = Math.min(timeUsed, timeAllowed);
            rapidity = Math.max(0, Math.min(5, 5 * (1 - effectiveTimeUsed / timeAllowed)));
        }
        totalScore = Math.round(baseScore + rapidity);
    }
    return { baseScore, rapidity, totalScore };
}

// *** Add initialTime parameter ***
function sendQuestionWithState(io, code, idx, initialTime = null) {
    const state = tournamentState[code];
    if (!state || !state.questions || idx >= state.questions.length) {
        logger.error(`Invalid state or index for code ${code}, index ${idx}`);
        return; // Should ideally handle end of tournament here or before calling
    }

    const q = state.questions[idx];
    if (!q) {
        logger.error(`Question not found at index ${idx} for code ${code}`);
        return;
    }

    // *** Use initialTime if provided, otherwise use question's time ***
    const time = initialTime !== null ? initialTime : (q.temps || 20);
    state.currentIndex = idx;
    state.questionStart = Date.now();
    state.paused = false;
    state.pausedRemainingTime = null;
    state.currentQuestionDuration = time; // Set current duration based on initialTime or q.temps

    // Enhanced debug logging
    logger.debug(`Preparing to emit tournament_question:`, {
        code,
        questionIndex: idx,
        questionId: q.uid,
        questionText: q.question.substring(0, 30) + (q.question.length > 30 ? '...' : ''),
        time,
        responseCount: q.reponses ? q.reponses.length : 0
    });

    // Log room info before emitting
    const roomName = `tournament_${code}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    logger.debug(`Emitting to room ${roomName} with ${room ? room.size : 0} connected sockets`);
    if (room && room.size > 0) {
        logger.debug(`Socket IDs in room:`, Array.from(room));
    } else {
        logger.warn(`No sockets in room ${roomName} to receive question`);
    }

    logger.info(`Emitting tournament_question (idx: ${idx}, uid: ${q.uid}) to room tournament_${code}`);
    io.to(`tournament_${code}`).emit("tournament_question", {
        question: q,
        index: idx,
        total: state.questions.length,
        remainingTime: time, // Send full time initially
        questionState: "active",
    });

    if (state.timer) clearTimeout(state.timer);

    // Only start timer automatically if not in quiz mode (classic tournament mode)
    if (!state.linkedQuizId) {
        state.timer = setTimeout(async () => {
            if (state.paused) return; // Don't proceed if paused

            logger.info(`Timer expired for question ${idx} (uid: ${q.uid}) in tournament ${code}`);

            // --- SCORING: Evaluate latest answer for each participant ---
            const participantScores = {}; // Store scores for this question
            Object.entries(state.participants).forEach(([joueurId, participant]) => {
                const answer = state.answers[joueurId]?.[q.uid];
                const { baseScore, rapidity, totalScore } = calculateScore(q, answer, state.questionStart);

                participant.score += totalScore; // Update total score
                participantScores[joueurId] = { baseScore, rapidity, totalScore, currentTotal: participant.score };

                // Emit result to each participant
                const socketId = Object.entries(state.socketToJoueur || {}).find(([sid, jid]) => jid === joueurId)?.[0];
                if (socketId) {
                    io.to(socketId).emit("tournament_answer_result", {
                        correct: baseScore > 0,
                        score: participant.score, // Send updated total score
                        explanation: q?.explication || null,
                        baseScore,
                        rapidity: Math.round(rapidity * 100) / 100,
                        totalScore, // Score for this question
                    });
                }
            });

            // --- Move to next question or end tournament ---
            if (idx + 1 < state.questions.length) {
                sendQuestionWithState(io, code, idx + 1);
            } else {
                logger.info(`Ending tournament ${code}`);
                // Build final leaderboard
                const leaderboard = Object.values(state.participants)
                    .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                    .sort((a, b) => b.score - a.score);

                io.to(`tournament_${code}`).emit("tournament_end", {
                    leaderboard,
                    // finalScore is participant-specific, maybe remove from general emit?
                });

                // --- Save all scores for live participants (including disconnected) ---
                try {
                    const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                    if (tournoi) {
                        for (const participant of Object.values(state.participants)) {
                            if (!participant.isDiffered) { // Only save live scores here
                                const joueurId = participant.id;
                                const scoreValue = participant.score;
                                // Check if joueur exists (might be socket_id if no cookie)
                                if (!joueurId.startsWith('socket_')) {
                                    const existing = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
                                    if (existing) {
                                        await prisma.score.update({ where: { id: existing.id }, data: { score: scoreValue, date_score: new Date() } });
                                    } else {
                                        await prisma.score.create({ data: { tournoi_id: tournoi.id, joueur_id: joueurId, score: scoreValue, date_score: new Date() } });
                                    }
                                }
                            }
                        }
                        // Update tournament status and final leaderboard
                        await prisma.tournoi.update({
                            where: { code },
                            data: { date_fin: new Date(), statut: 'terminé', leaderboard },
                        });
                    }
                } catch (err) {
                    logger.error(`Error saving live scores or updating tournament ${code}:`, err);
                }

                io.to(`tournament_${code}`).emit("tournament_finished_redirect", { code });
                delete tournamentState[code]; // Clean up state
            }
        }, time * 1000);
    }
}

// --- Trigger Functions (Exported) ---
// *** Add initialTime parameter ***
function triggerTournamentQuestion(io, code, index, linkedQuizId = null, initialTime = null) {
    const state = tournamentState[code];
    if (!state || !state.questions || index >= state.questions.length) {
        logger.error(`Invalid state or index for code ${code}, index ${index}`);
        return;
    }
    state.linkedQuizId = linkedQuizId;

    // Enhanced debug logging
    logger.debug(`triggerTournamentQuestion called with code=${code}, index=${index}, linkedQuizId=${linkedQuizId || 'none'}`);
    logger.debug(`Tournament state before sending question:`, {
        currentIndex: state.currentIndex,
        questionCount: state.questions.length,
        question: state.questions[index] ? {
            uid: state.questions[index].uid,
            question: state.questions[index].question,
            type: state.questions[index].type
        } : 'not found'
    });

    // Log room info
    const roomName = `tournament_${code}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    logger.debug(`Room ${roomName} has ${room ? room.size : 0} connected sockets`);
    if (room && room.size > 0) {
        logger.debug(`Sockets in room:`, Array.from(room));
    }

    // *** Pass initialTime to sendQuestionWithState ***
    sendQuestionWithState(io, code, index, initialTime);
}
function triggerTournamentPause(io, code) {
    const state = tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && !state.paused) {
        // Calculate remaining time based on elapsed time since question start
        const elapsed = (Date.now() - state.questionStart) / 1000;
        const timeAllowed = state.questions[state.currentIndex]?.temps || 20;
        state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);

        // Set paused flag to true
        state.paused = true;

        // Clear the existing timer to prevent it from continuing to run in the background
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        logger.info(`Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
        io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "paused", remainingTime: state.pausedRemainingTime });
    }
}
function triggerTournamentResume(io, code) {
    const state = tournamentState[code]; // Only applicable to live tournaments
    if (state && !state.isDiffered && state.paused) {
        state.paused = false;
        state.questionStart = Date.now() - ((state.questions[state.currentIndex]?.temps || 20) - state.pausedRemainingTime) * 1000; // Adjust start time
        const remaining = state.pausedRemainingTime;
        state.pausedRemainingTime = null;

        logger.info(`Resuming tournament ${code}. Remaining time: ${remaining.toFixed(1)}s`);
        io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "active", remainingTime: remaining });

        // Restart timer
        if (state.timer) clearTimeout(state.timer);
        state.timer = setTimeout(async () => { /* ... same logic as in sendQuestionWithState timer ... */ }, remaining * 1000);
        // TODO: Refactor timer logic to avoid duplication
    }
}
function triggerTournamentTimerSet(io, code, timeLeft) {
    const state = tournamentState[code];
    if (state) {
        logger.info(`Timer set to ${timeLeft} seconds for tournament ${code}`);

        // Clear any existing timer
        if (state.timer) {
            clearTimeout(state.timer);
            state.timer = null;
        }

        // Update state
        if (timeLeft === 0) {
            // If timer is set to 0, consider the question "stopped"
            state.stopped = true; // Use explicit stopped state
            state.paused = false; // Not paused - this is a stopped state
            state.currentQuestionDuration = 0; // Update duration

            // Notify clients that time is up
            io.to(`tournament_${code}`).emit("tournament_set_timer", {
                timeLeft: 0,
                questionState: "stopped"
            });
        } else {
            // For other time settings, update the remaining time
            state.stopped = false; // Ensure not in stopped state

            // If paused, just store the new time
            if (state.paused) {
                state.pausedRemainingTime = timeLeft;
                state.currentQuestionDuration = timeLeft; // Update duration
                io.to(`tournament_${code}`).emit("tournament_set_timer", {
                    timeLeft,
                    questionState: "paused"
                });
            } else {
                // Active: restart timer and update duration
                const oldDuration = state.currentQuestionDuration; // Log old value
                state.questionStart = Date.now(); // Reset start time for new duration
                state.currentQuestionDuration = timeLeft; // Update duration
                state.timer = setTimeout(() => { /* ... same logic as in sendQuestionWithState timer ... */ }, timeLeft * 1000);

                io.to(`tournament_${code}`).emit("tournament_set_timer", {
                    timeLeft,
                    questionState: "active"
                });
            }
        }
    }
}

function registerTournamentHandlers(io, socket, prisma) {

    socket.on("start_tournament", async ({ code }) => {
        try {
            logger.info(`start_tournament: code=${code}, socket.id=${socket.id}`);

            // Fetch tournament first
            const tournoi = await prisma.tournoi.findUnique({
                where: { code }
            });

            if (!tournoi) {
                logger.error(`Tournament not found for code: ${code}`);
                // Maybe emit an error back to the starter?
                return;
            }

            // Then fetch questions separately using the IDs stored in the tournament
            const questions = await prisma.question.findMany({
                where: {
                    uid: {
                        in: tournoi.questions_ids || []
                    }
                },
                orderBy: [
                    { niveau: 'asc' },
                    { theme: 'asc' },
                ]
            });

            logger.info(`Questions fetched for ${code}:`, questions.length, questions.map(q => q.uid));

            if (!questions || questions.length === 0) {
                io.to(code).emit("tournament_end", { finalScore: 0, leaderboard: [] }); // End immediately if no questions
                await prisma.tournoi.update({ where: { code }, data: { statut: 'terminé' } });
                return;
            }

            // Notify lobby clients to start countdown
            io.to(code).emit("tournament_started");
            logger.info(`tournament_started emitted to lobby room ${code}`);

            // Update tournament status in DB
            await prisma.tournoi.update({
                where: { code },
                data: { date_debut: new Date(), statut: 'en cours' }
            });

            // Initialize state
            tournamentState[code] = {
                participants: {}, // Will be populated on join_tournament
                questions,
                currentIndex: -1, // Start at -1, will be set to 0 by sendQuestionWithState
                started: true,
                answers: {}, // { joueurId: { questionUid: { answerIdx, clientTimestamp } } }
                timer: null,
                questionStart: null,
                socketToJoueur: {}, // { socketId: joueurId }
                paused: false,
                pausedRemainingTime: null,
                linkedQuizId: null,
                currentQuestionDuration: null, // Added field
            };

            // Only wait 5 seconds before starting the first question if NOT linked to a quiz (classic mode)
            if (!tournamentState[code].linkedQuizId) {
                setTimeout(() => {
                    if (tournamentState[code]) {
                        sendQuestionWithState(io, code, 0);
                    }
                }, 5000);
            }
            // In quiz mode (linkedQuizId set), the teacher will trigger the first question manually
        } catch (err) {
            logger.error(`Error in start_tournament for code ${code}:`, err);
            // Consider emitting an error to the client
        }
    });

    socket.on("join_tournament", async ({ code, cookie_id, pseudo: clientPseudo, avatar: clientAvatar }) => {
        logger.info(`join_tournament received`, { code, cookie_id, pseudo: clientPseudo, avatar: clientAvatar, socketId: socket.id });
        socket.join(`tournament_${code}`);

        let pseudo = clientPseudo || 'Joueur';
        let avatar = clientAvatar || '/avatars/cat-face.svg';
        let joueurId = null;
        let joueur = null;

        // 1. Try to find/create Joueur using cookie_id
        if (cookie_id) {
            try {
                joueur = await prisma.joueur.findUnique({ where: { cookie_id } });
                if (!joueur) {
                    joueur = await prisma.joueur.create({ data: { pseudo, avatar, cookie_id } });
                } else {
                    pseudo = joueur.pseudo;
                    avatar = joueur.avatar || avatar;
                }
                joueurId = joueur.id;
            } catch (err) {
                logger.error(`Error finding/creating joueur with cookie_id ${cookie_id}:`, err);
            }
        }

        // 2. If no persistent joueurId, generate a temporary one for this session
        if (!joueurId) {
            // --- LOBBY FALLBACK LOGIC ---
            // Try to get pseudo/avatar from lobbyParticipants if available
            try {
                const { registerLobbyHandlers } = require('./lobbyHandler');
                const lobbyParticipants = require('./lobbyHandler').lobbyParticipants || {};
                const lobby = lobbyParticipants[code] || [];
                const found = lobby.find(p => p.id === socket.id);
                if (found) {
                    pseudo = found.pseudo || pseudo;
                    avatar = found.avatar || avatar;
                }
            } catch (e) { /* fallback silently */ }
            joueurId = `socket_${socket.id}`;
            logger.info(`No cookie_id or DB error, using temporary joueurId: ${joueurId}`);
        }

        // 3. Determine live/differed status
        let isDiffered = false;
        let tournoi = null;
        try {
            tournoi = await prisma.tournoi.findUnique({ where: { code } });
            if (!tournoi) {
                logger.error(`Tournament not found for code ${code}`);
                socket.emit("tournament_error", { message: "Le tournoi n'existe pas." });
                return;
            }

            if (tournoi.statut === 'terminé' || tournoi.statut === 'archivé') {
                isDiffered = true;
            }
            logger.info(`join_tournament: tournoi.statut=${tournoi.statut}, isDiffered=${isDiffered}`);
        } catch (err) {
            logger.error(`Error fetching tournoi status for code ${code}:`, err);
            socket.emit("tournament_error", { message: "Erreur de connexion au tournoi." });
            return;
        }

        // 4. Prevent replay in differed mode if already played (only if we have a persistent joueurId)
        if (isDiffered && joueurId && !joueurId.startsWith('socket_') && tournoi) {
            try {
                const existingScore = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
                if (existingScore) {
                    logger.info(`Joueur ${joueurId} already played differed tournament ${code}. Redirecting.`);
                    socket.emit("tournament_already_played", { code });
                    return; // Stop processing join
                }
            } catch (err) {
                logger.error(`Error checking previous score for differed mode (joueurId: ${joueurId}, tournoiId: ${tournoi.id}):`, err);
            }
        }

        // 5. Get or initialize state
        const stateKey = isDiffered ? `${code}_${joueurId}` : code;
        let state = tournamentState[stateKey];

        // IMPORTANT: Log socket room membership for debugging
        logger.debug(`Socket ${socket.id} current rooms:`, Array.from(socket.rooms));

        // Ensure socket has joined the tournament room with correct naming
        if (!socket.rooms.has(`tournament_${code}`)) {
            logger.debug(`Making socket ${socket.id} join tournament_${code} room`);
            socket.join(`tournament_${code}`);
        }

        // IMPORTANT: If no state exists but tournament is 'en cours', let's initialize it
        if (!state && tournoi.statut === 'en cours') {
            logger.info(`Tournament ${code} is in progress but state not found. Creating state.`);
            try {
                // Fetch questions for this tournament
                const questions = await prisma.question.findMany({
                    where: { uid: { in: tournoi.questions_ids || [] } },
                    orderBy: [{ niveau: 'asc' }, { theme: 'asc' }]
                });

                if (!questions || questions.length === 0) {
                    logger.error(`No questions found for tournament ${code}`);
                    socket.emit("tournament_error", { message: "Aucune question trouvée pour ce tournoi." });
                    return;
                }

                // Create new state for this tournament
                state = tournamentState[code] = {
                    participants: {},
                    questions,
                    currentIndex: 0, // Start with first question
                    started: true,
                    answers: {},
                    timer: null,
                    questionStart: Date.now(),
                    socketToJoueur: {},
                    paused: false,
                    pausedRemainingTime: null,
                    // *** ADDED: Ensure linkedQuizId is copied from DB record ***
                    linkedQuizId: tournoi.linkedQuizId || null,
                };
                logger.info(`Created new state for tournament ${code} with ${questions.length} questions`);
            } catch (err) {
                logger.error(`Error initializing tournament state for code ${code}:`, err);
                socket.emit("tournament_error", { message: "Erreur d'initialisation du tournoi." });
                return;
            }
        }

        if (!state) {
            if (isDiffered && tournoi) {
                // Create a personal state for this differed user
                logger.info(`Creating new state for differed player ${joueurId} in tournament ${code}`);
                let questions = [];
                try {
                    // Fetch questions specifically for this differed session
                    questions = await prisma.question.findMany({
                        where: { uid: { in: tournoi.questions_ids } },
                        orderBy: [{ niveau: 'asc' }, { theme: 'asc' }] // Use same order as live
                    });
                } catch (err) {
                    logger.error(`Error fetching questions for differed session ${stateKey}:`, err);
                    socket.emit("tournament_error", { message: "Erreur au chargement des questions." });
                    return;
                }
                state = tournamentState[stateKey] = {
                    participants: {}, questions, currentIndex: -1, started: true, answers: {},
                    timer: null, questionStart: null, socketToJoueur: {}, isDiffered: true // Mark state as differed
                };
            } else if (!isDiffered) {
                // Instead of returning error for live tournament, check if tournament is 'en préparation'
                if (tournoi.statut === 'en préparation') {
                    logger.info(`User joined tournament ${code} that is still in preparation`);
                    // Redirect back to lobby if tournament hasn't started yet
                    socket.emit("tournament_redirect_to_lobby", { code });
                    return;
                } else {
                    // Tournament is 'en cours' but something went wrong with state
                    logger.error(`join_tournament: Live tournament ${code} has status ${tournoi.statut} but state not found`);
                    socket.emit("tournament_error", { message: "Le tournoi n'est pas disponible. Essayez de rejoindre depuis le lobby." });
                    return;
                }
            }
        }

        // 6. Add/update participant in the state
        if (!state.participants[joueurId]) {
            state.participants[joueurId] = {
                id: joueurId,
                pseudo,
                avatar,
                score: 0,
                isDiffered, // Store participant's mode
            };
        } else {
            // Update details if they rejoin (e.g., reconnect)
            state.participants[joueurId].pseudo = pseudo;
            state.participants[joueurId].avatar = avatar;
            state.participants[joueurId].isDiffered = isDiffered; // Ensure mode is correct
        }

        // Map current socket ID to joueurId for this state
        state.socketToJoueur[socket.id] = joueurId;
        logger.debug(`Mapped socket ${socket.id} to joueur ${joueurId} in state ${stateKey}`);

        // 7. Send current/first question
        if (isDiffered) {
            // Send first question immediately to this user only
            if (state.questions && state.questions.length > 0 && state.currentIndex === -1) {
                logger.info(`Sending first question for differed player ${joueurId} (socket ${socket.id}) in tournament ${code}`);
                // Set up per-user timer for differed mode
                state.currentIndex = 0;
                state.questionStart = Date.now();
                const q = state.questions[0];
                const time = q.temps || 20;
                socket.emit("tournament_question", {
                    question: q,
                    index: 0,
                    total: state.questions.length,
                    remainingTime: time,
                    questionState: "active",
                });
                if (state.timer) clearTimeout(state.timer);
                state.timer = setTimeout(async function handleNextQuestion() {
                    const qIdx = state.currentIndex;
                    const question = state.questions[qIdx];
                    // --- SCORING: Evaluate latest answer for this user/question ---
                    const answer = state.answers[joueurId]?.[question.uid];
                    let baseScore = 0, rapidity = 0, totalScore = 0;
                    if (answer) {
                        if (question.type === 'choix_multiple') {
                            const selected = Array.isArray(answer.answerIdx) ? answer.answerIdx : [answer.answerIdx];
                            let good = 0, bad = 0, totalGood = 0;
                            question.reponses.forEach((rep, idx) => {
                                if (rep.correct) totalGood++;
                                if (selected.includes(idx)) {
                                    if (rep.correct) good++;
                                    else bad++;
                                }
                            });
                            let raw = 100 * good - 100 * bad;
                            baseScore = Math.max(0, Math.min(100, totalGood ? raw / totalGood : 0));
                        } else {
                            const correct = question && question.reponses[answer.answerIdx]?.correct;
                            baseScore = correct ? 100 : 0;
                        }
                        if (state.questionStart && answer.clientTimestamp) {
                            const timeUsed = (answer.clientTimestamp - state.questionStart) / 1000;
                            rapidity = Math.max(0, Math.min(5, 5 * (1 - timeUsed / (question.temps || 20))));
                        }
                        totalScore = Math.round(baseScore + rapidity);
                        if (!state.participants[joueurId]) state.participants[joueurId] = { score: 0 };
                        state.participants[joueurId].score += totalScore;
                        logger.debug(`Score computed for joueur ${joueurId} on question ${question.uid} in state ${stateKey}: baseScore=${baseScore}, rapidity=${rapidity}, totalScore=${totalScore}`);
                    }
                    socket.emit("tournament_answer_result", {
                        correct: baseScore > 0,
                        score: state.participants[joueurId]?.score || 0,
                        explanation: question?.explication || null,
                        baseScore,
                        rapidity: Math.round(rapidity * 100) / 100,
                        totalScore,
                    });
                    if (state.questions && qIdx + 1 < state.questions.length) {
                        state.currentIndex = qIdx + 1;
                        state.questionStart = Date.now();
                        const nextQ = state.questions[qIdx + 1];
                        const nextTime = nextQ.temps || 20;
                        logger.info(`Sending next question (idx: ${qIdx + 1}) for differed player ${joueurId} (socket ${socket.id}) in tournament ${code}`);
                        socket.emit("tournament_question", {
                            question: nextQ,
                            index: qIdx + 1,
                            total: state.questions.length,
                            remainingTime: nextTime,
                            questionState: "active",
                        });
                        state.timer = setTimeout(handleNextQuestion, nextTime * 1000);
                    } else {
                        // End of quiz for this user
                        logger.info(`End of differed tournament for joueur ${joueurId} (socket ${socket.id}) in tournament ${code}`);
                        socket.emit("tournament_end", {
                            finalScore: state.participants[joueurId]?.score || 0,
                            leaderboard: Object.values(state.participants)
                                .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                                .sort((a, b) => b.score - a.score),
                        });
                        // Save score and update leaderboard in DB for differed mode
                        (async () => {
                            try {
                                const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                                if (tournoi && joueurId && state.participants[joueurId]) {
                                    const scoreValue = state.participants[joueurId].score;
                                    const joueur = await prisma.joueur.findUnique({ where: { id: joueurId } });
                                    if (joueur) {
                                        const existing = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
                                        if (existing) {
                                            await prisma.score.update({ where: { id: existing.id }, data: { score: scoreValue, date_score: new Date() } });
                                        } else {
                                            await prisma.score.create({ data: { tournoi_id: tournoi.id, joueur_id: joueurId, score: scoreValue, date_score: new Date() } });
                                        }
                                    }
                                    // --- Update leaderboard field in Tournoi ---
                                    const prevLeaderboard = tournoi.leaderboard || [];
                                    const allScores = await prisma.score.findMany({
                                        where: { tournoi_id: tournoi.id },
                                        include: { joueur: true },
                                    });
                                    // Build a map of new scores by joueur_id
                                    const newScoresMap = new Map();
                                    allScores.forEach(s => {
                                        newScoresMap.set(s.joueur_id, {
                                            id: s.joueur_id,
                                            pseudo: s.joueur.pseudo,
                                            avatar: s.joueur.avatar,
                                            score: s.score,
                                            isDiffered: true
                                        });
                                    });
                                    // Merge with previous leaderboard (keep highest score per joueur_id)
                                    const mergedLeaderboardMap = new Map();
                                    for (const entry of prevLeaderboard) {
                                        mergedLeaderboardMap.set(entry.id, entry);
                                    }
                                    for (const [id, entry] of newScoresMap.entries()) {
                                        if (!mergedLeaderboardMap.has(id) || entry.score > mergedLeaderboardMap.get(id).score) {
                                            mergedLeaderboardMap.set(id, entry);
                                        }
                                    }
                                    const mergedLeaderboard = Array.from(mergedLeaderboardMap.values()).sort((a, b) => b.score - a.score);
                                    await prisma.tournoi.update({ where: { id: tournoi.id }, data: { leaderboard: mergedLeaderboard } });
                                }
                            } catch (err) {
                                logger.error('Error saving score for differed mode:', err);
                            }
                            socket.emit("tournament_finished_redirect", { code });
                        })();
                    }
                }, time * 1000);
            } else {
                logger.warn(`Differed player ${joueurId} (socket ${socket.id}) rejoining or no questions. Timer or mapping may be lost.`);
                // Handle rejoining differed? Maybe send current state?
            }
        } else {
            // Live: Late joiner - send current question with adjusted timer
            if (!isDiffered && state.currentIndex >= 0 && state.questions && state.questions.length > 0) {
                const idx = state.currentIndex;
                const q = state.questions[idx];
                if (!q) {
                    logger.error(`Question not found at index ${idx} for tournament ${code}`);
                    socket.emit("tournament_error", { message: "Question actuelle non disponible." });
                    return;
                }

                // *** Use currentQuestionDuration from state if available ***
                const timeAllowed = state.currentQuestionDuration || q.temps || 20;
                let remaining = timeAllowed;
                let questionState = "active";

                // Calculate remaining time if question has started
                if (state.questionStart) {
                    const elapsed = (Date.now() - state.questionStart) / 1000;
                    // *** Calculate remaining based on the potentially updated timeAllowed ***
                    remaining = Math.max(0, timeAllowed - elapsed);
                }

                // Check stopped/paused state (uses state.pausedRemainingTime if paused)
                if (state.stopped) {
                    questionState = "stopped";
                    remaining = 0;
                } else if (state.paused) {
                    questionState = "paused";
                    // *** Use pausedRemainingTime, which should reflect edited time if paused ***
                    remaining = state.pausedRemainingTime !== null ? state.pausedRemainingTime : timeAllowed;
                } else if (remaining <= 0) {
                    questionState = "stopped"; // Use "stopped" for consistency
                    remaining = 0;
                }

                logger.info(`Sending question to joiner ${joueurId} (socket ${socket.id}) for tournament ${code}. Question ${idx} (${q.uid}), state: ${questionState}, remaining: ${remaining.toFixed(1)}s, timeAllowed: ${timeAllowed}s`);
                socket.emit("tournament_question", {
                    question: q,
                    index: idx,
                    total: state.questions.length,
                    remainingTime: remaining,
                    questionState,
                });
            } else {
                logger.info(`Live player ${joueurId} (socket ${socket.id}) joined tournament ${code} but current question index (${state.currentIndex}) is invalid or questions array is empty`);
                socket.emit("tournament_error", { message: "En attente de la première question..." });
            }
        }
    });

    socket.on("tournament_answer", ({ code, questionUid, answerIdx, clientTimestamp }) => {
        logger.info(`tournament_answer received`, { code, questionUid, answerIdx, clientTimestamp, socketId: socket.id });
        // Determine the correct state (live or differed)
        let joueurId = null;
        let stateKey = null;
        let state = null;

        // Check live state first
        if (tournamentState[code] && tournamentState[code].socketToJoueur && tournamentState[code].socketToJoueur[socket.id]) {
            stateKey = code;
            state = tournamentState[stateKey];
            joueurId = state.socketToJoueur[socket.id];
        } else {
            // Check differed states
            for (const key in tournamentState) {
                if (key.startsWith(`${code}_`) && tournamentState[key].socketToJoueur && tournamentState[key].socketToJoueur[socket.id]) {
                    stateKey = key;
                    state = tournamentState[stateKey];
                    joueurId = state.socketToJoueur[socket.id];
                    break;
                }
            }
        }

        if (!state || !joueurId) {
            logger.warn(`tournament_answer: State or joueurId not found for socket ${socket.id} and code ${code}. Ignoring.`);
            return;
        }

        const qIdx = state.currentIndex;
        if (qIdx < 0 || qIdx >= state.questions.length) {
            logger.warn(`tournament_answer: Invalid question index (${qIdx}) for state ${stateKey}. Ignoring.`);
            return;
        }

        const question = state.questions[qIdx];
        // Check if the answer is for the *current* question
        if (question.uid !== questionUid) {
            logger.warn(`tournament_answer: Answer received for wrong question (expected ${question.uid}, got ${questionUid}) for state ${stateKey}. Ignoring.`);
            return;
        }

        // *** Use currentQuestionDuration from state if available ***
        const timeAllowed = state.currentQuestionDuration || question.temps || 20;
        const questionStart = state.questionStart;

        if (!questionStart) {
            logger.warn(`tournament_answer: questionStart missing for state ${stateKey}. Ignoring.`);
            return; // Question hasn't properly started
        }

        // Enhanced logging about quiz/tournament state
        const serverReceiveTime = Date.now();
        const isDiffered = stateKey.includes('_'); // Differed states have format: code_joueurId
        const isPaused = state.paused;
        const isStopped = state.stopped;
        const isQuizMode = !!state.linkedQuizId;
        const elapsed = (serverReceiveTime - questionStart) / 1000;
        const remaining = timeAllowed - elapsed;

        // Log detailed state information to help diagnose timing issues
        logger.info(`tournament_answer: Quiz state details for ${stateKey}:`, {
            isPaused,
            isStopped,
            isQuizMode,
            linkedQuizId: state.linkedQuizId,
            elapsed: elapsed.toFixed(2) + 's',
            timeAllowed: timeAllowed + 's',
            remaining: remaining.toFixed(2) + 's',
            questionStart: new Date(questionStart).toISOString(),
            serverReceiveTime: new Date(serverReceiveTime).toISOString(),
            answerTooLate: elapsed > timeAllowed,
            pausedRemainingTime: state.pausedRemainingTime ? state.pausedRemainingTime.toFixed(2) + 's' : 'none'
        });

        // First check if the question is stopped - reject answers if it is
        if (state.stopped) {
            logger.warn(`tournament_answer: Answer rejected because question is stopped for state ${stateKey}`);
            socket.emit("tournament_answer_result", {
                rejected: true,
                reason: "stopped",
                message: "Trop tard !"
            });
            return;
        }

        // Always accept answers when the question is paused, regardless of time elapsed
        if (!state.paused) {
            // Only check timing if the question is NOT paused
            // Check timing using server receive time with grace period
            // *** Use the potentially updated timeAllowed ***
            if ((serverReceiveTime - questionStart) > timeAllowed * 1000 + 500) { // Add 500ms grace period
                logger.warn(`tournament_answer: Answer too late (server time, ${timeAllowed}s allowed) for state ${stateKey}. Ignoring.`);
                // Send rejection response back to client
                socket.emit("tournament_answer_result", {
                    correct: false,
                    rejected: true,
                    reason: "late",
                    message: "Réponse trop tardive"
                });
                return;
            }

            // Also check client timestamp relative to question start
            // *** Use the potentially updated timeAllowed ***
            if ((clientTimestamp - questionStart) > timeAllowed * 1000) {
                logger.warn(`tournament_answer: Answer too late (client time, ${timeAllowed}s allowed) for state ${stateKey}. Ignoring.`);
                // Send rejection response back to client
                socket.emit("tournament_answer_result", {
                    correct: false,
                    rejected: true,
                    reason: "late",
                    message: "Réponse trop tardive"
                });
                return;
            }
        } else {
            logger.info(`tournament_answer: Accepting answer during pause for state ${stateKey}.`);
        }

        // Store the answer (overwrite previous answer for the same question if any)
        if (!state.answers[joueurId]) state.answers[joueurId] = {};
        state.answers[joueurId][questionUid] = { answerIdx, clientTimestamp };
        logger.debug(`Stored answer for joueur ${joueurId} on question ${questionUid} in state ${stateKey}`);

        // In quiz mode, send immediate feedback to the client,
        // but ONLY that the answer was received, never revealing correctness
        if (state.linkedQuizId) {
            // Emit result back to the client without revealing correctness
            socket.emit("tournament_answer_result", {
                message: "Réponse envoyée",
                received: true
                // NEVER include correct/incorrect information to prevent cheating
            });

            logger.debug(`Sent receipt confirmation in quiz mode to joueur ${joueurId} for answer on question ${questionUid}`);
        }
        // Note: For regular tournaments, scoring happens when the timer ends to prevent cheating.
    });

    // Handle pause/resume signals (potentially from quiz handler)
    socket.on("tournament_pause", ({ code }) => {
        const state = tournamentState[code]; // Only applicable to live tournaments
        if (state && !state.isDiffered && !state.paused) {
            // Calculate remaining time based on elapsed time since question start
            const elapsed = (Date.now() - state.questionStart) / 1000;
            const timeAllowed = state.questions[state.currentIndex]?.temps || 20;
            state.pausedRemainingTime = Math.max(0, timeAllowed - elapsed);

            // Set paused flag to true
            state.paused = true;

            // Clear the existing timer to prevent it from continuing to run in the background
            if (state.timer) {
                clearTimeout(state.timer);
                state.timer = null;
            }

            logger.info(`Paused tournament ${code}. Remaining time: ${state.pausedRemainingTime.toFixed(1)}s`);
            io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "paused", remainingTime: state.pausedRemainingTime });
        }
    });

    socket.on("tournament_resume", ({ code }) => {
        const state = tournamentState[code]; // Only applicable to live tournaments
        if (state && !state.isDiffered && state.paused) {
            state.paused = false;
            state.questionStart = Date.now() - ((state.questions[state.currentIndex]?.temps || 20) - state.pausedRemainingTime) * 1000; // Adjust start time
            const remaining = state.pausedRemainingTime;
            state.pausedRemainingTime = null;

            logger.info(`Resuming tournament ${code}. Remaining time: ${remaining.toFixed(1)}s`);
            io.to(`tournament_${code}`).emit("tournament_question_state_update", { questionState: "active", remainingTime: remaining });

            // Restart timer
            if (state.timer) clearTimeout(state.timer);
            state.timer = setTimeout(async () => { /* ... same logic as in sendQuestionWithState timer ... */ }, remaining * 1000);
            // TODO: Refactor timer logic to avoid duplication
        }
    });

    // Handle disconnect
    socket.on("disconnecting", () => {
        logger.info(`disconnecting: socket.id=${socket.id}`);
        // Find which tournament states this socket was part of
        for (const stateKey in tournamentState) {
            const state = tournamentState[stateKey];
            if (state.socketToJoueur && state.socketToJoueur[socket.id]) {
                const joueurId = state.socketToJoueur[socket.id];
                logger.info(`Socket ${socket.id} (joueurId: ${joueurId}) disconnecting from tournament state ${stateKey}`);
                // Remove the socket mapping. Participant data remains for scoring.
                delete state.socketToJoueur[socket.id];

                // If it's a differed state with no other sockets mapped to it, clean it up?
                if (state.isDiffered && Object.keys(state.socketToJoueur).length === 0) {
                    logger.info(`Cleaning up differed state ${stateKey} as last socket disconnected.`);
                    if (state.timer) clearTimeout(state.timer);
                    // Maybe save progress?
                    // delete tournamentState[stateKey]; // Or keep for potential rejoin?
                }
                // No need to emit participant_left for the tournament room itself usually.
            }
        }
    });
}

module.exports = {
    registerTournamentHandlers,
    tournamentState,
    triggerTournamentQuestion, // Ensure this is exported correctly
    triggerTournamentPause,
    triggerTournamentResume,
    triggerTournamentTimerSet,
};
