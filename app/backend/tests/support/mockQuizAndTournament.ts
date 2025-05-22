// Mock quiz and tournament data for test seeding

import { testQuestions } from './testQuestions';

export const mockQuiz = {
    id: 'mock-quiz-1',
    name: 'Mock Quiz for Testing',
    creatoruserId: 'teacher-1',
    themes: ['math', 'science'],
    questions: [
        testQuestions[0], // q-math-1
        testQuestions[2], // q-sci-1
        testQuestions[4]  // q-geo-1
    ]
};

export const mockTournament = {
    id: 'mock-tournament-1',
    name: 'Mock Tournament for Testing',
    creatoruserId: 'teacher-1',
    themes: ['math', 'history'],
    questions: [
        testQuestions[1], // q-math-2
        testQuestions[3], // q-hist-1
        testQuestions[6]  // q-math-3
    ]
};
