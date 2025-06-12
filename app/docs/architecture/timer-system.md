# Timer System Architecture

## Overview
The timer system follows a centralized architecture where the backend is the single source of truth for all timer state and countdown logic.

## Architecture Principles

### 1. Backend Responsibilities (Source of Truth)
- **Timer State Management**: Maintains current timer values and status (paused/stopped/playing)
- **Countdown Logic**: Handles all countdown calculations and timing
- **State Broadcasting**: Sends timer updates to dashboard and live rooms
- **Zero Detection**: Detects when timer reaches 0 and triggers appropriate events

### 2. Teacher Control Flow
1. Teacher clicks timer action in dashboard (pause/resume/stop/set duration)
2. Frontend sends socket request to backend with timer action
3. Backend processes the request and updates internal timer state
4. Backend broadcasts new timer state to both dashboard and live rooms
5. Frontend receives update and synchronizes UI

### 3. Client Responsibilities (Display Only)
- **UI Updates**: Update timer display when receiving backend updates
- **Local Countdown**: Start visual countdown based on backend timer state
- **Synchronization**: Keep frontend timer in sync with backend state

## Socket Events

### Teacher Dashboard → Backend
- `quiz_timer_action`: Request timer changes
  ```typescript
  {
    gameId: string;
    action: 'start' | 'pause' | 'resume' | 'stop' | 'set_duration';
    duration?: number; // Only for 'start' and 'set_duration'
  }
  ```

### Backend → Dashboard
- `dashboard_timer_updated`: Timer state changes for teacher
  ```typescript
  {
    timer: {
      startedAt: number | null;
      duration: number | null;
      isPaused: boolean;
      timeRemaining: number | null;
    };
    questionUid: string;
  }
  ```

### Backend → Live Room
- `game_timer_updated`: Timer state changes for students
  ```typescript
  {
    startedAt: number | null;
    duration: number | null;
    isPaused: boolean;
    timeRemaining: number | null;
    questionUid: string;
  }
  ```

## Implementation Rules

1. **No Frontend Countdown Logic**: Frontend should never calculate countdown independently
2. **Backend Timer Authority**: All timer decisions made by backend
3. **Immediate Sync**: Frontend must immediately sync with backend timer updates
4. **Status-Driven UI**: UI state (playing/paused/stopped) driven by backend status
5. **Zero Handling**: Only backend determines when timer reaches zero

## Error Prevention

- Frontend timers should never drift from backend state
- All timer modifications must go through backend
- No client-side timer manipulation allowed
- Backend validates all timer requests before applying
