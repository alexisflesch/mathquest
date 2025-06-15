// A dozen diverse test questions for backend tests

export const testQuestions = [
    // Practice mode test questions with explanations
    {
        uid: 'TEST-add-1',
        text: 'Que fait 2 + 3 ?',
        answerOptions: ['4', '5', '6', '7'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['arithmetic'],
        gradeLevel: 'elementary',
        tags: ['addition', 'practice'],
        difficulty: 1,
        timeLimit: 30,
        feedbackWaitTime: 5,
        explanation: 'La réponse est 5 car 2 + 3 = 5. Quand on additionne 2 et 3, on obtient 5.'
    },
    {
        uid: 'TEST-add-2',
        text: 'Combien font 4 + 4 ?',
        answerOptions: ['6', '7', '8', '9'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['arithmetic'],
        gradeLevel: 'elementary',
        tags: ['addition', 'practice'],
        difficulty: 1,
        timeLimit: 30,
        feedbackWaitTime: 5,
        explanation: 'La réponse est 8 car 4 + 4 = 8. C\'est le double de 4.'
    },
    {
        uid: 'TEST-mult-1',
        text: 'Que fait 3 × 2 ?',
        answerOptions: ['5', '6', '7', '8'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['multiplication'],
        gradeLevel: 'elementary',
        tags: ['multiplication', 'practice'],
        difficulty: 1,
        timeLimit: 30,
        feedbackWaitTime: 5,
        explanation: 'La réponse est 6 car 3 × 2 = 6. Multiplier par 2, c\'est ajouter le nombre à lui-même : 3 + 3 = 6.'
    },
    // New questions for late-join/feedback scenarios
    {
        uid: 'q-late-1',
        text: 'What is 10 + 5?',
        answerOptions: ['12', '13', '14', '15'],
        correctAnswers: [false, false, false, true],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['arithmetic'],
        gradeLevel: 'elementary',
        tags: ['addition', 'late-join'],
        difficulty: 1,
        timeLimit: 2, // 2 seconds to answer
        feedbackWaitTime: 2 // 2 seconds feedback
    },
    {
        uid: 'q-late-2',
        text: 'What is 7 x 3?',
        answerOptions: ['20', '21', '24', '27'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'math',
        themes: ['multiplication'],
        gradeLevel: 'elementary',
        tags: ['multiplication', 'late-join'],
        difficulty: 1,
        timeLimit: 2, // 2 seconds to answer
        feedbackWaitTime: 0 // No feedback
    },
    {
        uid: 'q-1',
        text: 'What is the capital of France?',
        answerOptions: ['Berlin', 'Madrid', 'Paris', 'Rome'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'geography',
        themes: ['capitals'],
        gradeLevel: 'elementary',
        tags: ['geography', 'capitals'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-2',
        text: 'Which planet is closest to the sun?',
        answerOptions: ['Earth', 'Mars', 'Mercury', 'Venus'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['planets'],
        gradeLevel: 'elementary',
        tags: ['science', 'planets'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-3',
        text: 'What is the largest mammal in the world?',
        answerOptions: ['African Elephant', 'Blue Whale', 'Giraffe', 'Orca'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['animals'],
        gradeLevel: 'elementary',
        tags: ['science', 'animals'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-4',
        text: 'What is the boiling point of water?',
        answerOptions: ['0°C', '50°C', '100°C', '150°C'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['temperature'],
        gradeLevel: 'elementary',
        tags: ['science', 'temperature'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-5',
        text: 'Who wrote "Romeo and Juliet"?',
        answerOptions: ['Charles Dickens', 'Jane Austen', 'Mark Twain', 'William Shakespeare'],
        correctAnswers: [false, false, false, true],
        questionType: 'single_correct',
        discipline: 'literature',
        themes: ['plays'],
        gradeLevel: 'elementary',
        tags: ['literature', 'plays'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-6',
        text: 'What is the hardest natural substance on Earth?',
        answerOptions: ['Gold', 'Iron', 'Diamond', 'Platinum'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['minerals'],
        gradeLevel: 'elementary',
        tags: ['science', 'minerals'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-7',
        text: 'Which ocean is the largest?',
        answerOptions: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
        correctAnswers: [false, false, false, true],
        questionType: 'single_correct',
        discipline: 'geography',
        themes: ['oceans'],
        gradeLevel: 'elementary',
        tags: ['geography', 'oceans'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-8',
        text: 'What is the chemical symbol for gold?',
        answerOptions: ['Au', 'Ag', 'Pb', 'Fe'],
        correctAnswers: [true, false, false, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['chemistry'],
        gradeLevel: 'elementary',
        tags: ['science', 'chemistry'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-9',
        text: 'Who painted the Mona Lisa?',
        answerOptions: ['Vincent Van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'art',
        themes: ['paintings'],
        gradeLevel: 'elementary',
        tags: ['art', 'paintings'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-10',
        text: 'What is the largest planet in our solar system?',
        answerOptions: ['Earth', 'Jupiter', 'Saturn', 'Mars'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['planets'],
        gradeLevel: 'elementary',
        tags: ['science', 'planets'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-11',
        text: 'What is the main ingredient in guacamole?',
        answerOptions: ['Tomato', 'Avocado', 'Onion', 'Pepper'],
        correctAnswers: [false, true, false, false],
        questionType: 'single_correct',
        discipline: 'cooking',
        themes: ['ingredients'],
        gradeLevel: 'elementary',
        tags: ['cooking', 'ingredients'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
    },
    {
        uid: 'q-12',
        text: 'Which gas do plants absorb from the atmosphere?',
        answerOptions: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'],
        correctAnswers: [false, false, true, false],
        questionType: 'single_correct',
        discipline: 'science',
        themes: ['photosynthesis'],
        gradeLevel: 'elementary',
        tags: ['science', 'photosynthesis'],
        difficulty: 1,
        timeLimit: 5, // 5 seconds to answer
        feedbackWaitTime: 3 // 3 seconds feedback
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
