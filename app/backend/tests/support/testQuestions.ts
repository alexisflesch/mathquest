// A dozen diverse test questions for backend tests

export const testQuestions = [
    {
        uid: 'q-math-1',
        text: 'What is 2 + 2?',
        answerOptions: ['3', '4', '5', '6'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['arithmetic'],
        gradeLevel: 'elementary',
        tags: ['addition', 'easy'],
        difficulty: 1
    },
    {
        uid: 'q-math-2',
        text: 'Solve for x: 2x = 10',
        answerOptions: ['2', '5', '10', '8'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['algebra'],
        gradeLevel: 'middle',
        tags: ['equation', 'algebra'],
        difficulty: 2
    },
    {
        uid: 'q-sci-1',
        text: 'What planet is known as the Red Planet?',
        answerOptions: ['Earth', 'Mars', 'Jupiter', 'Venus'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['astronomy'],
        gradeLevel: 'elementary',
        tags: ['planets', 'space'],
        difficulty: 1
    },
    {
        uid: 'q-hist-1',
        text: 'Who was the first President of the United States?',
        answerOptions: ['Abraham Lincoln', 'George Washington', 'John Adams', 'Thomas Jefferson'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'history',
        themes: ['american history'],
        gradeLevel: 'middle',
        tags: ['presidents', 'usa'],
        difficulty: 2
    },
    {
        uid: 'q-geo-1',
        text: 'What is the capital of France?',
        answerOptions: ['Paris', 'London', 'Berlin', 'Madrid'],
        correctAnswers: [true, false, false, false],
        questionType: 'single_correct',
        discipline: 'geography',
        themes: ['capitals'],
        gradeLevel: 'elementary',
        tags: ['europe', 'cities'],
        difficulty: 1
    },
    {
        uid: 'q-eng-1',
        text: 'Which word is a noun?',
        answerOptions: ['run', 'happy', 'cat', 'blue'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'english',
        themes: ['grammar'],
        gradeLevel: 'elementary',
        tags: ['parts of speech'],
        difficulty: 1
    },
    {
        uid: 'q-math-3',
        text: 'What is the square root of 81?',
        answerOptions: ['7', '8', '9', '10'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['roots'],
        gradeLevel: 'middle',
        tags: ['square root'],
        difficulty: 2
    },
    {
        uid: 'q-sci-2',
        text: 'What gas do plants absorb from the atmosphere?',
        answerOptions: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Hydrogen'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['biology'],
        gradeLevel: 'elementary',
        tags: ['photosynthesis'],
        difficulty: 1
    },
    {
        uid: 'q-hist-2',
        text: 'In what year did World War II end?',
        answerOptions: ['1942', '1945', '1948', '1950'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'history',
        themes: ['world history'],
        gradeLevel: 'high',
        tags: ['ww2'],
        difficulty: 3
    },
    {
        uid: 'q-geo-2',
        text: 'Which continent is the Sahara Desert located on?',
        answerOptions: ['Asia', 'Africa', 'Australia', 'Europe'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'geography',
        themes: ['deserts'],
        gradeLevel: 'middle',
        tags: ['africa', 'desert'],
        difficulty: 2
    },
    {
        uid: 'q-eng-2',
        text: 'What is the synonym of "quick"?',
        answerOptions: ['slow', 'fast', 'tall', 'short'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'english',
        themes: ['vocabulary'],
        gradeLevel: 'middle',
        tags: ['synonyms'],
        difficulty: 2
    },
    {
        uid: 'q-math-4',
        text: 'What is the value of pi (π) rounded to two decimal places?',
        answerOptions: ['3.12', '3.14', '3.16', '3.18'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['geometry'],
        gradeLevel: 'high',
        tags: ['pi', 'circle'],
        difficulty: 3
    },
    // Multiple correct answers example
    {
        uid: 'q-math-multi-1',
        text: 'Select all prime numbers.',
        answerOptions: ['2', '3', '4', '5'],
        correctAnswers: [true, true, false, true],
        questionType: 'multiple_correct',
        discipline: 'math',
        themes: ['primes'],
        gradeLevel: 'elementary',
        tags: ['prime numbers'],
        difficulty: 2
    },
    // Single Answer (SA) examples
    {
        uid: 'q-math-sa-1',
        text: 'What is the derivative of x^2?',
        answerOptions: ['2x', 'x', 'x^2', '2'],
        correctAnswers: [true, false, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['calculus'],
        gradeLevel: 'high',
        tags: ['derivative'],
        difficulty: 3
    },
    {
        uid: 'q-eng-sa-1',
        text: 'What is the past tense of "go"?',
        answerOptions: ['goes', 'gone', 'went', 'going'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'english',
        themes: ['verbs'],
        gradeLevel: 'elementary',
        tags: ['past tense'],
        difficulty: 1
    }
];

import { mockQuiz, mockTournament } from './mockQuizAndTournament';
import { PrismaClient } from '../../src/db/generated/client';

// Ensure the teacher used for seeding quizzes/tournaments exists
// Use upsert with unique email (best practice for unique constraints)
const prisma = new PrismaClient();
prisma.user.upsert({
    where: { email: 'teacher1@example.com' },
    update: {},
    create: {
        id: 'teacher-1',
        username: 'testteacher',
        passwordHash: 'testhash',
        email: 'teacher1@example.com',
        role: 'TEACHER',
        teacherProfile: { create: {} }
    }
}).finally(() => prisma.$disconnect());
// No export statements at the end; use named imports where needed.
