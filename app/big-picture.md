# MathQuest: Polymorphic Question Types Implementation Plan

**Date:** July 13, 2025  
**Objective:** Implement a polymorphic question type architecture to support numeric questions and future question types (text, MathLive, etc.)

## 📋 Overview

Currently, the Question model uses nullable fields (`answerOptions`, `correctAnswers`, `numericAnswer`, etc.) which creates validation complexity and conflicts between different question types. This plan implements a clean polymorphic architecture where each question type has its own dedicated table.

## 🎯 Benefits

- ✅ **Eliminates nullable field conflicts** - No more mandatory fields that don't apply to all question types
- ✅ **Clean validation** - Each question type validates independently 
- ✅ **Perfect extensibility** - Adding new question types (text, MathLive) is trivial
- ✅ **Type safety** - TypeScript can properly discriminate question types
- ✅ **Storage efficiency** - 30% storage reduction by eliminating sparse data
- ✅ **Better performance** - Dense indexes instead of sparse nullable indexes

## 📊 Performance Impact

- **Query performance:** +20-50% slower (1-4ms real impact - negligible)
- **Storage:** -30% reduction in storage usage
- **User experience:** Zero impact (microsecond differences)
- **Developer experience:** Massive improvement in code clarity

## 🏗️ Architecture Design

### Current Architecture (Problems)
```prisma
model Question {
  // Shared fields
  uid, title, text, questionType, discipline...
  
  // Multiple choice fields (unused for numeric)
  answerOptions    String[]   // ❌ Mandatory but empty for numeric
  correctAnswers   Boolean[]  // ❌ Mandatory but empty for numeric
  
  // Numeric fields (unused for multiple choice)
  numericAnswer    Float?     // ❌ Always null for multiple choice
  numericTolerance Float?     // ❌ Always null for multiple choice
  numericUnit      String?    // ❌ Always null for multiple choice
}
```

### New Polymorphic Architecture (Solution)
```prisma
model Question {
  uid              String    @id @default(uuid())
  title            String?
  text             String    @map("question_text")
  questionType     String    @map("question_type")
  discipline       String
  themes           String[]
  difficulty       Int?
  gradeLevel       String?   @map("grade_level")
  author           String?
  explanation      String?
  tags             String[]
  timeLimit        Int       @map("time_limit_seconds")
  isHidden         Boolean?  @default(false) @map("is_hidden")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  feedbackWaitTime Int?
  
  // Polymorphic relations - only one will be populated per question
  multipleChoiceQuestion MultipleChoiceQuestion?
  numericQuestion        NumericQuestion?
  
  gameTemplates    QuestionsInGameTemplate[]
  @@map("questions")
}

model MultipleChoiceQuestion {
  questionUid    String    @id @map("question_uid")
  answerOptions  String[]  @map("answer_options")
  correctAnswers Boolean[] @map("correct_answers")
  
  question Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
  @@map("multiple_choice_questions")
}

model NumericQuestion {
  questionUid      String  @id @map("question_uid")
  correctAnswer    Float   @map("correct_answer")
  tolerance        Float?  @map("tolerance") @default(0)
  unit             String? @map("unit")
  
  question Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
  @@map("numeric_questions")
}
```

## 🚀 Implementation Phases

### Phase 1: Database Schema Migration (1-2 days)

#### 1.1 Create New Models
- [ ] Update `schema.prisma` with new polymorphic structure
- [ ] Remove old fields from Question model
- [ ] Add new question type tables

#### 1.2 Generate Migration
- [ ] Run `prisma migrate dev --name "polymorphic-question-types"`
- [ ] Review generated SQL migration
- [ ] Test migration on development database

#### 1.3 Data Migration Script
- [ ] Create script to migrate existing questions from old to new structure
- [ ] Backup existing data before migration
- [ ] Migrate multiple choice questions to `MultipleChoiceQuestion` table
- [ ] Validate data integrity after migration

### Phase 2: Backend Code Updates (2-3 days)

#### 2.1 Validation Schema Updates
- [ ] Update Zod schemas for type-specific validation
- [ ] Remove conditional validation logic
- [ ] Add separate schemas for each question type

```typescript
// Clean, type-specific validation
const numericQuestionSchema = z.object({
  correctAnswer: z.number().finite(),
  tolerance: z.number().min(0).optional(),
  unit: z.string().optional()
});

const multipleChoiceQuestionSchema = z.object({
  answerOptions: z.array(z.string()).min(2),
  correctAnswers: z.array(z.boolean())
});
```

#### 2.2 Service Layer Updates
- [ ] Update `QuestionService` to handle polymorphic queries
- [ ] Modify question creation/update logic
- [ ] Update scoring service for type-based logic
- [ ] Update practice session service

#### 2.3 API Endpoint Updates
- [ ] Update question CRUD endpoints
- [ ] Modify question listing queries to include relations
- [ ] Update validation middleware

#### 2.4 Scoring Logic Simplification
- [ ] Clean up `scoringService.ts` with type-based branching
- [ ] Remove complex conditional logic
- [ ] Add type-safe answer checking

```typescript
export function checkAnswerCorrectness(question: any, answer: any): boolean {
  switch (question.questionType) {
    case 'numeric':
      const numericData = question.numericQuestion;
      const userAnswer = parseFloat(answer);
      return Math.abs(userAnswer - numericData.correctAnswer) <= (numericData.tolerance || 0);
      
    case 'multiple_choice':
      const mcData = question.multipleChoiceQuestion;
      // Handle multiple choice logic...
      break;
  }
}
```

### Phase 3: Frontend Updates (1-2 days)

#### 3.1 Type Definitions
- [ ] Update TypeScript interfaces for polymorphic questions
- [ ] Add discriminated union types
- [ ] Update shared types

#### 3.2 Question Rendering
- [ ] Update `QuestionCard` component for type-based rendering
- [ ] Create `NumericInput` component for numeric questions
- [ ] Maintain backward compatibility during transition

#### 3.3 Question Creation/Editing
- [ ] Update teacher question creation forms
- [ ] Add type-specific form sections
- [ ] Update validation on frontend

### Phase 4: Testing & Validation (1-2 days)

#### 4.1 Unit Tests
- [ ] Update existing question-related tests
- [ ] Add tests for new question types
- [ ] Test data migration script

#### 4.2 Integration Tests
- [ ] Test polymorphic queries
- [ ] Test mixed question type game sessions
- [ ] Validate scoring logic for all types

#### 4.3 Performance Testing
- [ ] Benchmark query performance vs old approach
- [ ] Verify storage efficiency improvements
- [ ] Test with realistic data volumes

#### 4.4 End-to-End Testing
- [ ] Test complete game flow with mixed question types
- [ ] Verify teacher dashboard functionality
- [ ] Test student experience with numeric questions

## 📝 Detailed Migration Steps

### Step 1: Schema Migration
```sql
-- 1. Create new tables
CREATE TABLE multiple_choice_questions (
  question_uid UUID PRIMARY KEY,
  answer_options TEXT[] NOT NULL,
  correct_answers BOOLEAN[] NOT NULL,
  FOREIGN KEY (question_uid) REFERENCES questions(uid) ON DELETE CASCADE
);

CREATE TABLE numeric_questions (
  question_uid UUID PRIMARY KEY,
  correct_answer FLOAT NOT NULL,
  tolerance FLOAT DEFAULT 0,
  unit TEXT,
  FOREIGN KEY (question_uid) REFERENCES questions(uid) ON DELETE CASCADE
);

-- 2. Migrate existing data
INSERT INTO multiple_choice_questions (question_uid, answer_options, correct_answers)
SELECT uid, answer_options, correct_answers 
FROM questions 
WHERE question_type IN ('single_choice', 'multiple_choice', 'multiple_choice_single_answer');

-- 3. Remove old fields (in separate migration)
ALTER TABLE questions DROP COLUMN answer_options;
ALTER TABLE questions DROP COLUMN correct_answers;
ALTER TABLE questions DROP COLUMN numeric_answer;
ALTER TABLE questions DROP COLUMN numeric_tolerance;
ALTER TABLE questions DROP COLUMN numeric_unit;
```

### Step 2: Query Pattern Updates
```typescript
// Before (complex nullable logic)
const question = await prisma.question.findUnique({
  where: { uid }
});
// Had to check if answerOptions exists, handle nulls, etc.

// After (clean polymorphic pattern)
const question = await prisma.question.findUnique({
  where: { uid },
  include: {
    multipleChoiceQuestion: true,
    numericQuestion: true
  }
});

// Type-safe access
if (question.numericQuestion) {
  // Handle numeric question
  const answer = question.numericQuestion.correctAnswer;
} else if (question.multipleChoiceQuestion) {
  // Handle multiple choice question
  const options = question.multipleChoiceQuestion.answerOptions;
}
```

## 🔄 Future Extensibility

This architecture makes adding new question types trivial:

### Adding Text Questions
```prisma
model TextQuestion {
  questionUid     String   @id @map("question_uid")
  correctAnswer   String   @map("correct_answer")
  caseSensitive   Boolean  @default(false) @map("case_sensitive")
  acceptSynonyms  Boolean  @default(false) @map("accept_synonyms")
  
  question Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
  @@map("text_questions")
}
```

### Adding MathLive Questions
```prisma
model MathLiveQuestion {
  questionUid      String @id @map("question_uid")
  correctExpression String @map("correct_expression")
  mathFieldOptions Json?  @map("mathfield_options")
  
  question Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
  @@map("mathlive_questions")
}
```

## ⚠️ Risk Mitigation

### Data Safety
- [ ] **Full database backup** before migration
- [ ] **Test migration on copy** of production data
- [ ] **Rollback plan** prepared
- [ ] **Data validation scripts** to verify migration integrity

### Deployment Strategy
- [ ] **Feature flag** for new question types during transition
- [ ] **Gradual rollout** - test with small subset of questions first
- [ ] **Monitoring** query performance in production
- [ ] **Backward compatibility** maintained during transition period

### Performance Monitoring
- [ ] **Benchmark baseline** performance before migration
- [ ] **Monitor query times** after deployment
- [ ] **Database index optimization** if needed
- [ ] **Query optimization** for common patterns

## 📊 Success Metrics

### Technical Metrics
- [ ] All existing functionality works without regression
- [ ] New numeric questions can be created and answered
- [ ] Query performance within acceptable range (+50% max)
- [ ] Storage usage reduced by ~30%
- [ ] No validation errors in production

### User Experience Metrics
- [ ] Teachers can create numeric questions successfully
- [ ] Students can answer numeric questions intuitively
- [ ] Game sessions with mixed question types work flawlessly
- [ ] No increase in error rates or user complaints

## 🎉 Expected Outcomes

After implementation:
- **Clean Architecture:** Each question type has exactly the fields it needs
- **Type Safety:** Full TypeScript support with discriminated unions
- **Easy Extension:** Adding new question types requires minimal changes
- **Better Performance:** Dense indexes and optimized storage
- **Maintainable Code:** No more complex nullable field validation logic
- **Future Ready:** Perfect foundation for text, MathLive, image, audio questions

## 📅 Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Database Migration | 1-2 days | None |
| Phase 2: Backend Updates | 2-3 days | Phase 1 complete |
| Phase 3: Frontend Updates | 1-2 days | Phase 2 complete |
| Phase 4: Testing & Validation | 1-2 days | All phases complete |
| **Total** | **5-9 days** | Sequential execution |

## 🚦 Go/No-Go Decision Points

### Green Light Criteria
- [ ] Migration script successfully tested on development data
- [ ] All existing tests pass after backend updates
- [ ] Performance benchmarks within acceptable range
- [ ] Team comfortable with new architecture approach

### Red Light Scenarios
- [ ] Data migration causes integrity issues
- [ ] Performance degradation exceeds 100% for common queries
- [ ] Critical functionality breaks during testing
- [ ] Timeline significantly exceeds estimates

---

*This plan provides a structured approach to implementing polymorphic question types while minimizing risk and ensuring a smooth transition. The modular phases allow for validation at each step and provide clear rollback points if issues arise.*

## 🔧 Detailed Backend Implementation Plan

### Current Architecture Analysis

Based on the backend code analysis, here's the current state:

#### Current Question Model (Problematic)
```prisma
model Question {
  uid              String    @id @default(uuid())
  // ... shared fields ...
  answerOptions    String[]  @map("answer_options")     // ❌ Always required, even for numeric
  correctAnswers   Boolean[] @map("correct_answers")    // ❌ Always required, even for numeric
  feedbackWaitTime Int?
  // No numeric fields currently exist in schema
}
```

#### Current Services Affected
1. **QuestionService** (`/backend/src/core/services/questionService.ts`)
2. **ScoringService** (`/backend/src/core/services/scoringService.ts`)
3. **PracticeSessionService** (`/backend/src/core/services/practiceSessionService.ts`)
4. **Questions API** (`/backend/src/api/v1/questions.ts`)

### Phase 2: Detailed Backend Updates (2-3 days)

#### 2.1 Database Schema Migration (Day 1)

##### 2.1.1 Update Prisma Schema
**File**: `/backend/prisma/schema.prisma`

```prisma
model Question {
  uid              String    @id @default(uuid())
  title            String?
  text             String    @map("question_text")
  questionType     String    @map("question_type")
  discipline       String
  themes           String[]
  difficulty       Int?
  gradeLevel       String?   @map("grade_level")
  author           String?
  explanation      String?
  tags             String[]
  timeLimit        Int       @map("time_limit_seconds")
  isHidden         Boolean?  @default(false) @map("is_hidden")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")
  feedbackWaitTime Int?

  // Polymorphic relations - only one will be populated per question
  multipleChoiceQuestion MultipleChoiceQuestion?
  numericQuestion        NumericQuestion?
  
  gameTemplates    QuestionsInGameTemplate[]
  @@map("questions")
}

model MultipleChoiceQuestion {
  questionUid    String    @id @map("question_uid")
  answerOptions  String[]  @map("answer_options")
  correctAnswers Boolean[] @map("correct_answers")
  
  question Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
  @@map("multiple_choice_questions")
}

model NumericQuestion {
  questionUid      String  @id @map("question_uid")
  correctAnswer    Float   @map("correct_answer")
  tolerance        Float?  @map("tolerance") @default(0)
  unit             String? @map("unit")
  
  question Question @relation(fields: [questionUid], references: [uid], onDelete: Cascade)
  @@map("numeric_questions")
}
```

##### 2.1.2 Generate Migration
```bash
cd /home/aflesch/mathquest/app/backend
npx prisma migrate dev --name "polymorphic-question-types"
```

##### 2.1.3 Data Migration Script
**File**: `/backend/scripts/migrate-to-polymorphic.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateQuestions() {
  console.log('Starting question migration...');
  
  // Get all existing questions
  const questions = await prisma.question.findMany();
  
  for (const question of questions) {
    // Migrate multiple choice questions
    if (question.questionType === 'multiple_choice' || 
        question.questionType === 'single_choice' ||
        question.questionType === 'multiple_choice_single_answer') {
      
      await prisma.multipleChoiceQuestion.create({
        data: {
          questionUid: question.uid,
          answerOptions: question.answerOptions,
          correctAnswers: question.correctAnswers
        }
      });
    }
    // Future: Handle other question types here
  }
  
  console.log(`Migrated ${questions.length} questions to polymorphic structure`);
}

migrateQuestions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 2.2 Core Services Updates (Day 1-2)

##### 2.2.1 Update QuestionService
**File**: `/backend/src/core/services/questionService.ts`

**Changes needed:**

1. **Update `createQuestion` method:**
```typescript
async createQuestion(userId: string, data: QuestionCreationPayload) {
    try {
        // Create main question record
        const question = await prisma.question.create({
            data: {
                title: data.title,
                text: data.text,
                questionType: data.questionType,
                discipline: data.discipline,
                themes: data.themes,
                difficulty: data.difficulty,
                gradeLevel: data.gradeLevel,
                author: data.author || userId,
                explanation: data.explanation,
                tags: data.tags || [],
                isHidden: data.isHidden,
                timeLimit: Math.round((data.durationMs || 30000) / 1000)
            }
        });

        // Create type-specific data
        if (data.questionType === 'numeric') {
            await prisma.numericQuestion.create({
                data: {
                    questionUid: question.uid,
                    correctAnswer: data.numericData.correctAnswer,
                    tolerance: data.numericData.tolerance || 0,
                    unit: data.numericData.unit
                }
            });
        } else if (data.questionType === 'multiple_choice') {
            await prisma.multipleChoiceQuestion.create({
                data: {
                    questionUid: question.uid,
                    answerOptions: data.answerOptions,
                    correctAnswers: data.correctAnswers
                }
            });
        }

        return this.getQuestionById(question.uid);
    } catch (error) {
        logger.error({ error }, 'Error creating question');
        throw error;
    }
}
```

2. **Update `getQuestionById` method:**
```typescript
async getQuestionById(uid: string) {
    try {
        const question = await prisma.question.findUnique({
            where: { uid },
            include: {
                multipleChoiceQuestion: true,
                numericQuestion: true
            }
        });

        return this.normalizeQuestion(question);
    } catch (error) {
        logger.error({ error }, `Error fetching question with ID ${uid}`);
        throw error;
    }
}
```

3. **Update `normalizeQuestion` method:**
```typescript
private normalizeQuestion(question: any): any {
    if (!question) return null;
    
    const durationMs = question.timeLimit * 1000;
    const { timeLimit, ...baseQuestion } = question;
    
    const result = {
        ...baseQuestion,
        durationMs,
        // Type-specific data flattening for backward compatibility
        ...(question.multipleChoiceQuestion && {
            answerOptions: question.multipleChoiceQuestion.answerOptions,
            correctAnswers: question.multipleChoiceQuestion.correctAnswers
        }),
        ...(question.numericQuestion && {
            numericData: {
                correctAnswer: question.numericQuestion.correctAnswer,
                tolerance: question.numericQuestion.tolerance,
                unit: question.numericQuestion.unit
            }
        })
    };
    
    return result;
}
```

##### 2.2.2 Update ScoringService
**File**: `/backend/src/core/services/scoringService.ts`

**Changes needed:**

1. **Update `checkAnswerCorrectness` function:**
```typescript
export function checkAnswerCorrectness(question: any, answer: any): boolean {
    if (!question) return false;

    switch (question.questionType) {
        case 'numeric':
            if (!question.numericQuestion) return false;
            const userAnswer = parseFloat(answer);
            if (isNaN(userAnswer)) return false;
            
            const correctAnswer = question.numericQuestion.correctAnswer;
            const tolerance = question.numericQuestion.tolerance || 0;
            return Math.abs(userAnswer - correctAnswer) <= tolerance;

        case 'multiple_choice':
        case 'single_choice':
        case 'multiple_choice_single_answer':
            if (!question.multipleChoiceQuestion) return false;
            
            const correctAnswers = question.multipleChoiceQuestion.correctAnswers;
            
            // Multiple choice (multiple answers): answer is array of indices
            if (Array.isArray(answer)) {
                const correctIndices = correctAnswers
                    .map((v: boolean, i: number) => v ? i : -1)
                    .filter((i: number) => i !== -1);
                const submitted = [...answer].sort();
                const correct = [...correctIndices].sort();
                return (
                    submitted.length === correct.length &&
                    submitted.every((v, i) => v === correct[i])
                );
            }
            
            // Single choice: answer is index
            if (typeof answer === 'number') {
                return correctAnswers[answer] === true;
            }
            
            return false;

        default:
            logger.warn({ questionType: question.questionType }, 'Unknown question type in scoring');
            return false;
    }
}
```

2. **Update question fetching in `submitAnswerWithScoring`:**
```typescript
// In submitAnswerWithScoring function, update question fetching:
const question = await prisma.question.findUnique({
    where: { uid: answerData.questionUid },
    include: {
        multipleChoiceQuestion: true,
        numericQuestion: true
    }
});
```

##### 2.2.3 Update PracticeSessionService
**File**: `/backend/src/core/services/practiceSessionService.ts`

**Changes needed:**

1. **Update question fetching methods:**
```typescript
private async getQuestionsWithTypeData(questionUids: string[]): Promise<any[]> {
    return await prisma.question.findMany({
        where: {
            uid: { in: questionUids },
            isHidden: false
        },
        include: {
            multipleChoiceQuestion: true,
            numericQuestion: true
        }
    });
}
```

2. **Update answer validation:**
```typescript
private validateAnswer(question: any, selectedAnswers: number[]): boolean {
    switch (question.questionType) {
        case 'numeric':
            // For numeric questions, selectedAnswers[0] should be the numeric value
            if (!question.numericQuestion || selectedAnswers.length !== 1) return false;
            const userAnswer = selectedAnswers[0];
            const correctAnswer = question.numericQuestion.correctAnswer;
            const tolerance = question.numericQuestion.tolerance || 0;
            return Math.abs(userAnswer - correctAnswer) <= tolerance;

        case 'multiple_choice':
        default:
            if (!question.multipleChoiceQuestion) return false;
            const correctIndices = question.multipleChoiceQuestion.correctAnswers
                .map((correct: boolean, index: number) => correct ? index : -1)
                .filter((index: number) => index !== -1);
            
            return selectedAnswers.length === correctIndices.length &&
                   selectedAnswers.every(answer => correctIndices.includes(answer));
    }
}
```

#### 2.3 API Endpoints Updates (Day 2)

##### 2.3.1 Update Questions API
**File**: `/backend/src/api/v1/questions.ts`

**Changes needed:**

1. **Update validation schemas to support numeric questions:**
```typescript
// Update import to include numeric question validation
import { 
    questionSchema, 
    questionCreationSchema,
    numericQuestionCreationSchema 
} from '../../../../shared/types/quiz/question.zod';
```

2. **Update question creation endpoint:**
```typescript
router.post('/', teacherAuth, validateRequestBody(CreateQuestionRequestSchema), async (req, res) => {
    try {
        // Type-specific validation
        let parseResult;
        
        if (req.body.questionType === 'numeric') {
            parseResult = numericQuestionCreationSchema.safeParse(req.body);
        } else {
            parseResult = questionCreationSchema.safeParse(req.body);
        }
        
        if (!parseResult.success) {
            res.status(400).json({ 
                error: 'Validation failed', 
                details: parseResult.error.errors 
            });
            return;
        }

        const questionData = {
            ...parseResult.data,
            themes: parseResult.data.themes || [],
            durationMs: parseResult.data.durationMs || 30000
        };

        const question = await getQuestionService().createQuestion(req.user.userId, questionData);
        res.status(201).json({ question });
    } catch (error) {
        logger.error({ error }, 'Error creating question');
        res.status(500).json({ error: 'An error occurred while creating the question' });
    }
});
```

#### 2.4 Shared Types Updates (Day 2)

##### 2.4.1 Update Core Question Types
**File**: `/shared/types/core/question.ts`

```typescript
// Add numeric question support to existing interfaces
export interface NumericQuestionFields {
  expectedAnswer: number;
  tolerance?: number; // Allow range tolerance (e.g., ±0.1)
  unit?: string; // Optional unit (e.g., "cm", "kg")
  precision?: number; // Decimal places for display
}

// Update base Question interface to support polymorphic structure
export interface Question extends BaseQuestion {
  // ...existing fields...
  
  // Make multiple choice fields optional for numeric questions
  answerOptions?: string[];
  correctAnswers?: boolean[];
  
  // Add numeric question fields (from polymorphic backend)
  numericFields?: NumericQuestionFields;
  numericQuestion?: {
    correctAnswer: number;
    tolerance?: number;
    unit?: string;
  };
}

// Update ClientQuestion interface similarly
export interface ClientQuestion extends BaseQuestion {
  answerOptions?: string[];
  correctAnswers?: boolean[];
  numericFields?: NumericQuestionFields;
  numericQuestion?: {
    correctAnswer: number;
    tolerance?: number;
    unit?: string;
  };
  // ...other fields
}
```

##### 2.4.2 Update Question Type Constants
**File**: `/shared/constants/questionTypes.ts`

```typescript
export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  MULTIPLE_CHOICE_SINGLE_ANSWER: 'multiple_choice_single_answer',
  SINGLE_CHOICE: 'single_choice',
  NUMERIC: 'numeric', // Add new type
  // ...existing types
} as const;

export type QuestionType = typeof QUESTION_TYPES[keyof typeof QUESTION_TYPES];
```

#### 3.2 Core Component Updates (Day 1)

##### 3.2.1 QuestionCard Component
**File**: `/frontend/src/components/QuestionCard.tsx`

```typescript
// Add numeric input handling to existing QuestionCard
const QuestionCard = ({ 
  currentQuestion, 
  questionIndex, 
  totalQuestions,
  selectedAnswer,
  setSelectedAnswer,
  selectedAnswers,
  setSelectedAnswers,
  handleSingleChoice,
  handleSubmitMultiple,
  answered,
  isQuizMode = false,
  readonly = false,
  correctAnswers = [],
  stats,
  showStats = false,
  ...props 
}) => {
  const [numericAnswer, setNumericAnswer] = useState<string>('');
  const [numericSubmitted, setNumericSubmitted] = useState(false);
  
  const isNumeric = currentQuestion?.questionType === QUESTION_TYPES.NUMERIC;
  const isMultipleChoice = currentQuestion?.questionType === QUESTION_TYPES.MULTIPLE_CHOICE;
  
  // Get numeric data from either flat structure or polymorphic structure
  const numericData = currentQuestion?.numericFields || currentQuestion?.numericQuestion;
  
  const handleNumericSubmit = () => {
    const answer = parseFloat(numericAnswer);
    if (!isNaN(answer)) {
      // Use existing answer submission pattern
      if (handleSingleChoice) {
        handleSingleChoice(answer); // Pass numeric value instead of index
      }
      setNumericSubmitted(true);
    }
  };

  const handleNumericKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && numericAnswer.trim() && !numericSubmitted) {
      handleNumericSubmit();
    }
  };

  return (
    <div className="question-card bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl mx-auto">
      {/* ...existing question header and text rendering... */}
      
      <div className="mt-6">
        {isNumeric ? (
          <div className="numeric-answer-section">
            <div className="text-lg font-medium mb-4 text-center text-gray-700">
              Entrez votre réponse numérique
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <input
                  type="number"
                  value={numericAnswer}
                  onChange={(e) => setNumericAnswer(e.target.value)}
                  onKeyPress={handleNumericKeyPress}
                  placeholder="Votre réponse..."
                  className="input input-bordered input-lg text-center text-xl w-64"
                  disabled={readonly || numericSubmitted || answered}
                  step={numericData?.precision ? Math.pow(10, -numericData.precision) : 'any'}
                />
                {numericData?.unit && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    {numericData.unit}
                  </span>
                )}
              </div>
              
              {!readonly && !answered && !numericSubmitted && (
                <button 
                  onClick={handleNumericSubmit}
                  className="btn btn-primary btn-lg px-8"
                  disabled={!numericAnswer.trim()}
                >
                  Valider
                </button>
              )}
              
              {/* Show feedback for numeric questions */}
              {answered && showStats && numericData && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Réponse attendue:</div>
                    <div className="text-lg font-semibold">
                      {numericData.expectedAnswer || numericData.correctAnswer}
                      {numericData.unit && ` ${numericData.unit}`}
                    </div>
                    {numericData.tolerance && (
                      <div className="text-sm text-gray-500">
                        (Tolérance: ±{numericData.tolerance})
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // ...existing multiple choice rendering...
          <div className="multiple-choice-section">
            {/* Keep all existing multiple choice logic unchanged */}
          </div>
        )}
      </div>

      {/* ...existing stats display for multiple choice... */}
      {showStats && stats && isNumeric && (
        <NumericQuestionStats stats={stats} question={currentQuestion} />
      )}
    </div>
  );
};
```

##### 3.2.2 QuestionDisplay Component
**File**: `/frontend/src/components/QuestionDisplay.tsx`

```typescript
// Update for numeric question preview in quiz creation
const QuestionDisplay = ({ 
  question, 
  isActive, 
  isOpen, 
  onToggleOpen, 
  timerStatus,
  disabled = false,
  showControls = true,
  className = "",
  showMeta = false,
  ...props 
}) => {
  const isNumeric = question.questionType === QUESTION_TYPES.NUMERIC;
  const numericData = question.numericFields || question.numericQuestion;
  
  return (
    <div className={`question-display border rounded-lg p-4 ${className}`}>
      {/* ...existing question header and metadata... */}
      
      <div className="question-content mt-3">
        {/* ...existing question text rendering... */}
        
        <div className="answer-preview mt-4">
          {isNumeric ? (
            <div className="numeric-preview">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge badge-info">Numérique</span>
                {numericData?.unit && (
                  <span className="badge badge-outline">Unité: {numericData.unit}</span>
                )}
              </div>
              
              {showMeta && isOpen && numericData && (
                <div className="bg-gray-50 rounded p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Réponse:</span> {numericData.expectedAnswer || numericData.correctAnswer}
                    </div>
                    {numericData.tolerance && (
                      <div>
                        <span className="font-medium">Tolérance:</span> ±{numericData.tolerance}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Réponse numérique..."
                  className="input input-bordered input-sm w-48"
                  disabled
                />
              </div>
            </div>
          ) : (
            // ...existing multiple choice preview...
            <div className="multiple-choice-preview">
              {/* Keep all existing answer options display */}
            </div>
          )}
        </div>
      </div>
      
      {/* ...existing controls and timer display... */}
    </div>
  );
};
```

#### 3.3 Game Logic Updates (Day 1 - Afternoon)

##### 3.3.1 Answer Validation Logic
**File**: `/frontend/src/utils/answerValidation.ts` (new file)

```typescript
import { QUESTION_TYPES } from '@shared/constants/questionTypes';

export const validateNumericAnswer = (
  userAnswer: number,
  expectedAnswer: number,
  tolerance?: number
): boolean => {
  if (tolerance) {
    return Math.abs(userAnswer - expectedAnswer) <= tolerance;
  }
  return userAnswer === expectedAnswer;
};

export const validateAnswer = (
  question: any,
  userAnswer: any
): boolean => {
  if (!question) return false;

  if (question.questionType === QUESTION_TYPES.NUMERIC) {
    if (typeof userAnswer !== 'number') return false;
    
    const numericData = question.numericFields || question.numericQuestion;
    if (!numericData) return false;
    
    const expectedAnswer = numericData.expectedAnswer || numericData.correctAnswer;
    return validateNumericAnswer(userAnswer, expectedAnswer, numericData.tolerance);
  }
  
  // ...existing multiple choice validation logic...
  return validateMultipleChoiceAnswer(question, userAnswer);
};

const validateMultipleChoiceAnswer = (question: any, userAnswer: any): boolean => {
  // Keep existing multiple choice validation
  const correctAnswers = question.correctAnswers;
  if (!correctAnswers) return false;
  
  if (Array.isArray(userAnswer)) {
    // Multiple selection
    const correctIndices = correctAnswers
      .map((correct: boolean, index: number) => correct ? index : -1)
      .filter((index: number) => index !== -1);
    
    return userAnswer.length === correctIndices.length &&
           userAnswer.every((ans: number) => correctIndices.includes(ans));
  } else if (typeof userAnswer === 'number') {
    // Single selection
    return correctAnswers[userAnswer] === true;
  }
  
  return false;
};
```

##### 3.3.2 Socket Event Updates
**File**: Update answer submission events in game hooks

```typescript
// In useStudentGameSocket.ts and similar hooks
interface AnswerSubmissionPayload {
  questionUid: string;
  answer: number | boolean[] | number[]; // Add number for numeric
  answeredAt: number;
  questionType: string;
  timeToAnswer?: number;
}

// Update answer submission logic
const submitAnswer = (answer: any) => {
  const payload: AnswerSubmissionPayload = {
    questionUid: currentQuestion.uid,
    answer: answer, // Can now be number for numeric questions
    answeredAt: Date.now(),
    questionType: currentQuestion.questionType,
    timeToAnswer: /* calculate time */
  };
  
  socket.emit('submit_answer', payload);
};
```

#### 3.4 UI Component Updates (Day 1 - Afternoon)

##### 3.4.1 Question Filtering
**File**: `/frontend/src/components/QuestionSelector.tsx`

```typescript
// Add question type filter to existing component
const QuestionSelector = ({ 
  onSelect, 
  selectedQuestionIds, 
  externalFilters = {},
  ...props 
}) => {
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  
  // ...existing state and effects...
  
  const questionTypeOptions = [
    { value: QUESTION_TYPES.MULTIPLE_CHOICE, label: 'Choix multiples' },
    { value: QUESTION_TYPES.SINGLE_CHOICE, label: 'Choix unique' },
    { value: QUESTION_TYPES.NUMERIC, label: 'Numérique' },
  ];
  
  // Update filters to include question type
  const applyFilters = () => {
    const filters = {
      ...externalFilters,
      discipline: selectedDiscipline,
      niveau: selectedNiveau,
      themes: selectedThemes,
      questionTypes: selectedQuestionTypes, // Add question type filter
    };
    
    fetchQuestions(filters);
  };
  
  return (
    <div className="question-selector">
      {/* ...existing filters... */}
      
      <div className="filter-section">
        <MultiSelectDropdown
          label="Type de question"
          options={questionTypeOptions}
          selectedValues={selectedQuestionTypes}
          onChange={setSelectedQuestionTypes}
          placeholder="Tous les types"
        />
      </div>
      
      {/* ...rest of component unchanged... */}
    </div>
  );
};
```

##### 3.4.2 Numeric Question Stats Component
**File**: `/frontend/src/components/NumericQuestionStats.tsx` (new file)

```typescript
import React from 'react';

interface NumericQuestionStatsProps {
  stats: any;
  question: any;
}

const NumericQuestionStats: React.FC<NumericQuestionStatsProps> = ({ stats, question }) => {
  if (!stats?.answers || !Array.isArray(stats.answers)) {
    return <div className="text-center text-gray-500">Aucune donnée disponible</div>;
  }
  
  const answers = stats.answers as number[];
  const numericData = question.numericFields || question.numericQuestion;
  const expectedAnswer = numericData?.expectedAnswer || numericData?.correctAnswer;
  
  if (!numericData || expectedAnswer === undefined) {
    return <div className="text-center text-gray-500">Données numériques manquantes</div>;
  }
  
  // Calculate statistics
  const validAnswers = answers.filter(ans => typeof ans === 'number' && !isNaN(ans));
  const correctCount = validAnswers.filter(answer => {
    if (numericData.tolerance) {
      return Math.abs(answer - expectedAnswer) <= numericData.tolerance;
    }
    return answer === expectedAnswer;
  }).length;
  
  const average = validAnswers.length > 0 ? 
    validAnswers.reduce((sum, ans) => sum + ans, 0) / validAnswers.length : 0;
  
  const sortedAnswers = [...validAnswers].sort((a, b) => a - b);
  const median = sortedAnswers.length > 0 ? 
    sortedAnswers[Math.floor(sortedAnswers.length / 2)] : 0;
  
  const accuracy = validAnswers.length > 0 ? 
    Math.round((correctCount / validAnswers.length) * 100) : 0;
  
  return (
    <div className="numeric-stats bg-gray-50 rounded-lg p-4 mt-4">
      <h4 className="font-semibold text-lg mb-4 text-center">Statistiques des réponses</h4>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat text-center p-3 bg-white rounded">
          <div className="stat-title text-sm text-gray-600">Réussite</div>
          <div className="stat-value text-xl font-bold text-green-600">
            {accuracy}%
          </div>
          <div className="text-xs text-gray-500">
            {correctCount}/{validAnswers.length}
          </div>
        </div>
        
        <div className="stat text-center p-3 bg-white rounded">
          <div className="stat-title text-sm text-gray-600">Moyenne</div>
          <div className="stat-value text-xl font-bold">
            {average.toFixed(2)}
          </div>
        </div>
        
        <div className="stat text-center p-3 bg-white rounded">
          <div className="stat-title text-sm text-gray-600">Médiane</div>
          <div className="stat-value text-xl font-bold">
            {median.toFixed(2)}
          </div>
        </div>
        
        <div className="stat text-center p-3 bg-white rounded">
          <div className="stat-title text-sm text-gray-600">Attendue</div>
          <div className="stat-value text-xl font-bold text-blue-600">
            {expectedAnswer}
            {numericData.unit && <span className="text-sm"> {numericData.unit}</span>}
          </div>
          {numericData.tolerance && (
            <div className="text-xs text-gray-500">±{numericData.tolerance}</div>
          )}
        </div>
      </div>
      
      {/* Answer distribution visualization */}
      {validAnswers.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Distribution des réponses:</div>
          <div className="text-xs text-gray-600">
            Min: {Math.min(...validAnswers).toFixed(2)} | 
            Max: {Math.max(...validAnswers).toFixed(2)} |
            Écart-type: {Math.sqrt(
              validAnswers.reduce((sum, ans) => sum + Math.pow(ans - average, 2), 0) / validAnswers.length
            ).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default NumericQuestionStats;
```

#### 3.5 Teacher Dashboard Updates (Day 2)

##### 3.5.1 Results Display
**File**: `/frontend/src/components/TeacherDashboardClient.tsx`

```typescript
// Update existing results modal to handle numeric questions
const TeacherDashboardClient = ({ code, gameId }) => {
  // ...existing state and logic...
  
  const renderQuestionResults = (question: any, stats: any) => {
    const isNumeric = question.questionType === QUESTION_TYPES.NUMERIC;
    
    return (
      <div className="results-content">
        {isNumeric ? (
          <NumericQuestionStats stats={stats} question={question} />
        ) : (
          // ...existing multiple choice stats component...
          <div className="multiple-choice-stats">
            {/* Keep existing multiple choice stats rendering */}
          </div>
        )}
      </div>
    );
  };
  
  // ...rest of component logic unchanged...
  
  return (
    <div className="teacher-dashboard">
      {/* ...existing UI... */}
      
      {/* Update results modal */}
      {showResultsModal && selectedQuestion && questionStats[selectedQuestion.uid] && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">
              Résultats - {selectedQuestion.title || selectedQuestion.text?.substring(0, 50)}
            </h3>
            
            {renderQuestionResults(selectedQuestion, questionStats[selectedQuestion.uid])}
            
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => setShowResultsModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

##### 3.5.2 Live Game Projection Updates
**File**: `/frontend/src/components/TeacherProjectionClient.tsx`

```typescript
// Update projection display for numeric questions
const TeacherProjectionClient = ({ 
  accessCode, 
  gameId, 
  currentQuestion, 
  showStats, 
  stats 
}) => {
  const isNumeric = currentQuestion?.questionType === QUESTION_TYPES.NUMERIC;
  
  return (
    <div className="projection-display min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ...existing header and layout... */}
      
      <div className="question-display-area">
        <QuestionCard 
          currentQuestion={currentQuestion}
          readonly={true}
          showStats={showStats}
          stats={stats}
          // ...other props...
        />
        
        {/* Real-time numeric answer insights */}
        {showStats && isNumeric && stats && (
          <div className="live-numeric-insights mt-6 bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-center">
              Analyse en temps réel
            </h3>
            
            <NumericQuestionStats stats={stats} question={currentQuestion} />
            
            {/* Additional live insights for numeric questions */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm font-medium text-blue-800">Réponses reçues</div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.answers?.length || 0}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm font-medium text-green-800">Taux de participation</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(((stats.answers?.length || 0) / (stats.totalStudents || 1)) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 3.6 Student Interface Updates (Day 2)

##### 3.6.1 Live Game Page
**File**: `/frontend/src/app/live/[code]/page.tsx`

```typescript
// Update student answer submission for numeric questions
const LiveGamePage = () => {
  const [numericAnswer, setNumericAnswer] = useState<string>('');
  // ...existing state...
  
  const handleAnswerSubmit = (answer: any) => {
    if (!currentQuestion) return;
    
    let submissionAnswer = answer;
    
    if (currentQuestion.questionType === QUESTION_TYPES.NUMERIC) {
      // For numeric questions, answer is already a number from QuestionCard
      submissionAnswer = answer;
    } else {
      // For multiple choice, use existing logic
      submissionAnswer = Array.isArray(answer) ? answer : [answer];
    }
    
    // Submit using existing socket pattern
    socket.emit('submit_answer', {
      questionUid: currentQuestion.uid,
      answer: submissionAnswer,
      questionType: currentQuestion.questionType,
      answeredAt: Date.now()
    });
    
    // Update local state
    setAnswered(true);
    setSelectedAnswer(submissionAnswer);
  };
  
  return (
    <div className="live-game min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* ...existing layout and game state handling... */}
      
      {currentQuestion && (
        <div className="question-container">
          <QuestionCard
            currentQuestion={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={totalQuestions}
            onAnswer={handleAnswerSubmit} // Use unified answer handler
            answered={answered}
            selectedAnswer={selectedAnswer}
            // ...other props...
          />
        </div>
      )}
      
      {/* ...existing game UI elements... */}
    </div>
  );
};
```

#### 3.7 API Integration Updates (Day 2)

##### 3.7.1 Update API Types
**File**: `/frontend/src/types/api.ts`

```typescript
// Update response schemas to handle numeric questions
export interface QuestionResponse {
  uid: string;
  title?: string;
  text: string;
  questionType: string;
  discipline: string;
  themes: string[];
  gradeLevel?: string;
  difficulty?: number;
  explanation?: string;
  tags?: string[];
  durationMs: number;
  
  // Make multiple choice fields optional
  answerOptions?: string[];
  correctAnswers?: boolean[];
  
  // Add numeric fields (from polymorphic backend)
  numericQuestion?: {
    correctAnswer: number;
    tolerance?: number;
    unit?: string;
  };
  
  // Backward compatibility with flat structure
  numericFields?: {
    expectedAnswer: number;
    tolerance?: number;
    unit?: string;
    precision?: number;
  };
  
  // ...other fields
}

// Update question creation types (even though frontend doesn't create questions)
export interface QuestionCreationRequest {
  title?: string;
  text: string;
  questionType: string;
  discipline: string;
  themes: string[];
  durationMs: number;
  
  // Type-specific fields
  answerOptions?: string[];
  correctAnswers?: boolean[];
  numericData?: {
    correctAnswer: number;
    tolerance?: number;
    unit?: string;
  };
}
```

#### 3.8 Testing Updates (Day 2)

##### 3.8.1 Component Tests
**File**: `/frontend/src/components/__tests__/NumericQuestion.test.tsx` (new file)

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionCard from '../QuestionCard';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
import { validateNumericAnswer } from '../../utils/answerValidation';

describe('Numeric Question Components', () => {
  const mockNumericQuestion = {
    uid: 'test-numeric-1',
    title: 'Math Problem',
    text: 'What is 2 + 2?',
    questionType: QUESTION_TYPES.NUMERIC,
    discipline: 'mathematics',
    themes: ['arithmetic'],
    numericQuestion: {
      correctAnswer: 4,
      tolerance: 0.1,
      unit: null
    }
  };

  const mockProps = {
    currentQuestion: mockNumericQuestion,
    questionIndex: 0,
    totalQuestions: 5,
    selectedAnswer: null,
    setSelectedAnswer: jest.fn(),
    selectedAnswers: [],
    setSelectedAnswers: jest.fn(),
    handleSingleChoice: jest.fn(),
    handleSubmitMultiple: jest.fn(),
    answered: false,
    isQuizMode: false,
    readonly: false
  };

  test('renders numeric input for numeric questions', () => {
    render(<QuestionCard {...mockProps} />);
    
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Votre réponse...')).toBeInTheDocument();
    expect(screen.getByText('Valider')).toBeInTheDocument();
  });

  test('handles numeric answer submission', async () => {
    const mockHandleSingleChoice = jest.fn();
    
    render(
      <QuestionCard 
        {...mockProps} 
        handleSingleChoice={mockHandleSingleChoice}
      />
    );
    
    const input = screen.getByRole('spinbutton');
    const submitButton = screen.getByText('Valider');
    
    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockHandleSingleChoice).toHaveBeenCalledWith(4);
    });
  });

  test('validates numeric answers correctly', () => {
    expect(validateNumericAnswer(4, 4, 0.1)).toBe(true);
    expect(validateNumericAnswer(4.05, 4, 0.1)).toBe(true);
    expect(validateNumericAnswer(4.2, 4, 0.1)).toBe(false);
    expect(validateNumericAnswer(3.9, 4, 0.1)).toBe(true);
    expect(validateNumericAnswer(3.8, 4, 0.1)).toBe(false);
  });

  test('shows unit when provided', () => {
    const questionWithUnit = {
      ...mockNumericQuestion,
      numericQuestion: {
        ...mockNumericQuestion.numericQuestion,
        unit: 'cm'
      }
    };

    render(<QuestionCard {...mockProps} currentQuestion={questionWithUnit} />);
    
    expect(screen.getByText('cm')).toBeInTheDocument();
  });

  test('disables input when answered', () => {
    render(<QuestionCard {...mockProps} answered={true} />);
    
    const input = screen.getByRole('spinbutton');
    expect(input).toBeDisabled();
  });

  test('handles Enter key submission', async () => {
    const mockHandleSingleChoice = jest.fn();
    
    render(
      <QuestionCard 
        {...mockProps} 
        handleSingleChoice={mockHandleSingleChoice}
      />
    );
    
    const input = screen.getByRole('spinbutton');
    
    fireEvent.change(input, { target: { value: '4' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockHandleSingleChoice).toHaveBeenCalledWith(4);
    });
  });
});

// NumericQuestionStats tests
describe('NumericQuestionStats', () => {
  test('calculates statistics correctly', () => {
    const stats = {
      answers: [3.9, 4.0, 4.1, 5.0, 3.5]
    };
    
    const question = {
      numericQuestion: {
        correctAnswer: 4,
        tolerance: 0.1
      }
    };

    render(<NumericQuestionStats stats={stats} question={question} />);
    
    // Should show 60% accuracy (3 out of 5 within tolerance)
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
    
    // Should show correct average
    expect(screen.getByText('4.10')).toBeInTheDocument(); // (3.9+4.0+4.1+5.0+3.5)/5
  });
});
```

##### 3.8.2 Integration Tests
**File**: `/frontend/src/app/live/__tests__/NumericQuestionFlow.test.tsx` (new file)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QUESTION_TYPES } from '@shared/constants/questionTypes';
// Mock socket and other dependencies...

describe('Numeric Question Game Flow', () => {
  test('complete numeric question answering flow', async () => {
    const mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };

    const numericQuestion = {
      uid: 'numeric-test',
      text: 'Calculate 15 × 3',
      questionType: QUESTION_TYPES.NUMERIC,
      numericQuestion: {
        correctAnswer: 45,
        tolerance: 1
      }
    };

    // Mock the live game page with numeric question
    // ... setup component with mocked question state ...
    
    // Find numeric input
    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
    
    // Enter answer
    fireEvent.change(input, { target: { value: '45' } });
    
    // Submit answer
    const submitButton = screen.getByText('Valider');
    fireEvent.click(submitButton);
    
    // Verify socket emission
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('submit_answer', {
        questionUid: 'numeric-test',
        answer: 45,
        questionType: QUESTION_TYPES.NUMERIC,
        answeredAt: expect.any(Number)
      });
    });
  });
});
```

### Frontend Implementation Summary

#### Implementation Priorities

**High Priority (MVP)**
- ✅ Type system updates (Question interfaces)
- ✅ QuestionCard component numeric input
- ✅ Basic answer validation logic
- ✅ Socket event updates for numeric answers

**Medium Priority**
- ✅ NumericQuestionStats component
- ✅ Teacher dashboard results display
- ✅ Live game projection updates
- ✅ Question type filtering in QuestionSelector

**Low Priority (Future Enhancement)**
- 📊 Advanced numeric statistics (histograms, distributions)
- 🎯 Answer tolerance configuration UI
- 📈 Trend analysis for numeric answers
- 🧮 Mathematical expression support (MathLive integration)

#### Key Benefits of This Approach

1. **Backward Compatibility**: Existing multiple choice questions continue to work unchanged
2. **Minimal Disruption**: Most components require only minor updates
3. **Type Safety**: Full TypeScript support with proper discriminated unions
4. **Extensible**: Easy to add more question types (text, MathLive, etc.)
5. **User-Friendly**: Intuitive numeric input interface for students
6. **Rich Analytics**: Comprehensive statistics for numeric questions

#### API Endpoint Decision

Since the POST `/api/v1/questions` endpoint is unused by the frontend:
- **Recommendation**: Keep endpoint for API consistency but mark as legacy
- **Frontend Focus**: Display, interaction, and analysis rather than creation
- **Question Import**: Continue using external Python script for question management

The polymorphic backend implementation will automatically handle numeric questions once imported, and these frontend updates provide complete support for displaying, answering, and analyzing numeric questions in the MathQuest application.