/**
 * Manual test script for GameTemplate shuffle functionality
 * 
 * Run with: npx ts-node scripts/test-shuffle.ts
 */

import { GameTemplateService } from '../src/core/services/gameTemplateService';
import { prisma } from '../src/db/prisma';

async function testShuffle() {
    console.log('🎲 Testing GameTemplate shuffle functionality...\n');

    const gameTemplateService = new GameTemplateService();
    const testUserId = 'test-student-shuffle';
    const testQuestionUids: string[] = [];

    try {
        // 1. Create or get test user
        console.log('👤 Creating test user...');
        const testUser = await prisma.user.upsert({
            where: { id: testUserId },
            update: {},
            create: {
                id: testUserId,
                username: 'ShuffleTestUser',
                role: 'STUDENT',
                studentProfile: {
                    create: {}
                }
            }
        });
        console.log('✅ Test user ready\n');

        // 2. Create test questions
        console.log('📝 Creating test questions...');
        for (let i = 1; i <= 15; i++) {
            const questionUid = `shuffle-test-${i.toString().padStart(2, '0')}`;
            
            // Check if question already exists
            const existingQuestion = await prisma.question.findUnique({
                where: { uid: questionUid }
            });
            
            if (!existingQuestion) {
                await prisma.question.create({
                    data: {
                        uid: questionUid,
                        title: `Shuffle Test Question ${i}`,
                        text: `This is shuffle test question number ${i}`,
                        questionType: 'multipleChoice',
                        gradeLevel: 'CM2',
                        discipline: 'Mathématiques',
                        themes: ['Addition', 'Test'],
                        timeLimit: 30,
                        multipleChoiceQuestion: {
                            create: {
                                answerOptions: [`A${i}`, `B${i}`, `C${i}`, `D${i}`],
                                correctAnswers: [true, false, false, false]
                            }
                        }
                    }
                });
            }
            testQuestionUids.push(questionUid);
        }
        console.log(`✅ Created/verified ${testQuestionUids.length} test questions\n`);

        // 2. Create multiple GameTemplates and check for shuffle
        console.log('🎲 Creating GameTemplates to test shuffle...');
        const templates: any[] = [];
        
        for (let i = 0; i < 3; i++) {
            const template = await gameTemplateService.createStudentGameTemplate({
                userId: testUserId,
                username: `Shuffle Test ${i + 1}`,
                gradeLevel: 'CM2',
                discipline: 'Mathématiques',
                themes: ['Addition', 'Test'],
                nbOfQuestions: 8,
                playMode: 'practice' as const
            });
            templates.push(template);
        }

        // 3. Extract and compare question sequences
        console.log('🔍 Analyzing question sequences...\n');
        const questionSequences = templates.map(template => 
            template.questions
                .sort((a: any, b: any) => a.sequence - b.sequence)
                .map((q: any) => q.questionUid.replace('shuffle-test-', ''))
        );

        questionSequences.forEach((sequence, index) => {
            console.log(`Template ${index + 1}: [${sequence.join(', ')}]`);
        });

        // 4. Check if sequences are different (shuffle working)
        const allSequencesIdentical = questionSequences.every((sequence, index) => {
            if (index === 0) return true;
            return JSON.stringify(sequence) === JSON.stringify(questionSequences[0]);
        });

        console.log('\n📊 Results:');
        if (allSequencesIdentical) {
            console.log('❌ ISSUE: All templates have identical question sequences (shuffle may not be working)');
        } else {
            console.log('✅ SUCCESS: Templates have different question sequences (shuffle is working!)');
        }

        // 5. Verify no duplicates within templates
        let hasDuplicates = false;
        questionSequences.forEach((sequence, templateIndex) => {
            const uniqueQuestions = new Set(sequence);
            if (uniqueQuestions.size !== sequence.length) {
                console.log(`❌ Template ${templateIndex + 1} has duplicate questions!`);
                hasDuplicates = true;
            }
        });

        if (!hasDuplicates) {
            console.log('✅ No duplicate questions found within templates');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // 6. Cleanup
        console.log('\n🧹 Cleaning up test data...');
        
        try {
            await prisma.questionsInGameTemplate.deleteMany({
                where: {
                    questionUid: { in: testQuestionUids }
                }
            });

            await prisma.gameTemplate.deleteMany({
                where: {
                    name: { contains: 'Shuffle Test' }
                }
            });

            await prisma.multipleChoiceQuestion.deleteMany({
                where: {
                    questionUid: { in: testQuestionUids }
                }
            });

            await prisma.question.deleteMany({
                where: {
                    uid: { in: testQuestionUids }
                }
            });

        // 7. Clean up user
        try {
            await prisma.studentProfile.delete({
                where: { id: testUserId }
            }).catch(() => {}); // Ignore if doesn't exist

            await prisma.user.delete({
                where: { id: testUserId }
            }).catch(() => {}); // Ignore if doesn't exist
        } catch (userCleanupError) {
            console.log('User cleanup skipped (may not exist)');
        }

        console.log('✅ Cleanup completed');
        } catch (cleanupError) {
            console.error('❌ Cleanup failed:', cleanupError);
        }
    }

    console.log('\n🎲 Shuffle test completed!');
}

// Run the test
testShuffle()
    .then(() => {
        console.log('Test finished successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
