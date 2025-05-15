# MathQuest Backend Rewrite - Phase 7 Planning

## Overview

With Phase 6 (Lobby Implementation) completed and all tests passing, the project now moves into Phase 7 which focuses on game logic implementation with Socket.IO. This document outlines the key tasks, approaches, and considerations for the successful completion of Phase 7.

## Core Tasks for Phase 7

### 1. Game Handler Implementation

The `gameHandler.ts` will be responsible for managing live gameplay for students, including:

- **Socket Event Handlers:**
  - `join_game`: When a player moves from the lobby to an active game
  - `game_answer`: When a player submits an answer to a question
  - `game_question`: Handling current question display logic
  - `game_timer_update`: Managing and synchronizing timer updates
  - `teacher_update`: Broadcasting teacher-initiated game state changes
  - `game_end`: Managing game termination
  - `explanation`: Handling explanation display for completed questions

- **Room Management:**
  - Using `game_${accessCode}` room for all game-related broadcasts
  - Managing player joining/leaving during active gameplay

### 2. Game Logic Implementation

Core gameplay functionality:

- **Question Serving:**
  - Sequential delivery of questions based on the quiz template
  - Question data transformation for client-side rendering
  - Support for different question types

- **Timer Management:**
  - Synchronized timers for all participants
  - Pause/resume functionality for teachers
  - Automatic question progression based on timer expiration

- **Answer Processing:**
  - Validation of submitted answers
  - Real-time scoring based on correctness and response time
  - Statistical aggregation of responses

- **Leaderboard Management:**
  - Real-time leaderboard calculation and updates
  - Periodic broadcasting of leaderboard data
  - Final rankings at game conclusion

### 3. State Management in Redis

- **Game State Structure:**
  ```typescript
  interface GameState {
    gameId: string;
    accessCode: string;
    status: 'pending' | 'active' | 'paused' | 'completed';
    currentQuestionIndex: number;
    questions: Question[];
    participants: GameParticipant[];
    timer: {
      startedAt: number;
      duration: number;
      isPaused: boolean;
      pausedAt?: number;
      timeRemaining?: number;
    };
    answers: Record<string, ParticipantAnswer[]>;
    leaderboard: LeaderboardEntry[];
    settings: GameSettings;
  }
  ```

- **Redis Keys Structure:**
  - `mathquest:game:${accessCode}` - Main game state
  - `mathquest:game:${accessCode}:participants` - Hash of participant data
  - `mathquest:game:${accessCode}:answers:${questionId}` - Answers for specific questions
  - `mathquest:game:${accessCode}:leaderboard` - Sorted set for leaderboard

### 4. Testing Strategy

- **Unit Tests:**
  - Scoring logic
  - Timer calculation logic
  - Answer validation
  - Leaderboard calculation

- **Integration Tests:**
  - Full game flow with multiple players
  - Question progression
  - Answer submission and validation
  - Timer synchronization
  - Game state persistence in Redis

## Implementation Approach

1. First, establish the core Redis data structure for game state
2. Implement basic game joining functionality
3. Build question serving and progression logic
4. Add timer management
5. Implement answer submission and validation
6. Create scoring and leaderboard functionality
7. Add game completion logic
8. Implement error handling and graceful recovery

## Considerations

- **State Consistency:** Ensure game state remains consistent across server instances
- **Error Handling:** Graceful error handling for connection drops, Redis failures, etc.
- **Performance:** Optimize Redis operations for scalability with many concurrent games
- **Backward Compatibility:** Ensure API remains compatible with existing frontend
- **Testing:** Thorough testing of edge cases (player joining mid-game, reconnections, etc.)

## Next Steps

1. Set up the basic game handler structure with event listeners
2. Design and implement the Redis data structures for game state
3. Create core mechanisms for game progression
4. Develop comprehensive unit and integration tests
