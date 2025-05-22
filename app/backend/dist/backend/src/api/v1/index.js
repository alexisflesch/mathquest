"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teachers_1 = __importDefault(require("./teachers"));
const players_1 = __importDefault(require("./players"));
const gameTemplates_1 = __importDefault(require("./gameTemplates"));
const gameControl_1 = __importDefault(require("./gameControl")); // Added import for gameControlRouter
const quizTemplates_1 = __importDefault(require("./quizTemplates")); // Import quizTemplatesRouter
const games_1 = __importDefault(require("./games")); // Re-enabled gamesRouter
const questions_1 = __importDefault(require("./questions")); // Import questionsRouter
// import gameSessionsRouter from './gameSessions';
const auth_1 = require("@/middleware/auth");
const router = express_1.default.Router();
// Mount the teachers router
router.use('/teachers', teachers_1.default);
// Mount the players router
router.use('/players', players_1.default);
// Mount the game templates router, protected by teacherAuth
router.use('/game-templates', auth_1.teacherAuth, gameTemplates_1.default);
// Mount the quiz templates router, protected by teacherAuth
router.use('/quiz-templates', auth_1.teacherAuth, quizTemplates_1.default);
// Mount the games router
router.use('/games', games_1.default); // Re-enabled gamesRouter mounting
// Mount the game control router
router.use('/game-control', gameControl_1.default);
// Mount the questions router (no teacherAuth, allow public GET)
router.use('/questions', questions_1.default);
// User management routes
// router.use('/users', usersManagementRouter); // Commented out
exports.default = router;
