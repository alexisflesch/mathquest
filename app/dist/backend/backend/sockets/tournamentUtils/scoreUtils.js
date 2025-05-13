"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = calculateScore;
exports.saveParticipantScore = saveParticipantScore;
exports.scaleScoresForQuiz = scaleScoresForQuiz;
// TournamentAnswer is the raw stored type. We'll define a new type for processed answers.
// import { TournamentAnswer } from '../types/tournamentTypes'; 
const logger_1 = __importDefault(require("../../logger"));
const logger = (0, logger_1.default)('ScoreUtils');
const MAX_SCORE_BASE = 1000;
const MAX_TIME_PENALTY = 500;
// TIME_PENALTY_SCALE_FACTOR is no longer used with the linear penalty.
/**
 * Calculates the score for a given answer based on the new rules.
 * Assumes the answer has been processed to determine correctness, value, and time taken.
 * @param question The question object.
 * @param answer The processed answer object.
 * @param totalQuestionsInEvent Total number of questions in the quiz/tournament for normalization.
 * @returns ScoreCalculationResult object.
 */
function calculateScore(question, answer, totalQuestionsInEvent) {
    var _a;
    if (!question || !answer || totalQuestionsInEvent <= 0) {
        logger.warn('[calculateScore] Missing question, processed answer object, or invalid totalQuestionsInEvent.', {
            questionId: question === null || question === void 0 ? void 0 : question.uid, answerProvided: !!answer, totalQuestionsInEvent
        });
        return { scoreBeforePenalty: 0, timePenalty: 0, normalizedQuestionScore: 0 };
    }
    // 1. Calculate Time Penalty
    let timePenalty = 0;
    // TODO: For quizzes, question.temps might not be the definitive "availableTimeSeconds".
    // This needs a more robust way to determine how long the question was available for answering in a quiz context.
    const availableTimeSeconds = question.temps || 20; // Default to 20s if not set
    if (answer.timeMs >= 0 && availableTimeSeconds > 0) {
        const proportionOfTimeTaken = Math.min(answer.timeMs / (availableTimeSeconds * 1000), 1);
        timePenalty = Math.round(proportionOfTimeTaken * MAX_TIME_PENALTY);
    }
    timePenalty = Math.max(0, Math.min(timePenalty, MAX_TIME_PENALTY)); // Ensure penalty is within [0, MAX_TIME_PENALTY]
    // 2. Calculate Score Before Penalty (Base Score)
    let scoreBeforePenalty = 0;
    const correctResponses = ((_a = question.reponses) === null || _a === void 0 ? void 0 : _a.filter(r => r.correct)) || [];
    const numCorrectOptions = correctResponses.length;
    if (!question.reponses || numCorrectOptions === 0) {
        logger.warn(`[calculateScore] Question ${question.uid} has no responses or no correct responses defined.`);
        // scoreBeforePenalty remains 0
    }
    else if (question.type === 'QCU' || (question.type === 'QCM' && numCorrectOptions === 1)) {
        // Treat as QCU: 1000 if correct, 0 if incorrect.
        // The caller should set answer.isCorrect based on comparing answer.answerIdx with the correct option.
        // For QCM with 1 correct answer, answer.isCorrect should be true if the single correct option was chosen.
        if (answer.isCorrect) { // Relies on caller to set this correctly for QCU-like scenarios
            scoreBeforePenalty = MAX_SCORE_BASE;
        }
    }
    else if (question.type === 'QCM') {
        const pointsPerOption = MAX_SCORE_BASE / numCorrectOptions;
        let currentScoreForQCM = 0;
        const selectedIndices = Array.isArray(answer.answerIdx) ? answer.answerIdx : (typeof answer.answerIdx === 'number' ? [answer.answerIdx] : []);
        question.reponses.forEach((response, index) => {
            const isSelected = selectedIndices.includes(index);
            if (isSelected) {
                if (response.correct) {
                    currentScoreForQCM += pointsPerOption;
                }
                else {
                    currentScoreForQCM -= pointsPerOption;
                }
            }
        });
        scoreBeforePenalty = Math.max(0, Math.round(currentScoreForQCM));
    }
    else {
        logger.warn(`[calculateScore] Unhandled question type: ${question.type} for question ${question.uid}`);
        // scoreBeforePenalty remains 0 for unhandled types
    }
    // 3. Apply Penalty
    const scoreAfterPenalty = Math.max(0, scoreBeforePenalty - timePenalty);
    // 4. Normalize Score
    const normalizedQuestionScore = totalQuestionsInEvent > 0 ? Math.round(scoreAfterPenalty / totalQuestionsInEvent) : 0;
    logger.debug(`[calculateScore] Q_UID: ${question.uid}, Type: ${question.type}, AnswerValue: '''${JSON.stringify(answer.value)}''', CorrectOverall: ${answer.isCorrect}, ` +
        `TimeTakenMs: ${answer.timeMs}, AvailableTimeSec: ${availableTimeSeconds}, ` +
        `ScoreBeforePenalty: ${scoreBeforePenalty}, TimePenalty: ${timePenalty}, ScoreAfterPenalty: ${scoreAfterPenalty}, ` +
        `TotalQuestions: ${totalQuestionsInEvent}, NormalizedScore: ${normalizedQuestionScore}`);
    return { scoreBeforePenalty, timePenalty, normalizedQuestionScore };
}
/**
 * Saves a participant's score to the database.
 * @param prisma PrismaClient instance.
 * @param tournoiId The ID of the tournament.
 * @param participant The participant object containing ID and new score.
 */
async function saveParticipantScore(prisma, tournoiId, participant) {
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
function scaleScoresForQuiz(quizId, io /* Server type from socket.io */) {
    logger.info(`[scaleScoresForQuiz] Placeholder for quiz ${quizId}. Currently does nothing.`);
    // Future logic for scaling scores at the end of a quiz or specific intervals.
}
// For CommonJS bridge compatibility if needed, though direct ES module imports are preferred.
const scoreUtils = {
    calculateScore,
    saveParticipantScore,
    scaleScoresForQuiz,
};
exports.default = scoreUtils;
