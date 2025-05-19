"use strict";
// Mock quiz and tournament data for test seeding
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTournament = exports.mockQuiz = void 0;
const testQuestions_1 = require("./testQuestions");
exports.mockQuiz = {
    id: 'mock-quiz-1',
    name: 'Mock Quiz for Testing',
    creatorTeacherId: 'teacher-1',
    themes: ['math', 'science'],
    questions: [
        testQuestions_1.testQuestions[0], // q-math-1
        testQuestions_1.testQuestions[2], // q-sci-1
        testQuestions_1.testQuestions[4] // q-geo-1
    ]
};
exports.mockTournament = {
    id: 'mock-tournament-1',
    name: 'Mock Tournament for Testing',
    creatorTeacherId: 'teacher-1',
    themes: ['math', 'history'],
    questions: [
        testQuestions_1.testQuestions[1], // q-math-2
        testQuestions_1.testQuestions[3], // q-hist-1
        testQuestions_1.testQuestions[6] // q-math-3
    ]
};
