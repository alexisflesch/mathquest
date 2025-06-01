const { PrismaClient } = require('./src/db/generated/client');

async function checkQuestions() {
    const prisma = new PrismaClient();

    try {
        // Count total questions
        const totalQuestions = await prisma.question.count();
        console.log(`Total questions in database: ${totalQuestions}`);

        // Get first few questions to see their structure
        const sampleQuestions = await prisma.question.findMany({
            take: 5,
            select: {
                uid: true,
                discipline: true,
                gradeLevel: true,
                themes: true,
                tags: true,
                isHidden: true
            }
        });

        console.log('\nSample questions:');
        console.log(JSON.stringify(sampleQuestions, null, 2));

        // Check available filter values
        const disciplines = await prisma.question.findMany({
            select: { discipline: true },
            distinct: ['discipline'],
            where: { isHidden: false }
        });

        const gradeLevels = await prisma.question.findMany({
            select: { gradeLevel: true },
            distinct: ['gradeLevel'],
            where: { isHidden: false }
        });

        console.log('\nAvailable disciplines:', disciplines.map(d => d.discipline));
        console.log('Available grade levels:', gradeLevels.map(g => g.gradeLevel));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuestions();
