# Question Data Structure Mapping Issues

## Problem Description

Questions appear empty in the teacher dashboard despite the correct count being shown. This issue typically occurs when the frontend components expect a different data structure than what the API provides.

## Symptoms

- Teacher dashboard shows correct number of questions (e.g., "3 questions")
- Question list appears empty or questions display without text/answers
- Console may show warnings about missing properties
- QuestionDisplay component receives malformed data

## Root Cause

The backend API has evolved to use a new question data structure, but frontend components were still expecting the legacy format:

### New API Format (Current)
```json
{
  "question": {
    "uid": "question-123",
    "text": "What is 2+2?",
    "answerOptions": ["3", "4", "5"],
    "correctAnswers": [false, true, false]
  }
}
```

### Legacy Format (Expected by Frontend)
```json
{
  "uid": "question-123", 
  "text": "What is 2+2?",
  "answers": [
    {"text": "3", "correct": false},
    {"text": "4", "correct": true}, 
    {"text": "5", "correct": false}
  ]
}
```

## Nested Question Structure

The API may return questions with nested structures where the actual question data is inside a `question` property:

```json
{
  "sequence": 1,
  "question": {
    "uid": "question-123",
    "text": "What is 2+2?",
    "answerOptions": ["3", "4", "5"],
    "correctAnswers": [false, true, false]
  }
}
```

## Solution

### 1. Data Mapping Functions

Update data mapping functions to handle both formats:

**In TeacherDashboardPage (`/frontend/src/app/teacher/dashboard/[quizId]/page.tsx`):**

```typescript
function mapToCanonicalQuestion(q: any) {
    // Handle nested question structure
    const questionData = q.question || q;
    
    let answerOptions: string[] = [];
    let correctAnswers: boolean[] = [];
    
    if (questionData.answerOptions && Array.isArray(questionData.answerOptions)) {
        // New API format - from nested question object
        answerOptions = questionData.answerOptions;
        correctAnswers = questionData.correctAnswers || [];
    } else if (q.answerOptions && Array.isArray(q.answerOptions)) {
        // New API format - direct on question
        answerOptions = q.answerOptions;
        correctAnswers = q.correctAnswers || [];
    } else if (q.answers && Array.isArray(q.answers)) {
        // Legacy format
        answerOptions = q.answers.map((a: any) => a.text || a);
        correctAnswers = q.answers.map((a: any) => a.correct || false);
    }
    
    return {
        ...q,
        text: questionData.text || q.text,
        uid: questionData.uid || q.uid,
        answerOptions,
        correctAnswers,
        timeLimit: q.timeLimit ?? q.time ?? 60,
    };
}
```

**In SortableQuestion component (`/frontend/src/components/SortableQuestion.tsx`):**

```typescript
function toLegacyQuestionShape(q: any) {
    // Handle nested question structure from API
    const questionData = q.question || q;
    
    const answerOptions = questionData.answerOptions || q.answerOptions || [];
    const correctAnswers = questionData.correctAnswers || q.correctAnswers || [];
    
    return {
        ...q,
        uid: questionData.uid || q.uid,
        text: questionData.text || q.text,
        answers: Array.isArray(answerOptions) ? answerOptions.map((text: string, i: number) => ({ 
            text, 
            correct: correctAnswers?.[i] || false 
        })) : [],
    };
}
```

### 2. Component Updates

Ensure components can handle both data formats gracefully:

- Add comprehensive logging to trace data flow
- Implement fallback handling for missing properties
- Update TypeScript interfaces to be more flexible

### 3. API Consistency

Work towards API consistency by:
- Standardizing response formats across endpoints
- Documenting expected data structures
- Adding runtime validation

## Debugging Steps

### 1. Enable Debug Logging

Add logging to trace data transformation:

```typescript
const logger = createLogger('ComponentName');
logger.info('[DEBUG] Input question:', inputData);
logger.info('[DEBUG] Processed question:', processedData);
```

### 2. Inspect API Responses

1. Open browser dev tools
2. Go to Network tab
3. Look for API calls to `/api/v1/games/id/` and `/api/v1/game-templates/`
4. Check the response structure

### 3. Check Console Errors

Look for errors like:
- "Cannot read property 'text' of undefined"
- "Cannot read property 'answers' of undefined"
- React warnings about missing props

### 4. Verify Data Flow

Trace the data through the component hierarchy:
1. API Response → `mapToCanonicalQuestion`
2. `mapToCanonicalQuestion` → DraggableQuestionsList
3. DraggableQuestionsList → SortableQuestion
4. SortableQuestion → `toLegacyQuestionShape` → QuestionDisplay

## Prevention

To prevent similar issues in the future:

1. **Document API Changes** - Update documentation when API structures change
2. **Add Runtime Validation** - Use Zod schemas to validate API responses
3. **Write Tests** - Add tests for data mapping functions
4. **Use TypeScript Strictly** - Avoid `any` types where possible
5. **Version API Endpoints** - Use versioned endpoints for breaking changes

## Related Files

- `/frontend/src/app/teacher/dashboard/[quizId]/page.tsx` - Main dashboard with mapping function
- `/frontend/src/components/SortableQuestion.tsx` - Question wrapper with legacy shape mapping
- `/frontend/src/components/QuestionDisplay.tsx` - Final question rendering
- `/frontend/src/components/DraggableQuestionsList.tsx` - Question list component
- `/backend/src/api/v1/games.ts` - Games API endpoint
- `/backend/src/api/v1/gameTemplates.ts` - Game templates API endpoint

## Testing

After implementing fixes:

1. Create a quiz with questions
2. Navigate to teacher dashboard
3. Verify questions display with text and answers
4. Check browser console for errors
5. Test question reordering and timer controls

## Historical Context

This issue arose during the evolution from a legacy question format to a more structured API response. The frontend components were not updated to handle the new nested question structure returned by the backend APIs.
