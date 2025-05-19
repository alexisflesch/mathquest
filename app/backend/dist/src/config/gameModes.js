"use strict";
// Configuration for special game modes: practice and differed (asynchronous)
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAME_MODES = void 0;
exports.GAME_MODES = {
    PRACTICE: {
        enabled: true,
        defaultDurationDays: 30, // Practice mode available for 30 days by default
        allowTimer: false,
        label: 'Practice',
    },
    DIFFERED: {
        enabled: true,
        defaultDurationDays: 7, // Differed mode available for 7 days by default
        allowTimer: true, // Timer starts per-user when they begin
        label: 'Differed',
    },
};
