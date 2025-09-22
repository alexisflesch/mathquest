# Test info

- Name: API Authentication Tests >> should create student account via API
- Location: /home/aflesch/mathquest/app/tests/e2e/api-auth.spec.ts:31:9

# Error details

```
Error: apiRequestContext.post: Target page, context or browser has been closed
Call log:
  - → POST http://localhost:3007/api/v1/auth/register
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.25 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - X-Test-Environment: true
    - content-type: application/json
    - content-length: 140

    at TestDataHelper.createStudent (/home/aflesch/mathquest/app/tests/e2e/helpers/test-helpers.ts:86:50)
    at /home/aflesch/mathquest/app/tests/e2e/api-auth.spec.ts:35:40
```

# Test source

```ts
   1 | import { Page, expect } from '@playwright/test';
   2 | const prenomsData = require('/home/aflesch/mathquest/app/prenoms/prenoms.json');
   3 |
   4 | export interface TestUser {
   5 |     id?: string;
   6 |     username: string;
   7 |     email?: string;
   8 |     password?: string;
   9 |     defaultMode: 'teacher' | 'student';
   10 |     avatarEmoji?: string;
   11 | }
   12 |
   13 | export interface TestGameData {
   14 |     name: string;
   15 |     accessCode: string;
   16 |     defaultMode: 'tournament' | 'quiz' | 'practice';
   17 |     participants?: TestUser[];
   18 |     questions?: TestQuestion[];
   19 | }
   20 |
   21 | export interface TestQuestion {
   22 |     uid: string;
   23 |     text: string;
   24 |     questionType: string;
   25 |     answerOptions: string[];
   26 |     correctAnswers: number[] | boolean[];
   27 | }
   28 |
   29 | /**
   30 |  * Enhanced test data helper with comprehensive utilities
   31 |  */
   32 | export class TestDataHelper {
   33 |     constructor(private page: Page) { }
   34 |
   35 |     /**
   36 |      * Create a test teacher account with enhanced validation
   37 |      */
   38 |     async createTeacher(userData: {
   39 |         username: string;
   40 |         email: string;
   41 |         password: string;
   42 |         firstName?: string;
   43 |         lastName?: string;
   44 |     }): Promise<TestUser> {
   45 |         console.log(`🧑‍🏫 Creating test teacher: ${userData.username}`);
   46 |
   47 |         const response = await this.page.request.post('http://localhost:3007/api/v1/auth/register', {
   48 |             data: {
   49 |                 username: userData.username,
   50 |                 email: userData.email,
   51 |                 password: userData.password,
   52 |                 role: 'TEACHER',
   53 |                 adminPassword: 'abc' // Use the actual admin password from backend .env
   54 |             }
   55 |         });
   56 |
   57 |         if (!response.ok()) {
   58 |             const errorBody = await response.text();
   59 |             throw new Error(`Failed to create teacher: ${response.status()} - ${errorBody}`);
   60 |         }
   61 |
   62 |         const result = await response.json();
   63 |         console.log(`✅ Teacher created successfully: ${result.user?.id || result.user?.username || userData.username}`);
   64 |
   65 |         return {
   66 |             ...userData,
   67 |             id: result.user?.id || result.userId,
   68 |             defaultMode: 'teacher',
   69 |             avatarEmoji: '👩‍🏫'
   70 |         };
   71 |     }
   72 |
   73 |     /**
   74 |      * Create a test student account with enhanced validation
   75 |      */
   76 |     async createStudent(userData: {
   77 |         username: string;
   78 |         email?: string;
   79 |         password?: string;
   80 |         firstName?: string;
   81 |         lastName?: string;
   82 |         avatarEmoji?: string;
   83 |     }): Promise<TestUser> {
   84 |         console.log(`👨‍🎓 Creating test student: ${userData.username}`);
   85 |
>  86 |         const response = await this.page.request.post('http://localhost:3007/api/v1/auth/register', {
      |                                                  ^ Error: apiRequestContext.post: Target page, context or browser has been closed
   87 |             data: {
   88 |                 username: userData.username,
   89 |                 email: userData.email,
   90 |                 password: userData.password,
   91 |                 role: 'STUDENT',
   92 |                 avatar: userData.avatarEmoji || '🐼' // Use panda emoji as default
   93 |             }
   94 |         });
   95 |
   96 |         if (!response.ok()) {
   97 |             const errorBody = await response.text();
   98 |             throw new Error(`Failed to create student: ${response.status()} - ${errorBody}`);
   99 |         }
  100 |
  101 |         const result = await response.json();
  102 |         console.log(`✅ Student created successfully: ${result.user?.id || result.user?.username || userData.username}`);
  103 |
  104 |         return {
  105 |             ...userData,
  106 |             id: result.user?.id || result.userId,
  107 |             defaultMode: 'student',
  108 |             avatarEmoji: userData.avatarEmoji || '🐼'
  109 |         };
  110 |     }
  111 |
  112 |     /**
  113 |      * Create multiple test students for concurrent testing
  114 |      */
  115 |     async createMultipleStudents(count: number, prefix: string = 'student'): Promise<TestUser[]> {
  116 |         console.log(`👥 Creating ${count} test students...`);
  117 |
  118 |         const students: TestUser[] = [];
  119 |
  120 |         for (let i = 0; i < count; i++) {
  121 |             const userData = this.generateTestData(`${prefix}_${i}`);
  122 |             const student = await this.createStudent({
  123 |                 username: userData.username,
  124 |                 avatarEmoji: this.getRandomAvatar()
  125 |             });
  126 |             students.push(student);
  127 |         }
  128 |
  129 |         console.log(`✅ Created ${students.length} test students`);
  130 |         return students;
  131 |     }
  132 |
  133 |     /**
  134 |      * Generate comprehensive test data with realistic values
  135 |      */
  136 |     generateTestData(prefix: string = 'test') {
  137 |         const timestamp = Date.now();
  138 |         const randomNum = Math.floor(Math.random() * 1000);
  139 |
  140 |         // Pick a random valid French first name
  141 |         const randomName = prenomsData[Math.floor(Math.random() * prenomsData.length)];
  142 |
  143 |         return {
  144 |             username: randomName.toLowerCase(),
  145 |             email: `${prefix}_${timestamp}_${randomNum}@test-mathquest.com`,
  146 |             password: 'TestPassword123!',
  147 |             quizName: `${prefix}_quiz_${timestamp}`,
  148 |             tournamentName: `${prefix}_tournament_${timestamp}`,
  149 |             accessCode: this.generateAccessCode(),
  150 |             timestamp,
  151 |             randomNum
  152 |         };
  153 |     }
  154 |
  155 |     /**
  156 |      * Generate realistic access codes
  157 |      */
  158 |     generateAccessCode(): string {
  159 |         const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  160 |         let result = '';
  161 |         for (let i = 0; i < 6; i++) {
  162 |             result += chars.charAt(Math.floor(Math.random() * chars.length));
  163 |         }
  164 |         return result;
  165 |     }
  166 |
  167 |     /**
  168 |      * Generate mock questions for testing
  169 |      */
  170 |     generateMockQuestions(count: number): TestQuestion[] {
  171 |         const questions: TestQuestion[] = [];
  172 |         const mathTopics = ['algebra', 'geometry', 'calculus', 'statistics', 'arithmetic'];
  173 |
  174 |         for (let i = 0; i < count; i++) {
  175 |             const topic = mathTopics[i % mathTopics.length];
  176 |             questions.push({
  177 |                 uid: `question_${Date.now()}_${i}`,
  178 |                 text: `What is the result of ${i + 1} + ${i + 2} in ${topic}?`,
  179 |                 questionType: 'single_choice',
  180 |                 answerOptions: [
  181 |                     `${(i + 1) + (i + 2)}`, // Correct answer
  182 |                     `${(i + 1) + (i + 2) + 1}`,
  183 |                     `${(i + 1) + (i + 2) - 1}`,
  184 |                     `${(i + 1) + (i + 2) + 2}`
  185 |                 ],
  186 |                 correctAnswers: [0] // First option is correct
```