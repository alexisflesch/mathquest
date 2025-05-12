import createLogger from '../../logger';
const logger = createLogger('ScoreUtils');
const MAX_SCORE_PER_QUESTION = 1000;
// Adjusted TIME_PENALTY_FACTOR logic:
// Points lost per unit of time relative to question's allowed time.
// Example: If TIME_PENALTY_SCALE_FACTOR is 0.5, half the question time incurs 50% of max penalty.
const TIME_PENALTY_SCALE_FACTOR = 0.8; // How quickly penalty maxes out relative to question time.
/**
 * Calculates the score for a given answer.
 * @param question The question object.
 * @param answer The participant's answer object.
 * @param questionStartTime The timestamp when the question was presented (used for context, not direct calc here if answer.timeMs is duration).
 * @param totalQuestions The total number of questions in the tournament (for scaling, if any).
 * @returns ScoreCalculationResult object.
 */
export function calculateScore(question, answer, questionStartTime, totalQuestions) {
    var _a;
    if (!question || !answer) {
        logger.warn('[calculateScore] Missing question or answer object.');
        return { baseScore: 0, timePenalty: 0, totalScore: 0 };
    }
    // Correctness should ideally be set when the answer is processed in triggerTournamentAnswer
    // If not, a basic check can be done here, but it might lack context (e.g., for numeric ranges)
    if (typeof answer.isCorrect !== 'boolean') {
        logger.warn(`[calculateScore] Answer correctness for Q ${question.uid} not pre-determined. Attempting basic check.`);
        // Basic check (example, may need to be more robust or rely on pre-determination)
        const correctAnswerDetails = (_a = question.reponses) === null || _a === void 0 ? void 0 : _a.find(r => r.correct);
        if (question.type === 'QCM' || question.type === 'QCU') {
            answer.isCorrect = (correctAnswerDetails === null || correctAnswerDetails === void 0 ? void 0 : correctAnswerDetails.texte) === answer.value;
        }
        else if (question.type === 'numeric') {
            // For numeric, direct comparison might be okay if value is already parsed.
            // Consider allowing a small tolerance for floating point numbers if applicable.
            answer.isCorrect = (correctAnswerDetails === null || correctAnswerDetails === void 0 ? void 0 : correctAnswerDetails.texte) === String(answer.value);
        }
        else {
            answer.isCorrect = false; // Default for unhandled types or if no correct answer defined
        }
        logger.info(`[calculateScore] Basic check for Q ${question.uid} set isCorrect to ${answer.isCorrect}`);
    }
    let baseScore = 0;
    if (answer.isCorrect) {
        baseScore = MAX_SCORE_PER_QUESTION;
    }
    let timePenalty = 0;
    if (answer.isCorrect && question.temps && answer.timeMs && answer.timeMs > 0) {
        const questionTimeLimitSec = question.temps;
        const answerTimeSec = answer.timeMs / 1000;
        // Penalty increases with time taken. Max penalty is MAX_SCORE_PER_QUESTION.
        // Penalty reaches max if answerTimeSec approaches questionTimeLimitSec * TIME_PENALTY_SCALE_FACTOR
        const penaltyRatio = Math.min(answerTimeSec / (questionTimeLimitSec * TIME_PENALTY_SCALE_FACTOR), 1);
        timePenalty = Math.floor(baseScore * penaltyRatio);
        // Ensure penalty does not make score negative if baseScore is already low or zero.
        timePenalty = Math.min(timePenalty, baseScore);
    }
    else if (answer.isCorrect && (!question.temps || !answer.timeMs)) {
        // If correct but no timing info, no penalty.
        timePenalty = 0;
    }
    const totalScore = Math.max(0, baseScore - timePenalty);
    logger.debug(`[calculateScore] Q: ${question.uid}, AnswerVal: ${answer.value}, Correct: ${answer.isCorrect}, ` +
        `Base: ${baseScore}, Penalty: ${timePenalty}, Total: ${totalScore}, AnswerTimeSec: ${answer.timeMs ? (answer.timeMs / 1000).toFixed(2) : 'N/A'}, QLimitSec: ${question.temps}`);
    return { baseScore, timePenalty, totalScore };
}
/**
 * Saves a participant's score to the database.
 * @param prisma PrismaClient instance.
 * @param tournoiId The ID of the tournament.
 * @param participant The participant object containing ID and new score.
 */
export async function saveParticipantScore(prisma, tournoiId, participant) {
    if (!tournoiId || !participant || !participant.id || typeof participant.score !== 'number') {
        logger.error('[saveParticipantScore] Invalid arguments provided.', { tournoiId, participantId: participant === null || participant === void 0 ? void 0 : participant.id, score: participant === null || participant === void 0 ? void 0 : participant.score });
        return;
    }
    // Ensure participant.id is not a temporary socket ID
    if (participant.id.startsWith('socket_')) {
        logger.warn(`[saveParticipantScore] Attempted to save score for temporary participant ID: ${participant.id}. Skipping.`);
        return;
    }
    try {
        const existingScore = await prisma.score.findFirst({
            where: {
                tournoi_id: tournoiId,
                joueur_id: participant.id,
            },
        });
        if (existingScore) {
            await prisma.score.update({
                where: { id: existingScore.id },
                data: { score: participant.score, date_score: new Date() },
            });
            logger.info(`[saveParticipantScore] Updated score for participant ${participant.id} in tournoi ${tournoiId} to ${participant.score}`);
        }
        else {
            // Ensure the joueur (participant) exists in the Joueur table before creating a score entry
            const joueurExists = await prisma.joueur.findUnique({ where: { id: participant.id } });
            if (!joueurExists) {
                // This case should ideally not happen if participants are created/validated upon joining a tournament.
                // If it can happen, you might need to create a Joueur entry here or handle it as an error.
                logger.error(`[saveParticipantScore] Joueur with ID ${participant.id} not found. Cannot create score entry.`);
                return;
            }
            await prisma.score.create({
                data: {
                    tournoi_id: tournoiId,
                    joueur_id: participant.id, // This is the foreign key to Joueur table
                    score: participant.score,
                    date_score: new Date(),
                },
            });
            logger.info(`[saveParticipantScore] Created score for participant ${participant.id} in tournoi ${tournoiId} with score ${participant.score}`);
        }
    }
    catch (error) {
        logger.error(`[saveParticipantScore] Error saving score for participant ${participant.id} in tournoi ${tournoiId}: ${error.message}`, { stack: error.stack });
    }
}
/**
 * Placeholder for scaling scores in a quiz context, if needed.
 */
export function scaleScoresForQuiz(quizId, io /* Server type from socket.io */) {
    logger.info(`[scaleScoresForQuiz] Placeholder for quiz ${quizId}. Currently does nothing.`);
    // Future logic for scaling scores at the end of a quiz or specific intervals.
}
// For CommonJS bridge compatibility if needed, though direct ES module imports are preferred.
const scoreUtils = {
    calculateScore,
    saveParticipantScore,
    scaleScoresForQuiz,
};
export default scoreUtils;
