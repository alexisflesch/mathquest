const createLogger = require('../../logger');
const logger = createLogger('SetTimerHandler');
const { quizState } = require('../quizState');
const { tournamentState, triggerTournamentTimerSet } = require('../tournamentHandler');
const { patchQuizStateForBroadcast, updateChrono } = require('../quizUtils');
const { triggerQuizSetTimer } = require('../quizTriggers');

// Note: prisma is not needed here, so we don't pass it in registerQuizEvents
function handleSetTimer(io, socket, prisma, { quizId, timeLeft, teacherId, tournamentCode, questionUid }) {
    // Defensive: refuse to operate if quizId is missing or invalid
    if (!quizId || quizId === 'UNKNOWN_QUIZ_ID') {
        logger.error(`[SetTimer] Refusing to operate: invalid quizId received: ${quizId}`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : quizId invalide.'
        });
        return;
    }
    // Minimal info log for received event
    logger.info(`[SetTimer] Received quiz_set_timer for quiz ${quizId} with timeLeft=${timeLeft}s`);

    if (!quizState[quizId] || quizState[quizId].profTeacherId !== teacherId) {
        logger.warn(`[SetTimer] Unauthorized attempt for quiz ${quizId} from socket ${socket.id} (teacherId=${teacherId})`);
        socket.emit('quiz_action_response', {
            status: 'error',
            message: 'Erreur : accès non autorisé.'
        });
        return;
    }
    // Update profSocketId to current socket
    quizState[quizId].profSocketId = socket.id;

    // Defensive: ensure quizState[quizId].id is always set for patchQuizStateForBroadcast
    if (!quizState[quizId].id) {
        quizState[quizId].id = quizId;
    }

    // Handle inactive questions
    if (!quizState[quizId].chrono.running && questionUid) {
        const inactiveTargetQuestion = quizState[quizId].questions.find(q => q.uid === questionUid);
        if (inactiveTargetQuestion) {
            inactiveTargetQuestion.temps = timeLeft;
            // Also update per-question timer state if it exists
            if (quizState[quizId].questionTimers && quizState[quizId].questionTimers[questionUid]) {
                quizState[quizId].questionTimers[questionUid].initialTime = timeLeft;
                quizState[quizId].questionTimers[questionUid].timeLeft = timeLeft;
            }
            // Set currentQuestionUid to the edited question if not set, to avoid UNKNOWN_QUIZ_ID warning
            if (!quizState[quizId].currentQuestionUid) {
                quizState[quizId].currentQuestionUid = questionUid;
            }
            // Emit updated quiz state so frontend can update UI
            io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
            // Do NOT emit to projection or live for inactive question edits
        } else {
            logger.warn(`[SetTimer] Question UID ${questionUid} not found in quiz ${quizId}`);
        }
        return;
    }

    // Handle editing a paused timer: update value, emit pause, and return
    if (quizState[quizId].chrono.running === false && quizState[quizId].chrono.status === 'pause') {
        const pausedTargetQuestionId = questionUid || quizState[quizId].currentQuestionUid;
        const pausedTargetQuestion = quizState[quizId].questions.find(q => q.uid === pausedTargetQuestionId);
        if (pausedTargetQuestion) {
            pausedTargetQuestion.temps = timeLeft;
        } else {
            logger.warn(`[SetTimer] Question UID ${pausedTargetQuestionId} not found in quiz ${quizId}`);
        }
        // Emit timer update with status 'pause'
        const timerUpdatePayload = {
            status: 'pause',
            questionId: pausedTargetQuestionId,
            timeLeft: timeLeft,
            timestamp: Date.now()
        };
        io.to(`dashboard_${quizId}`).emit("quiz_timer_update", timerUpdatePayload);
        io.to(`projection_${quizId}`).emit("quiz_timer_update", timerUpdatePayload);
        // Tournament sync if needed
        const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        if (code && tournamentState[code] && tournamentState[code].currentQuestionUid === pausedTargetQuestionId) {
            let questionState = 'paused';
            if (tournamentState[code].stopped) questionState = 'stopped';
            io.to(`live_${code}`).emit("tournament_set_timer", {
                timeLeft: timeLeft,
                questionState
            });
        }
        io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
            status: 'success',
            message: 'Timer set successfully.'
        });
        return;
    }

    // --- Update Quiz State --- 
    quizState[quizId] = updateChrono(quizState[quizId], timeLeft, quizState[quizId].chrono.running ? 'play' : 'pause');

    // Use questionUid from payload if provided, else fallback to current active question
    const targetQuestionUid = questionUid || quizState[quizId].currentQuestionUid;

    if (!targetQuestionUid) {
        logger.warn(`[SetTimer] No target question UID provided. Falling back to current active question.`);
    }

    // Ensure proper state transitions for paused questions
    if (quizState[quizId].chrono.status === 'pause' && timeLeft !== undefined) {
        quizState[quizId].chrono.timeLeft = timeLeft;
        quizState[quizId].chrono.running = false; // Explicitly keep paused
    } else if (quizState[quizId].chrono.status === 'pause') {
        logger.error(`[SetTimer] Failed to update paused timer for question UID ${targetQuestionUid} in quiz ${quizId}. TimeLeft is undefined.`);
    }

    if (targetQuestionUid) {
        triggerQuizSetTimer(io, quizId, targetQuestionUid, timeLeft);
    }
    const targetQuestion = quizState[quizId].questions.find(q => q.uid === targetQuestionUid);
    if (targetQuestion) {
        targetQuestion.temps = timeLeft;
    } else {
        logger.warn(`[SetTimer] Could not update temps for question UID ${targetQuestionUid} in quiz ${quizId} state.`);
    }

    // Update quiz status to 'en cours' if it is currently 'en préparation'
    if (quizState[quizId].statut === 'en préparation') {
        quizState[quizId].statut = 'en cours';
        io.to(`lobby_${quizId}`).emit('redirect_to_quiz', { quizId });
    }

    // Emit updated quiz state and specific timer update
    io.to(`dashboard_${quizId}`).emit("quiz_state", patchQuizStateForBroadcast(quizState[quizId]));
    if (targetQuestionUid) {
        let timerStatus = quizState[quizId].chrono.running ? 'play' : 'pause';
        if (quizState[quizId].chrono.status === 'pause') timerStatus = 'pause';
        const timerUpdatePayload = {
            status: timerStatus,
            questionId: targetQuestionUid,
            timeLeft: timeLeft,
            timestamp: Date.now()
        };
        io.to(`dashboard_${quizId}`).emit("quiz_timer_update", timerUpdatePayload);
        io.to(`projection_${quizId}`).emit("quiz_timer_update", timerUpdatePayload);
        const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
        if (code && tournamentState[code] && tournamentState[code].currentQuestionUid === targetQuestionUid) {
            let questionState = 'active';
            if (tournamentState[code].paused) questionState = 'paused';
            if (tournamentState[code].stopped) questionState = 'stopped';
            io.to(`live_${code}`).emit("tournament_set_timer", {
                timeLeft: timeLeft,
                questionState
            });
        }
    }

    io.to(`dashboard_${quizId}`).emit('quiz_action_response', {
        status: 'success',
        message: 'Timer set successfully.'
    });

    const code = tournamentCode || Object.keys(tournamentState).find(c => tournamentState[c] && tournamentState[c].linkedQuizId === quizId);
    if (code) {
        triggerTournamentTimerSet(io, code, timeLeft, false);
    }
}

module.exports = handleSetTimer;
