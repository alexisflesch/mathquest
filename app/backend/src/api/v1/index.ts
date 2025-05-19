import express from 'express';
import teachersRouter from './teachers';
import playersRouter from './players';
import questionsRouter from './questions';
import gamesRouter from './games';
import gameControlRouter from './gameControl';
import quizTemplatesRouter from './quizTemplates';

const router = express.Router();

// Mount the teachers router
router.use('/teachers', teachersRouter);

// Mount the players router
router.use('/players', playersRouter);

// Mount the questions router
router.use('/questions', questionsRouter);

// Mount the quiz templates router
router.use('/game-templates', quizTemplatesRouter);

// Mount the games router
router.use('/games', gamesRouter);

// Mount the game control router
router.use('/game-control', gameControlRouter);

export default router;
