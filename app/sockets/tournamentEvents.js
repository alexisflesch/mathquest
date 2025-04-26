const handleStartTournament = require('./tournamentEventHandlers/startHandler');
const handleJoinTournament = require('./tournamentEventHandlers/joinHandler');
const handleTournamentAnswer = require('./tournamentEventHandlers/answerHandler');
const handleTournamentPause = require('./tournamentEventHandlers/pauseHandler');
const handleTournamentResume = require('./tournamentEventHandlers/resumeHandler');
const handleDisconnecting = require('./tournamentEventHandlers/disconnectingHandler');

function registerTournamentEvents(io, socket) {
    // Note: prisma is not passed here, handlers import it directly if needed.
    socket.on("start_tournament", (payload) => handleStartTournament(io, socket, payload));
    socket.on("join_tournament", (payload) => handleJoinTournament(io, socket, payload));
    socket.on("tournament_answer", (payload) => handleTournamentAnswer(io, socket, payload));
    socket.on("tournament_pause", (payload) => handleTournamentPause(io, socket, payload));
    socket.on("tournament_resume", (payload) => handleTournamentResume(io, socket, payload));
    socket.on("disconnecting", () => handleDisconnecting(io, socket));
    // Add other tournament-specific events here if any
}

module.exports = registerTournamentEvents;
