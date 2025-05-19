# Phase 8: Teacher Dashboard & Game Control Implementation Plan

## Overview

This document outlines the implementation plan for Phase 8 of the MathQuest backend rewrite. Phase 8 focuses on the Teacher Dashboard & Game Control functionality using Socket.IO. The primary goal is to provide teachers with real-time control over games, including advancing questions, managing timers, and locking/unlocking answer submissions.

## Core Components

1. **Socket Handler**: Enhanced `teacherControlHandler.ts` to manage dashboard interactions.
2. **Game Control Logic**: Methods to control game flow, timers, and answer submissions.
3. **State Management**: Unified state approach with the main `gameState` in Redis as the single source of truth.
4. **Broadcasting**: Fan-out updates to teachers, players, and projection displays.

## Socket Events Structure

### Client-to-Server (Teacher Dashboard → Backend)

1. `join_dashboard` - Payload: `{ gameId: string }`
   - Authenticates teacher and authorizes for the specific game.
   - Joins socket to `dashboard_${gameId}` and `projection_${gameId}` rooms.
   - Returns comprehensive game state.

2. `set_question` - Payload: `{ gameId: string, questionUid: string }`
   - Advances game to specified question.
   - Updates timer settings based on question.
   - Broadcasts updates to all relevant rooms.

3. `timer_action` - Payload: `{ gameId: string, action: 'start'|'pause'|'resume'|'stop'|'set_duration', duration?: number }`
   - Manages the game timer state.
   - Broadcasts timer updates to all rooms.

4. `lock_answers` - Payload: `{ gameId: string, lock: boolean }`
   - Controls whether players can submit answers.
   - Broadcasts lock state to game room.

5. `end_game` - Payload: `{ gameId: string }`
   - Concludes the game and finalizes scores.
   - Updates game status in Redis and database.

### Server-to-Client (Backend → Teacher Dashboard)

1. `game_control_state` - Comprehensive dashboard state (sent on join)
   - Game metadata (ID, access code, status)
   - All questions with complete details (including correct answers)
   - Current question UID
   - Timer state
   - Lock status
   - Participant count

2. `dashboard_question_changed` - Sent when the current question changes
   - New question UID
   - Updated timer state

3. `dashboard_timer_updated` - Sent when timer state changes
   - Current timer state (startedAt, duration, isPaused, timeRemaining)

4. `dashboard_answers_lock_changed` - Sent when answer submission status changes
   - Lock status boolean

5. `dashboard_participant_update` - Sent when participant count changes
   - Current participant count

6. `dashboard_answer_stats_update` - Sent when new answers are submitted
   - Question UID
   - Updated statistics for each answer option

7. `dashboard_game_status_changed` - Sent when game status changes
   - New game status

8. `error_dashboard` - Sent when an error occurs
   - Error code
   - Error message

## Implementation Plan

### Step 1: Update `teacherControlHandler.ts` 

Update the existing file with:
- Rename `join_teacher_control` to `join_dashboard`
- Use `dashboard_${gameId}` instead of `teacher_control_${gameId}` for room naming
- Remove unnecessary `teacherId` from payload (use `socket.data.teacherId` instead)
- Add support for projector room via `projection_${gameId}`
- Enhance `game_control_state` to include complete question data with correct answers

### Step 2: Implement Control Logic Methods

Add methods to:
- Set a specific question as the current question
- Control the timer (start, pause, resume, stop, set duration)
- Lock/unlock answer submissions
- End the game and finalize scores

### Step 3: Implement Broadcasting Logic

Create helper functions to:
- Broadcast granular updates to the dashboard room
- Broadcast appropriate updates to the game room
- Broadcast updates to the projection room

### Step 4: Integrate with `gameStateService`

Enhance `gameStateService.ts` to:
- Support the teacher's control actions
- Update the main `gameState` in Redis
- Provide methods to fetch answer statistics

### Step 5: Write Tests

Create tests to verify:
- Teacher can join dashboard and receive complete state
- Teacher can set questions, control timer, and lock answers
- Updates are properly broadcast to all relevant rooms
- Error handling works correctly

## Key Improvements

1. **Granular Updates**: Send specific update events rather than the entire game state
2. **Unified State**: Single source of truth in Redis `gameState`
3. **Proper Room Management**: Clear separation between dashboard, game, and projection rooms
4. **Enhanced Authorization**: Using socket middleware for teacher authentication
5. **Comprehensive Question Data**: Including correct answers in teacher-only views

## Completion Criteria

- All socket events are implemented and tested
- Teacher can fully control game flow via the dashboard
- Game state is properly synchronized between teacher dashboard and player views
- Projector room receives appropriate updates
- Documentation is complete
