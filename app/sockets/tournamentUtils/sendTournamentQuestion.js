/**
 * sendTournamentQuestion.js - Centralized helper to emit filtered tournament questions to students
 *
 * This function ensures only the minimal, non-sensitive fields are sent to students:
 * - type: question type (e.g., 'choix_simple', 'choix_multiple')
 * - uid: question unique id
 * - question: question text
 * - answers: array of answer texts (no 'correct' field)
 *
 * Usage:
 *   const { sendTournamentQuestion } = require('./tournamentUtils/sendTournamentQuestion');
 *   sendTournamentQuestion(socketOrIo, target, questionObj, index, total, remainingTime, questionState, isQuizMode);
 *
 * If 'target' is null, emits directly to the socket (for socket.emit). Otherwise, emits to a room (for io.to(...)).
 */
function sendTournamentQuestion(socketOrIo, target, questionObj, index, total, remainingTime, questionState, isQuizMode) {
    const payload = {
        type: questionObj.type,
        uid: questionObj.uid,
        question: questionObj.question,
        answers: Array.isArray(questionObj.reponses)
            ? questionObj.reponses.map(r => r.texte)
            : [],
        index,
        total,
        remainingTime,
        questionState,
        isQuizMode
    };
    if (target) {
        socketOrIo.to(target).emit('tournament_question', payload);
    } else {
        socketOrIo.emit('tournament_question', payload);
    }
}

module.exports = { sendTournamentQuestion };
