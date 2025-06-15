"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth")); // Import authRouter
const teachers_1 = __importDefault(require("./teachers"));
const players_1 = __importDefault(require("./players"));
const gameTemplates_1 = __importDefault(require("./gameTemplates"));
const gameControl_1 = __importDefault(require("./gameControl")); // Added import for gameControlRouter
const quizTemplates_1 = __importDefault(require("./quizTemplates")); // Import quizTemplatesRouter
const games_1 = __importDefault(require("./games")); // Re-enabled gamesRouter
const questions_1 = __importDefault(require("./questions")); // Import questionsRouter
const student_1 = __importDefault(require("./student")); // Import studentRouter
const users_1 = __importDefault(require("./users")); // Import usersRouter
const sessions_1 = __importDefault(require("./practice/sessions")); // Import practiceSessionsRouter
// import gameSessionsRouter from './gameSessions';
const auth_2 = require("@/middleware/auth");
const router = express_1.default.Router();
// Mount the auth router
router.use('/auth', auth_1.default);
// Mount the teachers router
router.use('/teachers', teachers_1.default);
// Mount the players router
router.use('/players', players_1.default);
// Mount the game templates router, protected by teacherAuth
router.use('/game-templates', auth_2.teacherAuth, gameTemplates_1.default);
// Mount the quiz templates router, protected by teacherAuth
router.use('/quiz-templates', auth_2.teacherAuth, quizTemplates_1.default);
// Mount the games router
router.use('/games', games_1.default); // Re-enabled gamesRouter mounting
// Mount the game control router
router.use('/game-control', gameControl_1.default);
// Mount the questions router (no teacherAuth, allow public GET)
router.use('/questions', questions_1.default);
// Mount the student router (for student operations)
router.use('/student', student_1.default);
// Mount the users router (protected by authentication)
router.use('/users', users_1.default);
// Mount the practice sessions router
router.use('/practice/sessions', sessions_1.default);
// User management routes
// router.use('/users', usersManagementRouter); // Commented out
exports.default = router;
