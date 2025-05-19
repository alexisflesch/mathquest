"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const teachers_1 = __importDefault(require("./teachers"));
const players_1 = __importDefault(require("./players"));
const questions_1 = __importDefault(require("./questions"));
const games_1 = __importDefault(require("./games"));
const gameControl_1 = __importDefault(require("./gameControl"));
const quizTemplates_1 = __importDefault(require("./quizTemplates"));
const router = express_1.default.Router();
// Mount the teachers router
router.use('/teachers', teachers_1.default);
// Mount the players router
router.use('/players', players_1.default);
// Mount the questions router
router.use('/questions', questions_1.default);
// Mount the quiz templates router
router.use('/game-templates', quizTemplates_1.default);
// Mount the games router
router.use('/games', games_1.default);
// Mount the game control router
router.use('/game-control', gameControl_1.default);
exports.default = router;
