"use strict";
/**
 * joinHandler.ts - Tournament Join Handler (Stub)
 *
 * This is a temporary stub implementation that will be completed later.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tournamentState_1 = require("../tournamentUtils/tournamentState");
const logger_1 = __importDefault(require("../../logger"));
/**
 * Handle join_tournament event
 *
 * @param io - Socket.IO server instance
 * @param socket - Client socket connection
 * @param payload - The join payload from the client
 */
async function handleJoinTournament(io, socket, payload) {
    var _a, _b, _c, _d, _e;
    const { code, cookie_id, pseudo, avatar, isDiffered } = payload;
    // Create a logger
    const logger = (0, logger_1.default)('JoinHandler');
    logger.info(`Player ${pseudo || 'unknown'} (${socket.id}) joined tournament ${code}`);
    try {
        // Join the room for this tournament
        const roomName = `live_${code}`;
        socket.join(roomName);
        // Add participant to tournament state if not already there
        if (!tournamentState_1.tournamentState[code]) {
            tournamentState_1.tournamentState[code] = {
                participants: [],
                questions: [],
                currentIndex: -1, // Initialize currentIndex, -1 indicates no question selected yet
                answers: {},
                timer: null,
                questionStart: null,
                paused: false,
                stopped: false,
                currentQuestionDuration: 0, // Default or from settings
                socketToJoueur: {},
                askedQuestions: new Set(),
                statut: 'en préparation' // Corrected from status to statut
            };
        }
        // Check if participant already exists (by cookie_id, which maps to participant.id)
        const participantExists = (_b = (_a = tournamentState_1.tournamentState[code]) === null || _a === void 0 ? void 0 : _a.participants) === null || _b === void 0 ? void 0 : _b.some((p) => p.id === cookie_id);
        if (!participantExists && cookie_id && pseudo && ((_c = tournamentState_1.tournamentState[code]) === null || _c === void 0 ? void 0 : _c.participants)) {
            // Add participant to tournament state
            tournamentState_1.tournamentState[code].participants.push({
                id: cookie_id, // Use id as per TournamentParticipant type
                socketId: socket.id,
                pseudo,
                avatar: avatar || '', // Ensure avatar is a string
                answers: [],
                score: 0 // Initialize score
            });
        }
        // Map socket.id to joueurId (cookie_id) for easy lookup
        if (cookie_id) {
            tournamentState_1.tournamentState[code].socketToJoueur[socket.id] = cookie_id;
            logger.debug(`Mapped socket ${socket.id} to joueurId ${cookie_id} for tournament ${code}`);
        }
        else {
            logger.warn(`No cookie_id provided for socket ${socket.id} in tournament ${code}, cannot map socket to joueur.`);
        }
        // Confirm to the client that they've joined
        socket.emit('joined_tournament', {
            code,
            socketId: socket.id
        });
        // Emit current tournament state if available
        // Use currentIndex to check if a question is active
        if (tournamentState_1.tournamentState[code].currentIndex !== -1 && tournamentState_1.tournamentState[code].questions.length > tournamentState_1.tournamentState[code].currentIndex) {
            const currentQuestion = tournamentState_1.tournamentState[code].questions[tournamentState_1.tournamentState[code].currentIndex];
            if (currentQuestion) {
                socket.emit('tournament_question', Object.assign(Object.assign({}, currentQuestion), { index: tournamentState_1.tournamentState[code].currentIndex, total: tournamentState_1.tournamentState[code].questions.length }));
            }
        }
        logger.debug(`Tournament ${code} now has ${((_e = (_d = tournamentState_1.tournamentState[code]) === null || _d === void 0 ? void 0 : _d.participants) === null || _e === void 0 ? void 0 : _e.length) || 0} participants`);
    }
    catch (error) {
        logger.error(`Error in handleJoinTournament: ${error}`);
        socket.emit('tournament_error', {
            message: 'Failed to join tournament',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
exports.default = handleJoinTournament;
