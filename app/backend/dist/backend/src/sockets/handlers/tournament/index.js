"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTournamentHandlers = registerTournamentHandlers;
const tournamentHandler_1 = require("../tournamentHandler");
function registerTournamentHandlers(io, socket) {
    (0, tournamentHandler_1.tournamentHandler)(io, socket);
}
// No changes needed; registration is already correct and DRY.
exports.default = registerTournamentHandlers;
