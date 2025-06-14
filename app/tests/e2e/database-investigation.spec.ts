import { test } from '@playwright/test';
import { TestDataHelper } from './helpers/test-helpers';

/**
 * Database Content Investigation
 * 
 * This test will help us understand what data actually exists in the database
 */

test.describe('Database Investigation', () => {

    test('should investigate actual database content', async ({ page }) => {
        console.log('🔍 Investigating database content...');

        // First create and authenticate a teacher
        const testData = new TestDataHelper(page);
        const teacherData = testData.generateTestData('teacher');
        const teacher = await testData.createTeacher({
            username: teacherData.username,
            email: teacherData.email,
            password: teacherData.password
        });

        await page.request.post('http://localhost:3007/api/v1/auth/login', {
            data: {
                email: teacher.email,
                password: teacher.password
            }
        });

        console.log('✅ Teacher authenticated, now testing combinations...');

        // Try to check the raw questions in the database
        // Since we can't access the questions endpoint directly, let's try different combinations

        const testCombinations = [
            // Test with variations of the names you provided
            { gradeLevel: 'elementary', discipline: 'math', themes: ['arithmetic'] },
            { gradeLevel: 'elementary', discipline: 'math', themes: ['multiplication'] },
            { gradeLevel: 'elementary', discipline: 'math', themes: ['arithmetic', 'multiplication'] },

            // Test with variations in case
            { gradeLevel: 'Elementary', discipline: 'Math', themes: ['Arithmetic'] },
            { gradeLevel: 'ELEMENTARY', discipline: 'MATH', themes: ['ARITHMETIC'] },

            // Test with original French values
            { gradeLevel: 'CP', discipline: 'Mathématiques', themes: ['addition'] },
            { gradeLevel: 'CE2', discipline: 'Mathématiques', themes: ['soustraction'] },

            // Test with single questions
            { gradeLevel: 'elementary', discipline: 'math', themes: ['arithmetic'], nbOfQuestions: 1 },
        ];

        for (const combo of testCombinations) {
            console.log(`\n🧪 Testing: ${JSON.stringify(combo)}`);

            try {
                const response = await page.request.post('http://localhost:3007/api/v1/games', {
                    data: {
                        name: `Test ${combo.themes[0]}`,
                        playMode: 'tournament',
                        ...combo,
                        nbOfQuestions: combo.nbOfQuestions || 3
                    }
                });

                console.log(`📊 Status: ${response.status()}`);

                if (response.ok()) {
                    const result = await response.json();
                    console.log(`✅ SUCCESS! Created game:`, result);
                    return; // Stop on first success
                } else {
                    const error = await response.text();
                    console.log(`❌ Error: ${error}`);
                }
            } catch (error) {
                console.log(`💥 Request failed: ${error}`);
            }
        }

        console.log('\n🔍 All combinations failed. Database may be empty or using different values.');
    });
});
