const prisma = require('../../db');
const createLogger = require('../../logger');
const logger = createLogger('JoinTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');
const { calculateScore } = require('../tournamentUtils/tournamentHelpers'); // Import calculateScore

async function handleJoinTournament(io, socket, { code, cookie_id, pseudo: clientPseudo, avatar: clientAvatar }) {
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
        // --- LOBBY FALLBACK LOGIC ---\
        // Try to get pseudo/avatar from lobbyParticipants if available
        try {
            // Avoid circular dependency - access lobby state carefully if needed, or remove this fallback
            // const { lobbyParticipants } = require('../lobbyHandler'); // Potential circular dependency
            // const lobby = lobbyParticipants[code] || [];
            // const found = lobby.find(p => p.id === socket.id);
            // if (found) {
            //     pseudo = found.pseudo || pseudo;
            //     avatar = found.avatar || avatar;
            // }
            logger.warn(`Lobby fallback for pseudo/avatar is disabled due to potential circular dependency.`);
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
    if (!state && tournoi.statut === 'en cours' && !isDiffered) { // Only initialize for live if missing
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
                currentIndex: 0, // Start with first question (or should it be -1 and wait for trigger?) - Let's assume 0 for late joiners
                started: true,
                answers: {},
                timer: null,
                questionStart: Date.now(), // Assume question started when state was created? Risky.
                socketToJoueur: {},
                paused: false, // Assume not paused initially
                pausedRemainingTime: null,
                linkedQuizId: tournoi.linkedQuizId || null,
                currentQuestionDuration: questions[0]?.temps || 20, // Initialize with first question time
                stopped: false, // Initialize stopped state
            };
            logger.info(`Created new state for tournament ${code} with ${questions.length} questions`);
            // Note: This late joiner might miss the very beginning if the state was lost.
            // Consider sending the current question immediately if state.currentIndex >= 0
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
            if (!questions || questions.length === 0) {
                logger.error(`No questions found for differed tournament ${code}`);
                socket.emit("tournament_error", { message: "Aucune question trouvée pour ce tournoi." });
                return;
            }
            state = tournamentState[stateKey] = {
                participants: {}, questions, currentIndex: -1, started: true, answers: {},
                timer: null, questionStart: null, socketToJoueur: {}, isDiffered: true, // Mark state as differed
                paused: false, pausedRemainingTime: null, linkedQuizId: null, currentQuestionDuration: null, stopped: false,
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
                logger.error(`join_tournament: Live tournament ${code} has status ${tournoi.statut} but state not found and couldn't be initialized.`);
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
            state.currentQuestionDuration = time; // Set duration for the question
            socket.emit("tournament_question", {
                question: q,
                index: 0,
                total: state.questions.length,
                remainingTime: time,
                questionState: "active",
            });
            if (state.timer) clearTimeout(state.timer);
            state.timer = setTimeout(async function handleNextQuestion() { // Make async
                const qIdx = state.currentIndex;
                const question = state.questions[qIdx];
                // --- SCORING: Evaluate latest answer for this user/question ---\
                const answer = state.answers[joueurId]?.[question.uid];
                const { baseScore, rapidity, totalScore } = calculateScore(question, answer, state.questionStart); // Use imported helper

                if (!state.participants[joueurId]) state.participants[joueurId] = { score: 0, id: joueurId, pseudo, avatar, isDiffered: true }; // Ensure participant exists
                state.participants[joueurId].score += totalScore;
                logger.debug(`Score computed for joueur ${joueurId} on question ${question.uid} in state ${stateKey}: baseScore=${baseScore}, rapidity=${rapidity}, totalScore=${totalScore}`);

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
                    state.currentQuestionDuration = nextTime; // Update duration
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
                    const finalLeaderboard = Object.values(state.participants)
                        .map(p => ({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isDiffered: !!p.isDiffered }))
                        .sort((a, b) => b.score - a.score);

                    socket.emit("tournament_end", {
                        finalScore: state.participants[joueurId]?.score || 0,
                        leaderboard: finalLeaderboard,
                    });
                    // Save score and update leaderboard in DB for differed mode
                    (async () => {
                        try {
                            const tournoi = await prisma.tournoi.findUnique({ where: { code } });
                            if (tournoi && joueurId && !joueurId.startsWith('socket_') && state.participants[joueurId]) {
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
                                // --- Update leaderboard field in Tournoi ---\
                                const prevLeaderboard = Array.isArray(tournoi.leaderboard) ? tournoi.leaderboard : [];
                                const allScores = await prisma.score.findMany({
                                    where: { tournoi_id: tournoi.id },
                                    include: { joueur: true },
                                });
                                // Build a map of new scores by joueur_id
                                const newScoresMap = new Map();
                                allScores.forEach(s => {
                                    if (s.joueur) { // Ensure joueur exists
                                        newScoresMap.set(s.joueur_id, {
                                            id: s.joueur_id,
                                            pseudo: s.joueur.pseudo,
                                            avatar: s.joueur.avatar,
                                            score: s.score,
                                            isDiffered: true // Assume anyone in scores might be differed, or fetch live status? Let's mark true for simplicity here.
                                        });
                                    }
                                });
                                // Merge with previous leaderboard (keep highest score per joueur_id)
                                const mergedLeaderboardMap = new Map();
                                for (const entry of prevLeaderboard) {
                                    if (entry && entry.id) { // Check if entry and id exist
                                        mergedLeaderboardMap.set(entry.id, entry);
                                    }
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
                        } finally {
                            // Clean up differed state after saving
                            if (tournamentState[stateKey]) {
                                if (tournamentState[stateKey].timer) clearTimeout(tournamentState[stateKey].timer);
                                delete tournamentState[stateKey];
                                logger.info(`Cleaned up differed state ${stateKey}`);
                            }
                            socket.emit("tournament_finished_redirect", { code });
                        }
                    })();
                }
            }, time * 1000);
        } else {
            logger.warn(`Differed player ${joueurId} (socket ${socket.id}) rejoining or no questions. State: currentIndex=${state?.currentIndex}, questions=${state?.questions?.length}`);
            // Handle rejoining differed? Maybe send current state?
            // If they rejoin mid-question, we might need similar logic to live late joiners.
            // For now, if currentIndex > -1, they might have missed the start.
            if (state?.currentIndex > -1) {
                socket.emit("tournament_error", { message: "Reconnexion en cours..." }); // Or a more specific message
            }
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
            logger.info(`Live player ${joueurId} (socket ${socket.id}) joined tournament ${code} but current question index (${state?.currentIndex}) is invalid or questions array is empty`);
            // If tournament hasn't started (currentIndex is -1), they just wait.
            if (state?.currentIndex === -1) {
                socket.emit("tournament_wait_start"); // Inform client to wait
            } else {
                // If state is missing or index is invalid after start, emit error
                socket.emit("tournament_error", { message: "En attente de la prochaine question..." });
            }
        }
    }
}

module.exports = handleJoinTournament;
