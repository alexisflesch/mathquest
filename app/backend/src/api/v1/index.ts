import express from 'express';
import authRouter from './auth'; // Import authRouter
import teachersRouter from './teachers';
import playersRouter from './players';
import gameTemplatesRouter from './gameTemplates';
import gameControlRouter from './gameControl'; // Added import for gameControlRouter
import quizTemplatesRouter from './quizTemplates'; // Import quizTemplatesRouter
import gamesRouter from './games'; // Re-enabled gamesRouter
import questionsRouter from './questions'; // Import questionsRouter
import studentRouter from './student'; // Import studentRouter
import usersRouter from './users'; // Import usersRouter
import myTournamentsRouter from './myTournaments'; // Import myTournamentsRouter
import practiceSessionsRouter from './practice/sessions'; // Import practiceSessionsRouter
// import gameSessionsRouter from './gameSessions';
import { teacherAuth } from '@/middleware/auth';
import validatePageAccessRouter from './validatePageAccess';

const router = express.Router();

// Mount the auth router
router.use('/auth', authRouter);

// Mount the teachers router
router.use('/teachers', teachersRouter);

// Mount the players router
router.use('/players', playersRouter);

// Mount the game templates router, protected by teacherAuth
router.use('/game-templates', teacherAuth, gameTemplatesRouter);

// Mount the quiz templates router, protected by teacherAuth
router.use('/quiz-templates', teacherAuth, quizTemplatesRouter);

// Mount the games router
router.use('/games', gamesRouter); // Re-enabled gamesRouter mounting

// Mount the game control router
router.use('/game-control', gameControlRouter);

// Mount the questions router (no teacherAuth, allow public GET)
router.use('/questions', questionsRouter);

// Mount the student router (for student operations)
router.use('/student', studentRouter);

// Mount the users router (protected by authentication)
router.use('/users', usersRouter);

// Mount the practice sessions router
router.use('/practice/sessions', practiceSessionsRouter);

// Mount the my-tournaments router
router.use('/my-tournaments', myTournamentsRouter);

// Mount the validate page access router
router.use('/validate-page-access', validatePageAccessRouter);

// User management routes
// router.use('/users', usersManagementRouter); // Commented out

export default router;
