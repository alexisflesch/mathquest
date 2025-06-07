const { PrismaClient } = require('./src/db/generated/client');

async function checkQuestions() {
    const prisma = new PrismaClient();

    try {
        console.log('Checking questions in database...');
        const questions = await prisma.question.findMany({
            take: 5,
            select: {
                uid: true,
                title: true,
                text: true,
                questionType: true,
                discipline: true,
                themes: true,
                answerOptions: true,
                correctAnswers: true,
                gradeLevel: true,
                difficulty: true,
                author: true,
                explanation: true,
                timeLimit: true,
                isHidden: true,
                createdAt: true,
                updatedAt: true
            }
        });

        console.log(`Found ${questions.length} questions:`);
        questions.forEach((q, i) => {
            console.log(`\nQuestion ${i + 1}:`);
            console.log(`  uid: ${JSON.stringify(q.uid)}`);
            console.log(`  title: ${JSON.stringify(q.title)}`);
            console.log(`  text: ${JSON.stringify(q.text)}`);
            console.log(`  questionType: ${JSON.stringify(q.questionType)}`);
            console.log(`  discipline: ${JSON.stringify(q.discipline)}`);
            console.log(`  themes: ${JSON.stringify(q.themes)}`);
            console.log(`  answerOptions: ${JSON.stringify(q.answerOptions)}`);
            console.log(`  correctAnswers: ${JSON.stringify(q.correctAnswers)}`);
            console.log(`  gradeLevel: ${JSON.stringify(q.gradeLevel)}`);
            console.log(`  difficulty: ${JSON.stringify(q.difficulty)}`);
            console.log(`  author: ${JSON.stringify(q.author)}`);
            console.log(`  explanation: ${JSON.stringify(q.explanation)}`);
            console.log(`  timeLimit: ${JSON.stringify(q.timeLimit)}`);
            console.log(`  isHidden: ${JSON.stringify(q.isHidden)}`);
        });

        // Check for null values in required fields
        const badQuestions = await prisma.question.findMany({
            where: {
                OR: [
                    { text: null },
                    { questionType: null },
                    { discipline: null }
                ]
            }
        });

        if (badQuestions.length > 0) {
            console.log(`\n❌ Found ${badQuestions.length} questions with null required fields:`);
            badQuestions.forEach(q => {
                console.log(`  - ${q.uid}: text=${q.text}, questionType=${q.questionType}, discipline=${q.discipline}`);
            });
        } else {
            console.log('\n✅ No questions with null required fields found');
        }

    } catch (error) {
        console.error('Error checking questions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuestions();
