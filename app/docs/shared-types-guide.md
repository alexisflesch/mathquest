# Shared Types Usage Guide

*Updated: May 13, 2025*

This guide provides instructions for using the shared types across the MathQuest application. The shared types system has been improved to ensure better consistency between frontend and backend.

## Available Shared Types

### Quiz Types

**Core Question Classification:**
Questions are primarily classified using the following fields in the `Question` interface (which extends `BaseQuestion`):
*   `gradeLevel?: string;` - The educational level for the question.
*   `discipline?: string;` - The subject or discipline (e.g., "Mathematics", "History").
*   `themes?: string[];` - An array of themes specific to the discipline (e.g., ["Algebra", "Geometry"] for Mathematics).
*   `tags?: string[];` - (Inherited from `BaseQuestion`) General-purpose tags for finer-grained searching and categorization.

It's important to rely on these fields for categorizing and filtering questions. Avoid introducing redundant or overlapping fields. For instance, a previously used "categories" field has been removed in favor of a clear distinction between "discipline" and "themes".

```typescript
// Importing quiz types
import { 
  Question,        // Core question structure
  Answer,          // Answer structure
  BaseQuizState,   // Common quiz state properties
  QuestionTimer,   // Question timer state
  Chrono           // Timer state
} from '@shared/types';
```

### Tournament Types

```typescript
// Importing tournament types
import { 
  Participant,            // Basic participant data
  TournamentParticipant,  // Enhanced participant with answers
  TournamentAnswer,       // Answer structure for tournaments
  LeaderboardEntry,       // Leaderboard entry structure
  TournamentState         // Full tournament state
} from '@shared/types';
```

### Socket Payload Types

```typescript
// Importing socket payload types
import {
  SetQuestionPayload,      // Quiz question setting event
  TimerActionPayload,      // Timer control event
  JoinQuizPayload,         // Quiz joining event
  JoinTournamentPayload,   // Tournament joining event
  // ...and many more
} from '@shared/types';
```

### Utility Types

```typescript
// Importing utility types
import { 
  Logger,                  // Logger interface
  ScoreCalculationResult   // Score calculation result
} from '@shared/types';
```

## Usage Examples

### Frontend Component Example

```typescript
import { Question, Answer } from '@shared/types';
import { useState } from 'react';

// You can extend shared types as needed
interface EnhancedQuestion extends Question {
  isSelected?: boolean;
}

export function QuestionDisplay({ question }: { question: EnhancedQuestion }) {
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  
  // Use the shared types in your component
  return (
    <div>
      <MathJaxWrapper>
        <h2>{question.text}</h2>
      </MathJaxWrapper>
      <ul>
        {(question.reponses || question.answers || []).map((answer, index) => (
          <li key={index} onClick={() => setSelectedAnswer(answer)}>
            {answer.texte}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Backend Handler Example

```typescript
import { Server, Socket } from 'socket.io';
import { SetQuestionPayload, QuizState } from '@shared/types';

export function handleSetQuestion(
  io: Server,
  socket: Socket,
  payload: SetQuestionPayload,
  state: Record<string, QuizState>
) {
  const { quizId, questionUid } = payload;
  
  if (!state[quizId]) {
    socket.emit('error', { message: 'Quiz not found' });
    return;
  }
  
  // Use the shared types in your handler
  state[quizId].currentQuestionUid = questionUid;
  
  // Emit event to all clients in the room
  io.to(`quiz:${quizId}`).emit('quiz_question_set', {
    questionUid,
    quizId
  });
}
```

## Best Practices

1. **Importing Types**: Use destructured imports to only import what you need
   ```typescript
   import { Question, Answer } from '@shared/types';
   ```

2. **Extending Types**: Extend shared types rather than modifying them directly
   ```typescript
   interface EnhancedQuestion extends Question {
     // Additional properties
   }
   ```

3. **Type Guards**: Create type guards for runtime type checking
   ```typescript
   function isValidQuestion(obj: any): obj is Question {
     return obj && typeof obj === 'object' 
       && typeof obj.uid === 'string';
   }
   ```

4. **JSDoc Comments**: Add JSDoc comments when extending types
   ```typescript
   /**
    * Enhanced question with UI-specific properties
    */
   interface EnhancedQuestion extends Question {
     isSelected?: boolean;
   }
   ```

5. **Using with API Responses**: Map API responses to shared types
   ```typescript
   const questions: Question[] = apiResponse.map(item => ({
     uid: item.id,
     texte: item.text,
     // other mappings...
   }));
   ```

6. **Good practice**: Create utility functions for common operations
   ```typescript
   function getQuestionText(question: BaseQuestion): string {
      const text = question.text || '';
      return text;
   }
   ```

## Troubleshooting

### Common Issues

1. **Import Errors**: If you see "Cannot find module '@shared/types'", check your tsconfig.json paths

2. **Type Mismatches**: If you see type mismatches, check if you're using the correct property names
   ```
   // Common issue:
   question.text // ❌ Error
   question.texte // ✅ Correct
   ```

3. **Missing Properties**: If TypeScript complains about missing properties, use optional chaining or provide defaults
   ```typescript
   const text = question.texte || question.question || '';
   ```

For more information on the shared type system, refer to the [Type Consolidation Summary](./type-consolidation-summary.md) document.
