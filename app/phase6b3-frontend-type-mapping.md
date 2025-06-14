# Phase 6B.1.3: Frontend Type Mapping & Migration Strategy

**Date**: June 14, 2025  
**Phase**: 6B.1.3 - Map frontend types to shared equivalents  
**Status**: 🗺️ **TYPE MAPPING**

---

## 🎯 **OBJECTIVE**

Create detailed field-by-field mapping between frontend types and shared types, with explicit migration strategies and shared type enhancement requirements.

---

## 📋 **DETAILED TYPE MAPPING MATRIX**

### **1. GameState Type Mapping** ⚠️ **COMPLEX MIGRATION**

#### **1.1 useStudentGameSocket.ts GameState → Hybrid Approach**

| Frontend Field | Shared GameState | Migration Strategy | Notes |
|---------------|------------------|-------------------|-------|
| `currentQuestion: FilteredQuestion \| null` | `questionData?: any` | **Map to shared** | Use shared `questionData` field |
| `questionIndex: number` | `currentQuestionIndex: number` | **Direct map** | Same purpose, compatible |
| `totalQuestions: number` | Calculate from `questionUids.length` | **Derive from shared** | Calculate from shared data |
| `timer: number \| null` | `timer: GameTimerState` | **⚠️ BREAKING CHANGE** | Frontend needs UI timer state |
| `timerStatus: 'play' \| 'pause' \| 'stop'` | `timer.status` | **Map to shared timer** | Use shared timer structure |
| `gameStatus: 'waiting' \| 'active' \| 'paused' \| 'finished'` | `status: 'pending' \| 'active' \| 'paused' \| 'completed'` | **⚠️ VALUE MAPPING** | Map values: waiting→pending, finished→completed |
| `answered: boolean` | **No shared equivalent** | **Keep as UI state** | Frontend-specific UI state |
| `connectedToRoom: boolean` | **No shared equivalent** | **Keep as UI state** | Frontend-specific connection state |
| `phase: 'question' \| 'feedback' \| 'show_answers'` | **No shared equivalent** | **Keep as UI state** | Frontend-specific phase state |
| `feedbackRemaining: number \| null` | **No shared equivalent** | **Keep as UI state** | Frontend-specific feedback timer |
| `correctAnswers: boolean[] \| null` | **No shared equivalent** | **Keep as UI state** | Frontend-specific answer feedback |
| `gameMode?: 'tournament' \| 'quiz' \| 'practice'` | **Add to shared** | **Enhance shared GameState** | Should be in shared game data |
| `linkedQuizId?: string \| null` | **Add to shared** | **Enhance shared GameState** | Should be in shared game data |
| `lastAnswerFeedback?: AnswerReceived \| null` | **No shared equivalent** | **Keep as UI state** | Frontend-specific feedback |

**🔄 MIGRATION STRATEGY**:
```typescript
// Rename current frontend type
interface LocalGameUIState {
    // UI-specific fields only
    answered: boolean;
    connectedToRoom: boolean;
    phase: 'question' | 'feedback' | 'show_answers';
    feedbackRemaining: number | null;
    correctAnswers: boolean[] | null;
    lastAnswerFeedback?: AnswerReceived | null;
    // Derived fields from shared GameState
    currentQuestion: FilteredQuestion | null;  // Derived from shared.questionData
    questionIndex: number;                      // From shared.currentQuestionIndex
    totalQuestions: number;                     // From shared.questionUids.length
    timer: number | null;                       // From shared.timer.timeLeftMs
    timerStatus: 'play' | 'pause' | 'stop';    // From shared.timer.status
    gameStatus: LocalGameStatus;                // Mapped from shared.status
}

// Use shared GameState for backend data
import { GameState } from '@shared/types/core/game';

// Hook manages both
interface StudentGameSocketHook {
    sharedGameState: GameState;           // From backend
    localUIState: LocalGameUIState;       // For UI
    // ... other fields
}
```

#### **1.2 useUnifiedGameManager.ts GameState → Hybrid Approach**

| Frontend Field | Shared GameState | Migration Strategy | Notes |
|---------------|------------------|-------------------|-------|
| `gameId: string \| null` | `gameId: string` | **Direct map** | Use shared required field |
| `role: TimerRole` | **No shared equivalent** | **Keep as UI state** | Frontend-specific role management |
| `connected: boolean` | **No shared equivalent** | **Keep as UI state** | Frontend-specific connection state |
| `connecting: boolean` | **No shared equivalent** | **Keep as UI state** | Frontend-specific connection state |
| `error: string \| null` | **No shared equivalent** | **Keep as UI state** | Frontend-specific error state |
| `timer: TimerState` | `timer: GameTimerState` | **⚠️ TYPE MAPPING** | Map TimerState to GameTimerState |
| `isTimerRunning: boolean` | `timer.isRunning` | **Map to shared timer** | Use shared timer structure |
| Other fields... | Similar to above | **Follow same pattern** | Split UI vs shared data |

### **2. QuizState Type Mapping** ✅ **DIRECT REPLACEMENT**

| Frontend Field | Shared ExtendedQuizState | Migration Strategy | Notes |
|---------------|--------------------------|-------------------|-------|
| `currentQuestionidx?: number \| null` | `currentQuestionidx?: number \| null` | **✅ EXACT MATCH** | Direct replacement |
| `currentQuestionUid?: string \| null` | `currentQuestionUid: string \| null` | **✅ EXACT MATCH** | Direct replacement |
| `questions: Question[]` | `questions: Question[]` | **✅ EXACT MATCH** | Direct replacement |
| `chrono: {...}` | `chrono: Chrono` | **✅ COMPATIBLE** | Shared Chrono has same structure |
| `locked: boolean` | `locked: boolean` | **✅ EXACT MATCH** | Direct replacement |
| `ended: boolean` | `ended: boolean` | **✅ EXACT MATCH** | Direct replacement |
| `stats: Record<string, any>` | `stats?: Record<string, any>` | **✅ COMPATIBLE** | Direct replacement |
| All other fields... | **All present in ExtendedQuizState** | **✅ DIRECT REPLACEMENT** | Perfect compatibility |

**🎯 MIGRATION STRATEGY**:
```typescript
// Simple import replacement
// OLD:
export interface QuizState { ... }

// NEW:
import { ExtendedQuizState as QuizState } from '@shared/types/quiz/state';
```

### **3. SocketConfig Type Mapping** 🔄 **RENAME & CLARIFY**

#### **3.1 useGameSocket.ts SocketConfig → GameSocketConfig**

| Frontend Field | Shared Equivalent | Migration Strategy | Notes |
|---------------|-------------------|-------------------|-------|
| `role: TimerRole` | **No shared equivalent** | **Keep as frontend type** | Game-specific configuration |
| `autoConnect?: boolean` | **No shared equivalent** | **Keep as frontend type** | Frontend behavior config |
| `autoReconnect?: boolean` | **No shared equivalent** | **Keep as frontend type** | Frontend behavior config |
| `requireAuth?: boolean` | **No shared equivalent** | **Keep as frontend type** | Frontend auth config |
| `roomPrefix?: string` | **No shared equivalent** | **Keep as frontend type** | Frontend room naming |

**🔄 MIGRATION STRATEGY**:
```typescript
// Rename to clarify purpose
interface GameSocketConfig {
    role: TimerRole;
    autoConnect?: boolean;
    autoReconnect?: boolean;
    requireAuth?: boolean;
    roomPrefix?: string;
}
```

#### **3.2 types/socket.ts SocketConfig → Keep As-Is**

| Frontend Field | Shared Equivalent | Migration Strategy | Notes |
|---------------|-------------------|-------------------|-------|
| `query?: Record<string, string>` | **No shared equivalent** | **Keep as generic type** | Generic Socket.IO config |
| `auth?: Record<string, string>` | **No shared equivalent** | **Keep as generic type** | Generic Socket.IO auth |
| `timeout?: number` | **No shared equivalent** | **Keep as generic type** | Generic Socket.IO timeout |
| `[key: string]: unknown` | **No shared equivalent** | **Keep as generic type** | Generic extension |

**✅ MIGRATION STRATEGY**: No changes needed - legitimate generic type

### **4. Auth Type Mapping** 🔄 **ENHANCE SHARED TYPES**

#### **4.1 Frontend Auth Types → Enhance Shared**

| Frontend Type | Shared Equivalent | Migration Strategy | Notes |
|--------------|-------------------|-------------------|-------|
| `UserState` | **Add to shared** | **Create shared type** | Add to `@shared/types/core/user.ts` |
| `UserProfile` | **Map to shared User** | **Bridge with shared User** | Create mapping helper |
| `AuthContextType` | **No shared equivalent** | **Keep as frontend type** | Frontend-specific context |
| `GuestProfileData` | **Add to shared** | **Create shared type** | Add to shared user types |

**🎯 SHARED TYPE ENHANCEMENTS NEEDED**:
```typescript
// Add to @shared/types/core/user.ts
export type UserState = 'anonymous' | 'guest' | 'student' | 'teacher';

export interface GuestProfileData {
    username: string;
    avatar: string;
    cookieId?: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    userState: UserState;
    token?: string;
    error?: string;
}
```

---

## 🔧 **SHARED TYPE ENHANCEMENT REQUIREMENTS**

### **1. Core Game Type Enhancements**

#### **1.1 GameState Enhancements**
```typescript
// Add to @shared/types/core/game.ts
export interface GameState {
    // ... existing fields ...
    gameMode?: 'tournament' | 'quiz' | 'practice' | 'class';  // Add gameMode
    linkedQuizId?: string | null;                              // Add linkedQuizId
    // Enhanced timer to include UI-friendly fields
    timer: GameTimerState & {
        timeLeftMs?: number;        // For frontend compatibility
        displayFormat?: string;     // For UI formatting
    };
}

// Add local game status mapping
export type LocalGameStatus = 'waiting' | 'active' | 'paused' | 'finished';
export type SharedGameStatus = 'pending' | 'active' | 'paused' | 'completed';

export const mapGameStatus = {
    'pending': 'waiting' as LocalGameStatus,
    'active': 'active' as LocalGameStatus,
    'paused': 'paused' as LocalGameStatus,
    'completed': 'finished' as LocalGameStatus
};
```

#### **1.2 Timer Type Enhancements**
```typescript
// Ensure GameTimerState is frontend-compatible
export interface GameTimerState {
    timeLeftMs: number | null;
    totalTimeMs: number;
    isRunning: boolean;
    status: 'play' | 'pause' | 'stop';
    startedAt?: number;
    pausedAt?: number;
    // Add UI-friendly fields
    displayFormat?: 'mm:ss' | 'ss' | 'ms';
    showMilliseconds?: boolean;
}
```

### **2. User Type Enhancements**
```typescript
// Add to @shared/types/core/user.ts
export type UserState = 'anonymous' | 'guest' | 'student' | 'teacher';

export interface GuestProfileData {
    username: string;
    avatar: string;
    cookieId?: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    userState: UserState;
    token?: string;
    error?: string;
}
```

---

## 📋 **MIGRATION ACTION PLAN**

### **Phase 6B.2.1: Direct Replacements** ✅ **HIGH PRIORITY**
1. **QuizState**: Replace with `ExtendedQuizState` import
2. **API types**: Clean up legacy aliases in `types/api.ts`

### **Phase 6B.2.2: Hybrid Migrations** ⚠️ **COMPLEX**
1. **GameState**: Implement hybrid approach with UI state separation
2. **Enhanced GameState**: Follow same pattern as GameState
3. **Socket configs**: Rename for clarity

### **Phase 6B.2.3: Shared Type Enhancements** 🔧 **FOUNDATION**
1. **Add UserState, GuestProfileData, AuthResponse** to shared types
2. **Enhance GameState** with gameMode, linkedQuizId fields
3. **Enhance GameTimerState** with UI-friendly fields

### **Phase 6B.2.4: Import Optimization** 🧹 **CLEANUP**
1. **Update all imports** to use enhanced shared types
2. **Remove obsolete local types**
3. **Validate TypeScript compilation**

---

## ✅ **PHASE 6B.1.3 COMPLETION STATUS**

- [x] **GameState mapping**: Detailed hybrid migration strategy defined
- [x] **QuizState mapping**: Direct replacement strategy confirmed  
- [x] **SocketConfig mapping**: Rename strategy defined
- [x] **Auth type mapping**: Shared enhancement strategy planned
- [x] **Shared type enhancements**: Requirements documented
- [x] **Migration action plan**: Detailed steps prioritized

**📋 Ready to proceed to Phase 6B.1.4: Create comprehensive frontend type analysis report**
