// Check if the answer is the same as the last recorded answer
const lastAnswer = state.answers[joueurId]?.[questionUid];
if (lastAnswer && lastAnswer.answerIdx === answer.answerIdx) {
    logger.info(`[handleAnswerSubmission] Duplicate answer ignored for joueurId=${joueurId}, questionUid=${questionUid}`);
    return;
}

// Update the latest answer for the question
state.answers[joueurId] = {
    ...state.answers[joueurId],
    [questionUid]: answer
};

// Recalculate the score for the question
const previousScore = participant.score;
const { totalScore } = calculateScore(question, answer, state.questionStart, state.questions.length);
participant.score = previousScore - (state.scores[joueurId]?.[questionUid] || 0) + totalScore;

// Initialize questionScores object if not already present
if (!state.questionScores) {
    state.questionScores = {};
}
if (!state.questionScores[joueurId]) {
    state.questionScores[joueurId] = {};
}

// Update the score for the current question using its uid
state.questionScores[joueurId][q.uid] = totalScore;

// Compute the total score by summing the values in the questionScores object
participant.score = Object.values(state.questionScores[joueurId]).reduce((sum, score) => sum + score, 0);

logger.debug(`[handleTimerExpiration] Updated questionScores for joueurId=${joueurId}: ${JSON.stringify(state.questionScores[joueurId])}`);
logger.debug(`[handleTimerExpiration] Computed total score for joueurId=${joueurId}: ${participant.score}`);

// Pass the correct participant.score to saveParticipantScore
logger.debug(`[handleTimerExpiration] Passing correct score=${participant.score} for joueurId=${joueurId} to saveParticipantScore`);
await saveParticipantScore(prisma, tournoiId, participant);

// Update the score for this question
state.scores[joueurId] = {
    ...state.scores[joueurId],
    [questionUid]: totalScore
};