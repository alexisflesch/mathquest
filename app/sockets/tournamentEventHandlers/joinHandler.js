const prisma = require('../../db');
const createLogger = require('../../logger');
const logger = createLogger('JoinTournamentHandler');
const { tournamentState } = require('../tournamentUtils/tournamentState');
const { calculateScore } = require('../tournamentUtils/tournamentHelpers'); // Import calculateScore
const { emitQuizConnectedCount } = require('../quizUtils');
const { sendTournamentQuestion } = require('../tournamentUtils/sendTournamentQuestion');

async function handleJoinTournament(io, socket, { code, cookie_id, pseudo: clientPseudo, avatar: clientAvatar, isDiffered }) {
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
            logger.info(`[JOIN_HANDLER] Looked up joueur by cookie_id=${cookie_id}: ${joueur ? 'FOUND' : 'NOT FOUND'}`);
            if (!joueur) {
                joueur = await prisma.joueur.create({ data: { pseudo, avatar, cookie_id } });
                logger.info(`[JOIN_HANDLER] Created new joueur: id=${joueur.id}, pseudo=${pseudo}, avatar=${avatar}`);
            } else {
                pseudo = joueur.pseudo;
                avatar = joueur.avatar || avatar;
                logger.info(`[JOIN_HANDLER] Using existing joueur: id=${joueur.id}, pseudo=${pseudo}, avatar=${avatar}`);
            }
            joueurId = joueur.id;
        } catch (err) {
            logger.error(`[JOIN_HANDLER] Error finding/creating joueur with cookie_id ${cookie_id}:`, err);
        }
    }

    // 2. If no persistent joueurId, generate a temporary one for this session
    if (!joueurId) {
        logger.warn(`[JOIN_HANDLER] No persistent joueurId found, using temporary socket-based joueurId for socket ${socket.id}`);
        joueurId = `socket_${socket.id}`;
        logger.info(`No cookie_id or DB error, using temporary joueurId: ${joueurId}`);
    }

    logger.info(`[JOIN_HANDLER] Final joueurId for this session: ${joueurId}`);

    // 3. Determine live/differed status
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

    // --- Room logic for differed mode ---
    let differedRoom = null;
    if (isDiffered && joueurId && !joueurId.startsWith('socket_')) {
        differedRoom = `tournament_${code}_${joueurId}`;
        socket.join(differedRoom);
        logger.info(`Joined differed room: ${differedRoom}`);
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

    // Ensure state has required properties if it exists
    if (state) {
        if (!state.participants) {
            logger.info(`State exists for ${stateKey}, but participants is undefined. Initializing empty participants object.`);
            state.participants = {};
        }
        if (!state.answers) {
            logger.info(`State exists for ${stateKey}, but answers is undefined. Initializing empty answers object.`);
            state.answers = {};
        }
        if (!state.socketToJoueur) {
            logger.info(`State exists for ${stateKey}, but socketToJoueur is undefined. Initializing empty socketToJoueur mapping.`);
            state.socketToJoueur = {};
        }
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

            // --- PATCH: Look up quiz by tournament_code ---
            let linkedQuizId = null;
            try {
                const quiz = await prisma.quiz.findFirst({ where: { tournament_code: code } });
                linkedQuizId = quiz ? quiz.id : null;
                logger.info(`[QUIZMODE DEBUG] For tournament code ${code}, found linkedQuizId: ${linkedQuizId}`);
            } catch (err) {
                logger.error(`[QUIZMODE DEBUG] Error looking up quiz for tournament code ${code}:`, err);
            }

            // --- CRITICAL FIX: Fetch existing timer value from quiz state ---
            let initialTimeLeft = null;
            let initialQuestionIdx = 0;
            let initialQuestionStart = Date.now();
            let initialQuestionUid = null; // Track the questionUid directly

            if (linkedQuizId) {
                // Look up current question and time from the quiz state
                const quizState = require('../quizState');
                if (quizState[linkedQuizId]) {
                    logger.info(`Found quiz state for linkedQuizId=${linkedQuizId}`);

                    // Get question index and timer value
                    const currentQuestionIdx = quizState[linkedQuizId].currentQuestionIdx;
                    if (typeof currentQuestionIdx === 'number' && currentQuestionIdx >= 0) {
                        // CRITICAL FIX: Get the current question UID from quizState
                        initialQuestionUid = quizState[linkedQuizId].timerQuestionId ||
                            (quizState[linkedQuizId].questions[currentQuestionIdx]?.uid);

                        logger.info(`Current question UID from quiz state: ${initialQuestionUid}`);

                        // Find the matching question index in our questions array using the UID
                        if (initialQuestionUid) {
                            const matchingQuestionIdx = questions.findIndex(q => q.uid === initialQuestionUid);
                            if (matchingQuestionIdx >= 0) {
                                initialQuestionIdx = matchingQuestionIdx;
                                logger.info(`Found matching question at index ${initialQuestionIdx} (uid: ${initialQuestionUid})`);
                            } else {
                                logger.warn(`Question with UID ${initialQuestionUid} not found in tournament questions`);
                            }
                        } else {
                            logger.warn(`No current question UID found in quiz state, using default index ${currentQuestionIdx}`);
                            initialQuestionIdx = currentQuestionIdx;
                        }

                        // Get timer value from quizState
                        if (quizState[linkedQuizId].chrono && typeof quizState[linkedQuizId].chrono.timeLeft === 'number') {
                            initialTimeLeft = quizState[linkedQuizId].chrono.timeLeft;
                            logger.info(`Using timeLeft=${initialTimeLeft}s from quiz state for tournament ${code}`);
                        }

                        // Calculate the questionStart time based on the timer value
                        if (typeof initialTimeLeft === 'number' && quizState[linkedQuizId].timerTimestamp) {
                            // Use timerTimestamp to reconstruct when the question actually started
                            const timeAllowed = questions[initialQuestionIdx]?.temps || 20;
                            const elapsed = timeAllowed - initialTimeLeft;

                            // Calculate the actual question start time by going back 'elapsed' seconds from timerTimestamp
                            initialQuestionStart = quizState[linkedQuizId].timerTimestamp - (elapsed * 1000);
                            logger.info(`Reconstructed questionStart time: ${new Date(initialQuestionStart).toISOString()}, elapsed=${elapsed}s, timeAllowed=${timeAllowed}s`);
                        }
                    }
                } else {
                    logger.warn(`No quiz state found for linkedQuizId=${linkedQuizId}`);
                }
            }

            // Create new state for this tournament
            state = tournamentState[code] = {
                participants: {},
                questions,
                currentIndex: initialQuestionIdx, // Use the index from quiz state if available
                started: true,
                answers: {},
                timer: null,
                questionStart: initialQuestionStart, // Use calculated start time
                socketToJoueur: {},
                paused: false, // Assume not paused initially
                pausedRemainingTime: null,
                linkedQuizId: linkedQuizId,
                currentQuestionDuration: questions[initialQuestionIdx]?.temps || 20,
                stopped: false,
            };
            logger.info(`Created new state for tournament ${code} with ${questions.length} questions, questionStart=${new Date(initialQuestionStart).toISOString()}`);
        } catch (err) {
            logger.error(`Error initializing tournament state for code ${code}:`, err);
            socket.emit("tournament_error", { message: "Erreur d'initialisation du tournoi." });
            return;
        }
    }

    if (!state) {
        if (isDiffered && tournoi) {
            // Defensive: check for leftover state with no score in DB
            let existingScore = null;
            if (joueurId && !joueurId.startsWith('socket_')) {
                existingScore = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
            }
            if (state && !existingScore) {
                logger.warn(`Found leftover differed state for ${stateKey} with no score in DB. Deleting and starting fresh.`);
                if (tournamentState[stateKey]?.timer) clearTimeout(tournamentState[stateKey].timer);
                delete tournamentState[stateKey];
                state = undefined;
            }
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

    // DEBUG: Add detailed logging to diagnose the issue with participants
    logger.info(`[CRITICAL DEBUG] Before accessing state.participants[joueurId]:`, {
        stateKey,
        joueurId,
        // Remove reference to undefined question.uid
        hasStateParticipants: !!state.participants,
        participantKeys: state.participants ? Object.keys(state.participants) : [],
        hasJoueurIdInParticipants: state.participants && state.participants[joueurId] ? true : false
    });

    if (!state.participants) {
        logger.error(`[CRITICAL ERROR] state.participants is undefined or null for stateKey=${stateKey}`);
        state.participants = {}; // Ensure it's initialized to prevent crash
    }

    if (!state.participants[joueurId]) {
        logger.error(`[CRITICAL ERROR] Participant ${joueurId} not found in state.participants for tournament code=${code}, stateKey=${stateKey}`);
        // Create the participant entry to prevent crash
        state.participants[joueurId] = {
            score: 0,
            id: joueurId,
            pseudo,
            avatar,
            isDiffered: true,
            createdByFallback: true // Flag to track these fallback creations
        };
        logger.info(`Created fallback participant entry for joueurId=${joueurId}`);
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

    // CRITICAL FIX: Double-check that socketToJoueur is initialized
    if (!state.socketToJoueur) {
        logger.warn(`socketToJoueur is undefined for state ${stateKey} even after initialization checks. Creating it now.`);
        state.socketToJoueur = {};
    }

    // Map current socket ID to joueurId for this state
    state.socketToJoueur[socket.id] = joueurId;
    logger.info(`[JOIN_HANDLER] socketToJoueur mapping:`, { socketId: socket.id, joueurId, stateKey });
    logger.debug(`Mapped socket ${socket.id} to joueur ${joueurId} in state ${stateKey}`);

    // 7. Send current/first question
    if (isDiffered) {
        const { scheduleNextQuestionWithTimer } = require('../tournamentUtils/tournamentHelpers');
        if (state.questions && state.questions.length > 0 && state.currentIndex === -1) {
            logger.info(`Sending first question for differed player ${joueurId} (socket ${socket.id}) in tournament ${code}`);
            scheduleNextQuestionWithTimer(io, stateKey, 0, differedRoom);
        } else {
            logger.warn(`Differed player ${joueurId} (socket ${socket.id}) rejoining or no questions. State: currentIndex=${state?.currentIndex}, questions=${state?.questions?.length}`);
            if (state?.currentIndex > -1) {
                let existingScore = null;
                if (joueurId && !joueurId.startsWith('socket_')) {
                    existingScore = await prisma.score.findFirst({ where: { tournoi_id: tournoi.id, joueur_id: joueurId } });
                }
                if (existingScore) {
                    socket.emit("tournament_error", { message: "Reconnexion en cours... (différé)" });
                } else {
                    logger.warn(`State has currentIndex > -1 but no score in DB. Forcibly resetting for joueurId=${joueurId}`);
                    if (tournamentState[stateKey]?.timer) clearTimeout(tournamentState[stateKey].timer);
                    delete tournamentState[stateKey];
                    return handleJoinTournament(io, socket, { code, cookie_id, pseudo: clientPseudo, avatar: clientAvatar, isDiffered });
                }
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

            // Defensive: check state.answers and state.answers[joueurId] before accessing
            let answer = undefined;
            if (state.answers && state.answers[joueurId] && q && q.uid) {
                answer = state.answers[joueurId][q.uid];
            } else {
                logger.warn(`[DEFENSIVE] state.answers or state.answers[${joueurId}] is undefined in handleJoinTournament (live join) for question ${q ? q.uid : 'unknown'}`);
            }
            // Optionally, you can calculate score or just log for now
            // const { baseScore, rapidity, totalScore } = calculateScore(q, answer, state.questionStart);

            // Get the correct remaining time based on the current state
            let remaining = 0;
            let questionState = "active";

            // Determine state and remaining time
            if (state.stopped) {
                questionState = "stopped";
                remaining = 0;
            } else if (state.paused) {
                questionState = "paused";
                // For paused questions, use the exact pausedRemainingTime
                remaining = state.pausedRemainingTime ?? 0;
                logger.debug(`Question is paused. Using pausedRemainingTime=${remaining}s`);
            } else {
                // For active (running) questions, calculate based on elapsed time
                const timeAllowed = q.temps || 20; // Use the question's original time

                // Make sure we're using the actual question start time, not the current time
                let elapsed = 0;
                if (state.questionStart) {
                    elapsed = (Date.now() - state.questionStart) / 1000;
                    logger.debug(`Using actual question start time for timer. questionStart=${new Date(state.questionStart).toISOString()}, now=${new Date().toISOString()}`);
                } else {
                    logger.warn(`No questionStart found in state for tournament ${code}. Using 0 for elapsed time.`);
                }

                remaining = Math.max(0, timeAllowed - elapsed);

                if (remaining <= 0) {
                    questionState = "stopped";
                    remaining = 0;
                }

                logger.debug(`Active timer: elapsed=${elapsed.toFixed(1)}s, remaining=${remaining.toFixed(1)}s, timeAllowed=${timeAllowed}s`);
            }

            logger.info(`Sending question to joiner ${joueurId} (socket ${socket.id}) for tournament ${code}. Question ${idx} (${q.uid}), state: ${questionState}, remaining: ${remaining.toFixed(1)}s`);
            // Filter reponses for students (remove 'correct')
            const filteredReponses3 = Array.isArray(q.reponses)
                ? q.reponses.map(r => ({ texte: r.texte }))
                : [];
            const filteredLiveQuestion = { ...q, reponses: filteredReponses3 };
            sendTournamentQuestion(socket, null, q, idx, state.questions.length, remaining, questionState, !!state.linkedQuizId);
        } else {
            logger.info(`Live player ${joueurId} (socket ${socket.id}) joined tournament ${code} but current question index (${state?.currentIndex}) is invalid or questions array is empty`);
            // If tournament hasn't started (currentIndex is -1), they just wait.
            if (state?.currentIndex === -1) {
                socket.emit("tournament_wait_start"); // Inform client to wait
            } else {
                // If state is missing or index is invalid after start, emit error
                socket.emit("tournament_error", { message: "En attente de la prochaine question... (live)" });
            }
        }
    }

    // Appeler emitQuizConnectedCount après qu'un étudiant rejoint le live
    await emitQuizConnectedCount(io, prisma, code);

    // --- Emit real-time participant update to tournament room ---
    // Only emit for live tournaments (not differed)
    if (!isDiffered && state && state.participants) {
        const participantsList = Object.values(state.participants).map(p => ({
            id: p.id,
            pseudo: p.pseudo,
            avatar: p.avatar,
        }));
        io.to(`tournament_${code}`).emit("tournament_participants_update", {
            participants: participantsList,
            playerCount: participantsList.length
        });
    }
}

module.exports = handleJoinTournament;
