# Polymorphic Question Structure Migration Guide

## Overview

This document outlines the complete migration from legacy question formats to the new polymorphic question structure in the MathQuest application. This migration was implemented to support different question types (multiple choice, numeric, etc.) with their specific properties while maintaining type safety and consistency.

## Database Schema Changes

### Before (Legacy Structure)
```sql
-- Questions table contained all fields mixed together
Question {
  id: string
  uid: string
  text: string
  questionType: string
  answerOptions: string[]     -- ❌ Legacy: Mixed in main table
  correctAnswers: boolean[]   -- ❌ Legacy: Mixed in main table
  correctAnswer: number       -- ❌ Legacy: Mixed in main table
  tolerance: number           -- ❌ Legacy: Mixed in main table
  unit: string                -- ❌ Legacy: Mixed in main table
  timeLimit: number
  // ... other fields
}
```

### After (Polymorphic Structure)
```sql
-- Main Question table with common fields only
Question {
  id: string
  uid: string
  text: string
  questionType: string
  timeLimit: number
  gradeLevel: string
  difficulty: number
  themes: string[]
  // ... other common fields
}

-- Separate tables for question-type-specific data
MultipleChoiceQuestion {
  id: string
  questionId: string      -- Foreign key to Question
  answerOptions: string[]
  correctAnswers: boolean[]
}

NumericQuestion {
  id: string
  questionId: string      -- Foreign key to Question
  correctAnswer: number
  tolerance: number?
  unit: string?
}
```

## Code Structure Changes

### 1. Prisma Query Updates

**❌ Legacy Pattern:**
```typescript
const questions = await prisma.question.findMany({
  // Only fetched main Question data
});
```

**✅ New Pattern:**
```typescript
const questions = await prisma.question.findMany({
  include: {
    multipleChoiceQuestion: true,
    numericQuestion: true
  }
});
```

**Critical Files Updated:**
- `/backend/src/sockets/handlers/teacherControl/setQuestion.ts` (lines 63-76)
- `/backend/src/sockets/handlers/teacherControl/timerAction.ts` (line 758-762)
- `/backend/src/core/services/gameInstanceService.ts` (lines 140, 227)
- `/backend/src/core/services/quizTemplateService.ts` (lines 61, 84)
- `/backend/src/sockets/handlers/game/requestNextQuestion.ts` (line 90)

### 2. Question Filtering for Clients

**❌ Legacy Pattern:**
```typescript
// In filterQuestionForClient function
const answerOptions = questionObject.answerOptions; // Direct access
const unit = questionObject.unit; // Direct access
```

**✅ New Pattern:**
```typescript
// In filterQuestionForClient function
const answerOptions = questionObject.multipleChoiceQuestion?.answerOptions;
const unit = questionObject.numericQuestion?.unit;

// Handle null values properly for Zod validation
const result = {
  ...baseQuestion,
  numericQuestion: {
    // Convert null to undefined for Zod compatibility
    ...(unit !== null && unit !== undefined ? { unit } : {})
  }
};
```

### 3. Frontend Component Updates

**❌ Legacy Pattern:**
```typescript
// In frontend components
const answerOptions = question.answerOptions; // Direct access
const correctAnswers = question.correctAnswers; // Direct access
```

**✅ New Pattern:**
```typescript
// In frontend components
const answerOptions = question.multipleChoiceQuestion?.answerOptions || [];
const correctAnswers = question.multipleChoiceQuestion?.correctAnswers || [];

// For answer mapping (CRITICAL FIX)
return answerOptions.map((option: string, index: number) => ({
  text: option,
  correct: correctAnswers[index] === true  // Use index, not includes()
}));
```

## Migration Patterns & Legacy Detection

### 1. Detecting Legacy Prisma Queries

**Search Pattern:**
```bash
grep -r "question: true" app/backend/src/
grep -r "include.*question.*{" app/backend/src/
```

**Legacy Indicators:**
- `question: true` without include for polymorphic relations
- Missing `multipleChoiceQuestion: true` and `numericQuestion: true`

**Fix Template:**
```typescript
// Replace this:
include: { question: true }

// With this:
include: { 
  question: {
    include: {
      multipleChoiceQuestion: true,
      numericQuestion: true
    }
  }
}
```

### 2. Detecting Legacy Frontend Access Patterns

**Search Patterns:**
```bash
grep -r "\.answerOptions" app/frontend/src/
grep -r "\.correctAnswers" app/frontend/src/
grep -r "\.correctAnswer" app/frontend/src/
grep -r "\.unit\b" app/frontend/src/
```

**Legacy Indicators:**
- Direct property access: `question.answerOptions`
- Array includes with wrong type: `correctAnswers.includes(option)` where option is string and correctAnswers is boolean[]

**Fix Template:**
```typescript
// Replace this:
const answerOptions = question.answerOptions;
const correctAnswers = question.correctAnswers;

// With this:
const answerOptions = question.multipleChoiceQuestion?.answerOptions || [];
const correctAnswers = question.multipleChoiceQuestion?.correctAnswers || [];

// Fix boolean array mapping:
// Replace: correctAnswers.includes(option)
// With: correctAnswers[index] === true
```

### 3. Detecting Legacy Question Filtering

**Search Patterns:**
```bash
grep -r "questionObject\.answerOptions" app/
grep -r "questionObject\.correctAnswer" app/
grep -r "questionObject\.unit" app/
```

**Fix Template:**
```typescript
// Replace direct access:
const answerOptions = questionObject.answerOptions || questionObject.multipleChoiceQuestion?.answerOptions;

// With polymorphic-only access:
const answerOptions = questionObject.multipleChoiceQuestion?.answerOptions;
```

## Critical Bug Patterns Fixed

### 1. Boolean Array Includes Bug
**Problem:** Using `array.includes(string)` on boolean array
```typescript
// ❌ WRONG - will always return false
correctAnswers.includes(option) // option is string, correctAnswers is boolean[]

// ✅ CORRECT
correctAnswers[index] === true
```

### 2. Null vs Undefined in Zod Validation
**Problem:** Database storing `null` but Zod expecting `undefined`
```typescript
// ❌ WRONG - causes Zod validation failure
unit: questionObject.numericQuestion?.unit // might be null

// ✅ CORRECT - convert null to undefined
...(unit !== null && unit !== undefined ? { unit } : {})
```

### 3. Missing Database Relations
**Problem:** Prisma queries not including polymorphic relations
```typescript
// ❌ WRONG - missing relation data
const question = await prisma.question.findUnique({
  where: { id }
});

// ✅ CORRECT - includes all relation data
const question = await prisma.question.findUnique({
  where: { id },
  include: {
    multipleChoiceQuestion: true,
    numericQuestion: true
  }
});
```

## Validation & Testing

### 1. Backend Validation
- Run TypeScript compilation: `npm run type-check`
- Check Zod validation in logs for payload validation errors
- Look for "Invalid GAME_QUESTION payload" errors

### 2. Frontend Validation
- Check browser console for "Rendering with ZERO answers" warnings
- Verify answer options display correctly for multiple choice questions
- Verify numeric questions display input fields correctly

### 3. Database Validation
- Ensure all questions have proper polymorphic relations created
- Verify `multipleChoiceQuestion` exists for multiple choice questions
- Verify `numericQuestion` exists for numeric questions

## Files Modified in Migration

### Backend Files
- `/backend/src/sockets/handlers/teacherControl/setQuestion.ts`
- `/backend/src/sockets/handlers/teacherControl/timerAction.ts`
- `/backend/src/core/services/gameInstanceService.ts`
- `/backend/src/core/services/quizTemplateService.ts`
- `/backend/src/sockets/handlers/game/requestNextQuestion.ts`
- `/shared/types/quiz/liveQuestion.ts`

### Frontend Files
- `/frontend/src/components/QuestionCard.tsx`
- `/frontend/src/components/QuestionDisplay.tsx`
- `/frontend/src/components/TeacherDashboardClient.tsx`
- `/frontend/src/app/teacher/games/new/page.tsx`

## Future Migration Checklist

When encountering legacy code:

1. **Search for Legacy Patterns:**
   ```bash
   # In backend
   grep -r "question: true" app/backend/src/
   grep -r "\.answerOptions" app/backend/src/
   
   # In frontend
   grep -r "\.answerOptions" app/frontend/src/
   grep -r "correctAnswers\.includes" app/frontend/src/
   ```

2. **Update Prisma Queries:**
   - Add `multipleChoiceQuestion: true` and `numericQuestion: true` to includes
   - Remove any legacy field access

3. **Update Property Access:**
   - Replace `question.answerOptions` with `question.multipleChoiceQuestion?.answerOptions`
   - Replace `question.correctAnswers` with `question.multipleChoiceQuestion?.correctAnswers`
   - Replace `question.correctAnswer` with `question.numericQuestion?.correctAnswer`
   - Replace `question.unit` with `question.numericQuestion?.unit`

4. **Fix Array Operations:**
   - Replace `correctAnswers.includes(option)` with `correctAnswers[index] === true`

5. **Handle Null Values:**
   - Use spread operator to convert null to undefined: `...(value !== null ? { key: value } : {})`

6. **Test Changes:**
   - Verify TypeScript compilation
   - Check Zod validation passes
   - Test frontend components display correctly

## Schema Definitions

### Zod Schemas (for reference)
```typescript
// Student payload schema
const questionDataForStudentSchema = z.object({
  uid: z.string(),
  text: z.string(),
  questionType: z.string(),
  timeLimit: z.number(),
  multipleChoiceQuestion: z.object({
    answerOptions: z.array(z.string())
  }).optional(),
  numericQuestion: z.object({
    unit: z.string().optional()
  }).optional(),
});

// Teacher payload schema (includes correct answers)
const questionDataForTeacherSchema = questionDataForStudentSchema.extend({
  multipleChoiceQuestion: z.object({
    answerOptions: z.array(z.string()),
    correctAnswers: z.array(z.boolean())
  }).optional(),
  numericQuestion: z.object({
    correctAnswer: z.number(),
    tolerance: z.number().optional(),
    unit: z.string().optional()
  }).optional(),
});
```

## Summary

The polymorphic structure migration provides:
- **Type Safety:** Each question type has its own specific fields
- **Extensibility:** Easy to add new question types
- **Data Integrity:** No mixing of incompatible fields
- **Performance:** Only load data relevant to question type

All legacy patterns have been identified and migrated. Future development should strictly follow the polymorphic patterns outlined in this document.
