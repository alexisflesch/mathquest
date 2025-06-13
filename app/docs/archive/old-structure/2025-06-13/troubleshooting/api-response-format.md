# API Response Format Changes

## Overview

This document describes common issues that arise when API response formats change but frontend components haven't been updated to handle the new structure.

## Common Patterns

### 1. Field Name Changes

Old API responses might use different field names than new ones:

```json
// Old format
{
  "titre": "Question title",
  "temps": 30,
  "reponses": [...]
}

// New format  
{
  "title": "Question title",
  "timeLimit": 30,
  "answerOptions": [...]
}
```

### 2. Structure Changes

Response structures may become nested or flattened:

```json
// Old format - flat
{
  "uid": "q1",
  "text": "Question?",
  "answers": [...]
}

// New format - nested
{
  "sequence": 1,
  "question": {
    "uid": "q1", 
    "text": "Question?",
    "answerOptions": [...]
  }
}
```

### 3. Array vs Object Responses

APIs might change from returning arrays to objects or vice versa:

```json
// Old format - direct array
["question1", "question2", "question3"]

// New format - wrapped object
{
  "questions": ["question1", "question2", "question3"],
  "total": 3,
  "hasMore": false
}
```

## Detection

Signs that API formats have changed:

1. **Data appears empty** despite successful API calls
2. **TypeScript/console errors** about missing properties
3. **Components render incorrectly** or show placeholder data
4. **Network tab shows successful responses** but with unexpected structure

## Solutions

### 1. Flexible Data Mapping

Create mapping functions that handle multiple formats:

```typescript
function mapApiResponse(response: any) {
  // Handle both old and new formats
  const data = response.data || response;
  const questions = data.questions || data;
  
  return Array.isArray(questions) ? questions : [];
}
```

### 2. Runtime Validation

Use Zod schemas to validate and transform responses:

```typescript
const QuestionSchema = z.object({
  uid: z.string(),
  text: z.string(),
  // Handle both old and new field names
  answerOptions: z.array(z.string()).optional(),
  answers: z.array(z.object({
    text: z.string(),
    correct: z.boolean()
  })).optional()
}).transform(data => {
  // Normalize to new format
  if (data.answers && !data.answerOptions) {
    return {
      ...data,
      answerOptions: data.answers.map(a => a.text),
      correctAnswers: data.answers.map(a => a.correct)
    };
  }
  return data;
});
```

### 3. Gradual Migration

When possible, support both formats during transition:

```typescript
function processQuestion(q: any) {
  // Support nested structure
  const questionData = q.question || q;
  
  // Support both field name formats
  const text = questionData.text || questionData.titre;
  const timeLimit = questionData.timeLimit ?? questionData.temps;
  
  return {
    text,
    timeLimit,
    // ... other fields
  };
}
```

## Best Practices

### 1. Version API Endpoints

```
/api/v1/questions  // Old format
/api/v2/questions  // New format
```

### 2. Add Transformation Layers

Create dedicated transformation functions:

```typescript
// transformers/questionTransformer.ts
export function transformQuestionResponse(apiResponse: any) {
  // Handle format conversion
}
```

### 3. Document Changes

Always document API changes:

```markdown
## API v2.1 Changes
- `temps` field renamed to `timeLimit`
- `reponses` array replaced with `answerOptions` + `correctAnswers`
- Responses now nested under `question` property
```

### 4. Add Tests

Test both old and new formats:

```typescript
describe('Question API compatibility', () => {
  it('handles old format', () => {
    const oldFormat = { titre: 'Test', temps: 30 };
    expect(transformQuestion(oldFormat)).toEqual({
      title: 'Test',
      timeLimit: 30
    });
  });
  
  it('handles new format', () => {
    const newFormat = { title: 'Test', timeLimit: 30 };
    expect(transformQuestion(newFormat)).toEqual({
      title: 'Test', 
      timeLimit: 30
    });
  });
});
```

## Migration Strategy

1. **Identify affected endpoints** - List all API calls that might be affected
2. **Create compatibility layer** - Add transformation functions
3. **Update incrementally** - Fix one component at a time
4. **Add validation** - Use Zod schemas for runtime checks
5. **Test thoroughly** - Verify both old and new data works
6. **Remove old format support** - After all clients are updated

## Related Documentation

- [Question Data Structure Mapping](question-data-mapping.md)
- [API Documentation](../api/README.md)
- [Frontend Architecture](../frontend/frontend-architecture.md)
