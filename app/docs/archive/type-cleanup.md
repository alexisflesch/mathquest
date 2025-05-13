# Type Definitions Cleanup Action Plan

*Date: May 13, 2025*

## Overview

This document outlines a plan to analyze and consolidate TypeScript type definitions across the MathQuest application. The goal is to create a more maintainable, DRY codebase by identifying and factoring out shared types into a common location.

## Action Steps

### 1. Inventory of Frontend Type Definitions

#### `/frontend/src/types/index.ts`
- `Response`: Defines answer structure for quiz questions
- `Question`: Base question type with fields like uid, question, reponses, etc.
- `QuizState`: Quiz state structure with questions, timer, and flags
- `Logger`: Interface for logging functionality

### 2. Inventory of Backend Type Definitions

#### `/backend/sockets/types/quizTypes.ts`
- `QuestionTimer`: Timer state with status, timeLeft, initialTime, timestamp
- `Answer`: Answer structure with text and correctness flag
- `Question`: Question structure (more detailed than frontend)
- `Chrono`: Timer state tracking
- `QuizState`: Comprehensive quiz state (includes more fields than frontend version)
- `QuizStateContainer`: Quiz state container with string indexer

#### `/backend/sockets/types/socketTypes.ts`
- `SetQuestionPayload`: Quiz question setting event payload
- `TimerActionPayload`: Timer control event payload
- `SetTimerPayload`: Timer setting event payload
- `LockUnlockPayload`: Locking/unlocking quiz payload
- `EndQuizPayload`: Quiz ending event payload
- `CloseQuestionPayload`: Question closing event payload
- `JoinQuizPayload`: Quiz joining event payload
- `GetQuizStatePayload`: State retrieval payload
- `PauseResumePayload`: Pause/resume handling payload
- `JoinTournamentPayload`: Tournament joining payload
- `TournamentAnswerPayload`: Tournament answer submission payload
- `StartTournamentPayload`: Tournament start payload
- `PauseTournamentPayload`: Tournament pause payload
- `ResumeTournamentPayload`: Tournament resume payload
- `QuizEventHandler`: Type for quiz event handler functions
- `TournamentEventHandler`: Type for tournament event handler functions

#### `/backend/sockets/types/tournamentTypes.ts`
- `Participant`: Basic tournament participant data
- `TournamentParticipant`: Enhanced participant with answers
- `TournamentAnswer`: Answer structure for tournament
- `LeaderboardEntry`: Leaderboard data structure
- `QuestionTimerState`: Timer state for tournament questions
- `QuestionState`: Question state in tournament
- `TournamentState`: Full tournament state structure
- `TournamentStateContainer`: Global tournament state container

#### `/backend/sockets/types/scoreTypes.ts`
- `ScoreCalculationResult`: Score calculation output structure

### 3. Analysis of Duplicate/Related Types

#### Duplicated Types
- **Question**: Similar structure in both frontend and backend with slight differences
- **QuizState**: Both locations have this with different properties
- **Logger**: Defined in frontend but relates to the shared logger implementation

#### Related Types
- **Answer** (backend) vs **Response** (frontend): Conceptually the same with minor differences
- **Chrono** (backend) vs `chrono` property in frontend's QuizState

### 4. Consolidation Plan

#### Create Shared Type Directory Structure
```
/shared/
  /types/
    index.ts        # Re-exports all shared types
    /quiz/
      question.ts   # Question, Answer/Response types
      state.ts      # QuizState and related types
    /tournament/
      participant.ts # Participant types
      state.ts       # Tournament state types
    /socket/
      payloads.ts    # Event payload types
    /util/
      logger.ts      # Logger interface
```

#### Types to be Shared

1. **Core Data Types**:
   - `Question`
   - `Answer`/`Response` (unified)
   - Base `QuizState` (common properties)
   - `Participant`
   - `ScoreCalculationResult`

2. **Utility Types**:
   - `Logger`

3. **Socket Event Types**:
   - All payload interfaces from socketTypes.ts

#### Implementation Approach

1. Create base interfaces in shared location
2. Extend as needed in frontend/backend
3. Update imports across the codebase
4. Ensure backward compatibility during transition

### 5. Implementation Steps

1. **Create Shared Type Folders**
   - Create necessary directories in `/shared/types/`
   - Set up proper exports in index files

2. **Move Common Types**
   - Move Question/Answer structure to shared location
   - Extract common fields from QuizState
   - Move socket payload definitions

3. **Update References**
   - Update imports in frontend files
   - Update imports in backend files
   - Fix any type compatibility issues

4. **Extend Types as Needed**
   - Frontend and backend can extend shared types with additional fields
   - Create domain-specific extensions for specialized uses

5. **Documentation**
   - Document the shared type system
   - Add JSDoc comments to shared types
   - Create usage examples

## Conclusion

By consolidating shared types, we'll achieve:
1. Single source of truth for core data structures
2. Better consistency between frontend and backend
3. Reduced code duplication
4. Easier maintenance when extending the application
5. Clearer boundaries between shared and domain-specific types

This work will be completed today and will serve as the foundation for further TypeScript improvements in the MathQuest application.

## Post-Implementation Note

*Date: May 13, 2025*

The type cleanup and consolidation outlined in this plan have been successfully implemented. 
For a summary of the work done, please see [Type Consolidation Summary](./type-consolidation-summary.md).
For a detailed report on the implementation process, challenges, and outcomes, refer to the [Type Consolidation Implementation Report](./type-consolidation-implementation.md).
The new shared types are documented in the [Shared Types Usage Guide](../types/shared-types-guide.md).
