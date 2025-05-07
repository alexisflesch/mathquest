const createLogger = require('../../logger');
const logger = createLogger('ScoreUtils');

// scoreUtils.js - Utility functions for score calculations

/**
 * Calculate the score for a given question and answer.
 * @param {Object} question - The question object.
 * @param {Object} answer - The answer object.
 * @param {number} questionStartTime - The timestamp when the question started.
 * @param {number} totalQuestions - The total number of questions in the tournament.
 * @returns {Object} - An object containing baseScore, timePenalty, and totalScore.
 */
function calculateScore(question, answer, questionStartTime, totalQuestions) {
    logger.debug(`[calculateScore] Inputs: question=${JSON.stringify(question)}, answer=${JSON.stringify(answer)}, questionStartTime=${questionStartTime}, totalQuestions=${totalQuestions}`);

    if (!question || !answer || !Array.isArray(question.reponses)) {
        logger.warn(`[calculateScore] Invalid inputs: question=${JSON.stringify(question)}, answer=${JSON.stringify(answer)}`);
        return { baseScore: 0, timePenalty: 0, totalScore: 0 };
    }

    if (!answer) {
        logger.warn(`[calculateScore] Missing answer object for question=${question?.uid}`);
        return { baseScore: 0, timePenalty: 0, totalScore: 0 };
    }

    if (answer.answerIdx === undefined || (Array.isArray(answer.answerIdx) && answer.answerIdx.some(idx => idx >= question.reponses.length))) {
        logger.warn(`[calculateScore] Invalid answer index: answerIdx=${JSON.stringify(answer.answerIdx)}, question.reponses=${JSON.stringify(question.reponses)}`);
        return { baseScore: 0, timePenalty: 0, totalScore: 0 };
    }

    if (!totalQuestions || typeof totalQuestions !== 'number' || totalQuestions <= 0) {
        logger.warn(`[calculateScore] Invalid totalQuestions: ${totalQuestions}`);
        return { baseScore: 0, timePenalty: 0, totalScore: 0 };
    }

    let baseScore = 0, timePenalty = 0, totalScore = 0;
    const maxScorePerQuestion = 1000 / totalQuestions; // Maximum score per question

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
            let raw = maxScorePerQuestion * good - maxScorePerQuestion * bad;
            baseScore = Math.max(0, Math.min(maxScorePerQuestion, totalGood ? raw / totalGood : 0));
        } else {
            const correct = question?.reponses[answer.answerIdx]?.correct;
            baseScore = correct ? maxScorePerQuestion : 0;
        }

        if (questionStartTime && answer.clientTimestamp) {
            const timeUsed = (answer.clientTimestamp - questionStartTime) / 1000;
            timePenalty = Math.max(0, timeUsed * 0.5); // Deduct 0.5 points per second
        }

        totalScore = Math.max(0, baseScore - timePenalty);
    }

    logger.debug(`[calculateScore] Intermediate values: baseScore=${baseScore}, timePenalty=${timePenalty}, totalScore=${totalScore}`);

    return { baseScore, timePenalty, totalScore };
}

/**
 * Scale scores for quiz mode if not all questions are answered.
 * @param {Object} participants - The participants object.
 * @param {number} totalQuestions - The total number of questions in the tournament.
 * @param {number} answeredQuestions - The number of questions answered.
 */
function scaleScoresForQuiz(participants, totalQuestions, answeredQuestions) {
    const scaleFactor = totalQuestions / answeredQuestions;
    Object.values(participants).forEach(participant => {
        participant.score = Math.round(participant.score * scaleFactor);
    });
}

// Refactor saveParticipantScore to handle database operations
async function saveParticipantScore(prisma, tournoiId, participant) {
    if (!participant.id || participant.id.startsWith('socket_')) {
        logger.warn(`[saveParticipantScore] Not saving score for non-persistent participant: ${participant.id}`);
        return;
    }

    if (isNaN(participant.score) || participant.score === undefined) {
        logger.error(`[saveParticipantScore] Invalid score for joueurId=${participant.id}. Skipping save operation.`);
        return;
    }

    logger.info(`[saveParticipantScore] Saving score for tournoiId=${tournoiId}, joueurId=${participant.id}, score=${participant.score}`);
    logger.debug(`[saveParticipantScore] Received score=${participant.score} for joueurId=${participant.id}`);

    // Removed logic to handle both UUID and code. This function now only accepts UUIDs.
    const tournoi = await prisma.tournoi.findUnique({ where: { id: tournoiId } });
    if (!tournoi) {
        logger.error(`[saveParticipantScore] Tournoi with id=${tournoiId} does not exist. Skipping score creation for joueurId=${participant.id}`);
        return;
    }

    const tournoiIdUUID = tournoi.id;

    const joueurExists = await prisma.joueur.findUnique({ where: { id: participant.id } });
    if (!joueurExists) {
        logger.error(`[saveParticipantScore] Joueur with id=${participant.id} does not exist. Skipping score creation for tournoiId=${tournoiIdUUID}`);
        return;
    }

    logger.debug(`[saveParticipantScore] Validated existence of Tournoi (id=${tournoiIdUUID}) and Joueur (id=${participant.id})`);

    const existing = await prisma.score.findFirst({ where: { tournoi: { id: tournoiIdUUID }, joueur: { id: participant.id } } });
    if (existing) {
        logger.info(`[saveParticipantScore] Updating existing score record id=${existing.id}`);
        await prisma.score.update({ where: { id: existing.id }, data: { score: participant.score, date_score: new Date() } });
    } else {
        logger.info(`[saveParticipantScore] Creating new score record`);
        await prisma.score.create({
            data: {
                score: participant.score,
                date_score: new Date(),
                tournoi: {
                    connect: { id: tournoiIdUUID } // Ensure the tournoi relation is properly connected
                },
                joueur: {
                    connect: { id: participant.id } // Ensure the joueur relation is properly connected
                }
            }
        });
    }
}

module.exports = { calculateScore, scaleScoresForQuiz, saveParticipantScore };