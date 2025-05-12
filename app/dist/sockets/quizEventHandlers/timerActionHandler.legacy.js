const createLogger = require('../../logger');
const logger = createLogger('TimerActionHandler');
const { quizState, getQuestionTimer } = require('../quizState');
const { tournamentState, triggerTournamentPause, triggerTournamentTimerSet, triggerTournamentQuestion } = require('../tournamentHandler');
const prisma = require('../../db');
const { patchQuizStateForBroadcast, updateChrono, emitQuizTimerUpdate, synchronizeTimerValues, updateQuestionTimer, calculateQuestionRemainingTime } = require('../quizUtils.legacy.js');
const { manageTimer } = require('../tournamentUtils/tournamentTriggers');
const { triggerQuizTimerAction } = require('../quizTriggers');
async function handleTimerAction(io, socket, prisma, { status, questionId, timeLeft, quizId, teacherId, tournamentCode }) {
    logger.info(`[TimerAction] Received: status=${status}, question=${questionId}, timeLeft=${timeLeft}, quizId=${quizId}, teacherId=${teacherId}, tournamentCode=${tournamentCode}`);
    // Initialize quizState if it doesn't exist
    if (!quizState[quizId]) {
        logger.info(`[TimerAction] Creating new quizState for quizId=${quizId}`);
        quizState[quizId] = {
            questions: [],
            chrono: { timeLeft: null, running: false },
            locked: false,
            ended: false,
            stats: {},
            profSocketId: socket.id,
            profTeacherId: teacherId,
            questionTimers: {},
            connectedSockets: new Set(),
        };
        try {
            // Load quiz data
            const quiz = await prisma.quiz.findUnique({
                where: { id: quizId },
                select: { enseignant_id: true, questions_ids: true, tournament_code: true }
            });
            if (quiz) {
                // Update the teacher ID and load questions
                quizState[quizId].profTeacherId = quiz.enseignant_id;
                if (quiz.tournament_code) {
                    quizState[quizId].tournament_code = quiz.tournament_code;
                }
                if (quiz.questions_ids && quiz.questions_ids.length > 0) {
                    // Fetch questions from database
                    const questionsData = await prisma.question.findMany({
                        where: { uid: { in: quiz.questions_ids } }
                    });
                    // Maintain the order from questions_ids
                    const questionMap = new Map(questionsData.map(q => [q.uid, q]));
                    const orderedQuestions = [];
                    quiz.questions_ids.forEach(uid => {
                        if (questionMap.has(uid)) {
                            orderedQuestions.push(questionMap.get(uid));
                        }
                    });
                    quizState[quizId].questions = orderedQuestions;
                    // Initialize questionTimers for all questions
                    quizState[quizId].questionTimers = {};
                    orderedQuestions.forEach(q => {
                        quizState[quizId].questionTimers[q.uid] = {
                            status: 'stop',
                            timeLeft: q.temps || 20,
                            initialTime: q.temps || 20,
                            timestamp: null
                        };
                    });
                    // Set currentQuestionUid and currentQuestionIdx to the question being played
                    const idx = orderedQuestions.findIndex(q => q.uid === questionId);
                    if (idx !== -1) {
                        quizState[quizId].currentQuestionUid = questionId;
                        quizState[quizId].currentQuestionIdx = idx;
                        logger.info(`[TimerAction] [INIT] Set currentQuestionUid to ${questionId} (idx: ${idx}) for quizId=${quizId}`);
                    }
                    logger.info(`[TimerAction] Loaded questions for quizId=${quizId}: [${orderedQuestions.map(q => q.uid).join(', ')}]`);
                }
            }
        }
        catch (err) {
            logger.error(`[TimerAction] Error loading quiz data for ${quizId}:`, err);
        }
    }
    // Ensure the question exists in quizState before proceeding
    const questionExists = quizState[quizId].questions && quizState[quizId].questions.find(q => q.uid === questionId);
    if (!questionExists) {
        logger.warn(`[TimerAction] Question UID ${questionId} not found in quiz ${quizId}`);
        io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : question non trouvée.'
        });
        return;
    }
    // Authorization check
    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        // Fallback: check DB if teacherId matches quiz owner
        const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { enseignant_id: true } });
        if (!quiz || quiz.enseignant_id !== teacherId) {
            logger.warn(`[TimerAction] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'error',
                message: 'Erreur : accès non autorisé.'
            });
            return;
        }
        // Update in-memory state for future requests
        quizState[quizId].profTeacherId = teacherId;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;
    // Get the question's timer state
    const questionTimer = getQuestionTimer(quizId, questionId);
    if (!questionTimer) {
        logger.error(`[TimerAction] Could not get timer for question ${questionId} in quiz ${quizId}`);
        io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
            status: 'error',
            message: 'Timer introuvable pour cette question.'
        });
        return;
    }
    // Reset questionHasChanged check since we're working with per-question timers
    // (No need to check if the question changed since each question has its own timer)
    // --- Handle specific status actions ---
    let finalTimeLeft = timeLeft;
    // PLAY action
    if (status === 'play') {
        if (questionTimer.status === 'play') {
            logger.warn(`[TimerAction] Ignoring play: timer already running for quizId=${quizId}, questionId=${questionId}`);
            return;
        }
        if (questionTimer.status === 'pause') {
            if (typeof questionTimer.timeLeft !== 'number' || questionTimer.timeLeft <= 0) {
                logger.error(`[TimerAction] Cannot resume: paused timer has invalid timeLeft for quizId=${quizId}, questionId=${questionId}`);
                return;
            }
            finalTimeLeft = questionTimer.timeLeft;
            logger.info(`[TimerAction] Using question's paused timeLeft=${finalTimeLeft} for question ${questionId}`);
        }
        else if (questionTimer.status === 'stop') {
            // Always reset to initialTime if stopped
            finalTimeLeft = questionTimer.initialTime;
            logger.info(`[TimerAction] Timer was stopped. Resetting to initialTime=${finalTimeLeft} for question ${questionId}`);
        }
        else {
            // Defensive: fallback to initialTime
            finalTimeLeft = questionTimer.initialTime;
            logger.warn(`[TimerAction] Unexpected timer status (${questionTimer.status}) for play. Resetting to initialTime=${finalTimeLeft} for question ${questionId}`);
        }
        // Always set timer to play and update timestamp
        updateQuestionTimer(quizId, questionId, 'play', finalTimeLeft);
        logger.info(`[TimerAction] Set timer to 'play' for quizId=${quizId}, questionId=${questionId}, timeLeft=${finalTimeLeft}`);
        // Emit success response for play to quiz room only
        io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
            status: 'success',
            message: 'Timer started.'
        });
    }
    // PAUSE action
    else if (status === 'pause') {
        if (questionTimer.status !== 'play' || !questionTimer.timestamp) {
            logger.warn(`[TimerAction] Cannot pause: timer not running for quizId=${quizId}, questionId=${questionId}, status=${questionTimer.status}`);
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'error',
                message: 'Impossible de mettre en pause : le chrono n\'est pas en cours.'
            });
            return;
        }
        finalTimeLeft = calculateQuestionRemainingTime(quizId, questionId);
        logger.info(`[TimerAction] Calculated remaining time=${finalTimeLeft} when pausing question ${questionId}`);
        // Emit success response for pause to quiz room only
        io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
            status: 'success',
            message: 'Timer paused.'
        });
    }
    // STOP action
    else if (status === 'stop') {
        finalTimeLeft = questionTimer.initialTime;
        logger.info(`[TimerAction] Reset time to ${finalTimeLeft} when stopping question ${questionId}`);
        // Emit success response for stop to quiz room only
        io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
            status: 'success',
            message: 'Timer stopped.'
        });
    }
    // Skip reporting duplicate actions to UI, but always trigger the timer action
    if (questionTimer.status === status) {
        logger.info(`[TimerAction] Skipping duplicate play action for question ${questionId}`);
        // Don't return here - we still need to trigger the timer action
    }
    // Update the question timer state
    triggerQuizTimerAction(io, quizId, questionId, status, finalTimeLeft);
    quizState[quizId].timerQuestionId = questionId; // Identifies which question's timer is being referred to
    // Always set currentQuestionUid for dashboard/projection sync
    quizState[quizId].currentQuestionUid = questionId;
    logger.debug(`[TimerAction] Set quizState[${quizId}].currentQuestionUid = ${questionId} (mode: ${quizState[quizId].tournament_code ? 'tournament' : 'quiz'})`);
    quizState[quizId] = updateChrono(quizState[quizId], finalTimeLeft, status); // Updates general chrono if used
    quizState[quizId].id = quizId; // Ensure quizId is part of the state object
    logger.debug(`[TimerAction] Set quizState[${quizId}].currentQuestionUid = ${questionId}`); // Log for verification
    logger.debug(`[TimerAction] Emitting quiz_timer_update with status=${status}, questionId=${questionId}, timeLeft=${finalTimeLeft}`);
    // Emit the timer update
    emitQuizTimerUpdate(io, quizId, status, questionId, finalTimeLeft);
    // Send updated quiz state to all clients
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    io.to(`projection_${quizId}`).emit("quiz_state", quizState[quizId]);
    logger.debug(`[TimerAction] Emitted quiz_timer_update & quiz_state to dashboard_${quizId} and projection_${quizId}`);
    // --- Update Tournament State using Triggers --- 
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { tournament_code: true, questions_ids: true }
        });
        // Use tournamentCode from payload if present, else fallback
        const code = tournamentCode || (quiz && quiz.tournament_code) || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        // Always update currentQuestionUid to the question being acted on
        if (code && tournamentState[code]) {
            const prevUid = tournamentState[code].currentQuestionUid;
            tournamentState[code].currentQuestionUid = questionId;
            if (prevUid !== questionId) {
                tournamentState[code].paused = false;
                tournamentState[code].pausedRemainingTime = null;
                // --- Reset timer for previous question ONLY IF it's not paused ---
                if (prevUid && quizState[quizId] && quizState[quizId].questionTimers && quizState[quizId].questionTimers[prevUid]) {
                    const prevTimer = quizState[quizId].questionTimers[prevUid];
                    // CRITICAL FIX: Only reset timer if status is not 'pause'
                    if (prevTimer.status !== 'pause') {
                        logger.info(`[TimerAction] Stopping timer for previous question ${prevUid} by calling triggerQuizTimerAction`);
                        // Call triggerQuizTimerAction to properly stop the timer and clear its countdown
                        triggerQuizTimerAction(io, quizId, prevUid, 'stop', prevTimer.initialTime);
                    }
                    else {
                        // If timer is paused, preserve its state
                        logger.info(`[TimerAction] Preserving paused timer for question ${prevUid} (${prevTimer.timeLeft}s)`);
                    }
                }
            }
        }
        // Synchronize timer values for consistency if we have a tournament
        if (code && tournamentState[code]) {
            synchronizeTimerValues(quizId, code, finalTimeLeft);
        }
        if (code) {
            // Initialize tournament state if needed (same as before)
            if (!tournamentState[code]) {
                // ... existing tournament state initialization code ...
                // No changes needed here
                logger.warn(`[TimerAction] Tournament state for code ${code} not found in memory. Initializing it.`);
                // Initialize basic tournament state with empty questions array
                tournamentState[code] = {
                    participants: {},
                    questions: [],
                    currentQuestionUid: quizState[quizId].currentQuestionUid || null,
                    answers: {},
                    questionStart: Date.now(),
                    paused: false,
                    pausedRemainingTime: null,
                    stopped: false,
                    linkedQuizId: quizId,
                    currentQuestionDuration: finalTimeLeft || 20,
                    socketToJoueur: {},
                    askedQuestions: new Set(),
                    statut: 'en cours'
                };
                // If quiz has question_ids, fetch the actual questions
                if (quiz && quiz.questions_ids && quiz.questions_ids.length > 0) {
                    try {
                        // Fetch questions from DB based on question_ids
                        const questions = await prisma.question.findMany({
                            where: {
                                uid: {
                                    in: quiz.questions_ids
                                }
                            }
                        });
                        // Update tournament state with the fetched questions
                        if (questions && questions.length > 0) {
                            tournamentState[code].questions = questions;
                            logger.info(`[TimerAction] Loaded ${questions.length} questions for tournament ${code}`);
                        }
                        else {
                            logger.warn(`[TimerAction] No questions found for quiz ${quizId} with ids ${quiz.questions_ids}`);
                        }
                        // Ensure currentQuestionUid is set to the question being started
                        tournamentState[code].currentQuestionUid = questionId;
                    }
                    catch (err) {
                        logger.error(`[TimerAction] Error fetching questions for tournament ${code}:`, err);
                    }
                }
                else {
                    logger.warn(`[TimerAction] No question_ids found for quiz ${quizId}`);
                }
                logger.info(`[TimerAction] Created tournament state for ${code} linked to quiz ${quizId}.`);
            }
            logger.info(`[TimerAction] Found/initialized tournament ${code}. Applying action: ${status}`);
            // Use centralized tournament timer management
            manageTimer(io, code, status, finalTimeLeft, status === 'play');
            // Always update DB status to 'en cours' on 'play' action to ensure consistency
            if (status === 'play') {
                logger.info(`[TimerAction] Attempting to update Tournoi ${code} status to 'en cours' in database...`);
                try {
                    await prisma.tournoi.update({
                        where: { code: code },
                        data: { statut: 'en cours' },
                    });
                    tournamentState[code].statut = 'en cours'; // Update in-memory status too
                    logger.info(`[TimerAction] Successfully updated Tournoi ${code} status to 'en cours'.`);
                    // Always emit redirect events on 'play' action to ensure clients redirect properly
                    logger.info(`[TimerAction] Emitting redirect_to_tournament for tournament ${code} to lobby`);
                    io.to(`lobby_${code}`).emit("redirect_to_tournament", { code });
                    // Broadcast global notification for clients that might not be in the correct room
                    logger.info(`[TimerAction] Broadcasting global tournament_notification for tournament ${code}`);
                    io.emit("tournament_notification", {
                        type: "redirect",
                        code: code,
                        message: "Tournament has started",
                        isQuizMode: true, // Explicitly mark as quiz mode for immediate redirect
                        immediate: true // Flag for immediate redirect without countdown
                    });
                    // Send additional redirect events with delays to ensure reliability
                    const sendDelayedRedirect = () => {
                        logger.info(`[TimerAction] Sending follow-up redirect_to_tournament for ${code}`);
                        io.to(`lobby_${code}`).emit("redirect_to_tournament", { code });
                    };
                    setTimeout(sendDelayedRedirect, 500);
                    setTimeout(sendDelayedRedirect, 1500);
                    setTimeout(sendDelayedRedirect, 3000);
                }
                catch (dbError) {
                    logger.error(`[TimerAction] Failed to update Tournoi ${code} status to 'en cours' in database:`, dbError);
                }
            }
        }
        else if (code) {
            logger.warn(`[TimerAction] Tournament state for code ${code} not found in memory. Cannot apply action.`);
        }
        else {
            logger.warn(`[TimerAction] No tournament linked to quiz ${quizId}. Cannot apply action.`);
        }
    }
    catch (err) {
        logger.error(`[TimerAction] Error handling action:`, err);
    }
    // Emit success messages based on status
    switch (status) {
        case 'play':
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'success',
                message: 'Démarrage du chrono'
            });
            break;
        case 'pause':
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'success',
                message: 'Timer paused.'
            });
            break;
        case 'stop':
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'success',
                message: 'Timer stopped.'
            });
            break;
        default:
            io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
                status: 'error',
                message: 'Unknown action.'
            });
            logger.warn(`[TimerAction] Unknown status received: ${status}`);
            return;
    }
}
module.exports = handleTimerAction;
