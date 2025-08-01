import { PrismaClient } from '../src/db/generated/client';

const prisma = new PrismaClient();

async function migrateQuestions() {
    console.log('Starting question migration to polymorphic structure...');

    try {
        // Get all existing questions that might have been migrated but need polymorphic data
        const questions = await prisma.question.findMany();

        console.log(`Found ${questions.length} questions to potentially migrate`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const question of questions) {
            // Check if this question already has polymorphic data
            const existingMC = await prisma.multipleChoiceQuestion.findUnique({
                where: { questionUid: question.uid }
            });

            const existingNumeric = await prisma.numericQuestion.findUnique({
                where: { questionUid: question.uid }
            });

            if (existingMC || existingNumeric) {
                console.log(`Question ${question.uid} already has polymorphic data, skipping...`);
                skippedCount++;
                continue;
            }

            // Migrate based on question type
            if (question.questionType === 'multiple_choice' ||
                question.questionType === 'single_choice' ||
                question.questionType === 'multiple_choice_single_answer') {

                // For now, we'll need to handle questions without the old answer fields
                // This would typically come from a backup or legacy data
                console.log(`Creating placeholder multiple choice data for question ${question.uid}`);

                await prisma.multipleChoiceQuestion.create({
                    data: {
                        questionUid: question.uid,
                        answerOptions: ['Option A', 'Option B', 'Option C', 'Option D'],
                        correctAnswers: [true, false, false, false]
                    }
                });

                migratedCount++;
            } else if (question.questionType === 'numeric') {
                console.log(`Creating placeholder numeric data for question ${question.uid}`);

                await prisma.numericQuestion.create({
                    data: {
                        questionUid: question.uid,
                        correctAnswer: 0,
                        tolerance: 0.1,
                        unit: null
                    }
                });

                migratedCount++;
            } else {
                console.log(`Unknown question type: ${question.questionType} for question ${question.uid}`);
            }
        }

        console.log(`Migration completed! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
}

async function validateMigration() {
    console.log('Validating migration...');

    const totalQuestions = await prisma.question.count();
    const mcQuestions = await prisma.multipleChoiceQuestion.count();
    const numericQuestions = await prisma.numericQuestion.count();

    console.log(`Total questions: ${totalQuestions}`);
    console.log(`Multiple choice questions: ${mcQuestions}`);
    console.log(`Numeric questions: ${numericQuestions}`);
    console.log(`Questions with polymorphic data: ${mcQuestions + numericQuestions}`);

    if (mcQuestions + numericQuestions < totalQuestions) {
        console.warn(`Warning: ${totalQuestions - (mcQuestions + numericQuestions)} questions don't have polymorphic data`);
    }
}

async function main() {
    await migrateQuestions();
    await validateMigration();
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
