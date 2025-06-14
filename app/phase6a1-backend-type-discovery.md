# Phase 6A.1: Backend Type Discovery Analysis

**Date**: June 14, 2025  
**Status**: 🔍 **IN PROGRESS - Backend Type Discovery**

## Backend Local Type Definitions Found

### **🔍 POTENTIAL DUPLICATES REQUIRING CONSOLIDATION**

#### **1. Socket Handler Types (CRITICAL DUPLICATES)**

**File**: `/backend/src/sockets/handlers/lobbyHandler.ts`
```typescript
export interface LobbyParticipant {         // ⚠️ Could use ParticipantData from shared
    id: string;           
    userId: string;     
    username: string;     
    avatarEmoji?: string;   
    joinedAt: number;     
}

export interface JoinLobbyPayload {         // ✅ Has Zod schema - OK
    accessCode: string;   
}

export interface LeaveLobbyPayload {        // ✅ Has Zod schema - OK
    accessCode: string;   
    userId: string;     
}

export interface GetParticipantsPayload {   // ✅ Has Zod schema - OK
    accessCode: string; 
}
```

**File**: `/backend/src/sockets/handlers/teacherControl/types.ts`
```typescript
export interface StartTimerPayload {       // ✅ Has Zod schema - OK
    gameId?: string;     
    accessCode?: string; 
    duration: number;    
}

export interface PauseTimerPayload {       // ✅ Has Zod schema - OK
    gameId?: string;     
    accessCode?: string; 
}

export type TimerActionPayload = CoreTimerActionPayload & {  // ⚠️ Extending shared type
    gameId: string;      
};

export type TimerState = GameTimerState;   // ✅ Alias to shared type - OK
```

**File**: `/backend/src/sockets/handlers/game/helpers.ts`
```typescript
export interface GameParticipant {         // ⚠️ Could use ParticipantData from shared
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    score: number;
    // ... more fields
}
```

#### **2. Service Layer Types (CRITICAL DUPLICATES)**

**File**: `/backend/src/core/services/gameInstanceService.ts`
```typescript
export type PlayMode = 'quiz' | 'tournament' | 'practice';  // ⚠️ DUPLICATE of shared PlayMode
export type GameStatus = 'pending' | 'active' | 'paused' | 'completed' | 'archived';  // ⚠️ Check shared

export interface GameInstanceCreationData {     // ⚠️ Could use shared GameInstance types
    name: string;
    gameTemplateId: string;
    initiatorUserId: string;
    playMode: PlayMode;
    // ... more fields
}

export interface GameStatusUpdateData {         // ⚠️ Could be shared
    status: GameStatus;
    // ... more fields
}
```

**File**: `/backend/src/core/services/questionService.ts`
```typescript
export interface QuestionCreationData {        // ⚠️ Could use shared Question types
    text: string;
    answerOptions: string[];
    correctAnswers: boolean[];
    questionType: string;
    // ... more fields
}

export interface QuestionUpdateData extends Partial<QuestionCreationData> {  // ⚠️ Derivative duplicate
    uid?: string;
}
```

**File**: `/backend/src/core/services/userService.ts`
```typescript
export type UserRole = 'STUDENT' | 'TEACHER';  // ⚠️ DUPLICATE of Prisma enum

export interface UserRegistrationData {        // ⚠️ Could use shared User types
    username: string;
    email: string;
    password: string;
    role: UserRole;
    // ... more fields
}

export interface UserLoginData {               // ⚠️ Could be shared auth type
    email: string;
    password: string;
}

export interface AuthResponse {                // ⚠️ Should be shared auth type
    user: User;
    token: string;
    expiresAt: string;
}
```

#### **3. Game Flow Types**

**File**: `/backend/src/sockets/handlers/sharedGameFlow.ts`
```typescript
export interface GameFlowOptions {            // ⚠️ Could be shared game config
    accessCode: string;
    gameInstance: any;
    questionsInTemplate: any[];
    // ... more fields
}
```

**File**: `/backend/src/core/gameStateService.ts`
```typescript
export interface GameState {                  // ⚠️ Should be shared game state
    gameId: string;
    status: string;
    currentQuestionIndex: number;
    questionUids: string[];
    // ... more fields
}
```

#### **4. Utility Types**

**File**: `/backend/src/core/services/gameTemplateService.ts`
```typescript
type PlayMode = 'quiz' | 'tournament' | 'practice';  // ⚠️ DUPLICATE

export interface StudentGameTemplateCreationData {    // ⚠️ Could use shared types
    name: string;
    questionUids: string[];
    // ... more fields
}

export interface GameTemplateCreationData {           // ⚠️ Could use shared types
    name: string;
    description?: string;
    // ... more fields
}
```

### **✅ LEGITIMATE LOCAL TYPES (Keep As-Is)**

#### **1. Authentication & Infrastructure**
- `JwtPayload` (middleware/auth.ts) - Authentication specific
- `Logger` interface (utils/logger.ts) - Utility specific
- `LogLevel` enum (utils/logger.ts) - Utility specific

#### **2. Zod-derived Types (Already Modernized)**
- `GameAnswerPayload` - z.infer from Zod schema ✅
- `JoinGamePayload` - z.infer from Zod schema ✅  
- `RequestParticipantsPayload` - z.infer from Zod schema ✅

#### **3. Configuration Types**
- `GameModeType` (config/gameModes.ts) - Configuration specific
- `AllowedAvatar` (utils/avatarUtils.ts) - Utility specific

## **TYPE MAPPING ANALYSIS**

### **🎯 DEFINITE DUPLICATES (Must Consolidate)**

#### **1. PlayMode Type - CRITICAL DUPLICATE**
**Backend Files**: 
- `/core/services/gameInstanceService.ts`: `export type PlayMode = 'quiz' | 'tournament' | 'practice';`
- `/core/services/quizTemplateService.ts`: `export type PlayMode = 'quiz' | 'tournament' | 'practice';`
- `/core/services/gameTemplateService.ts`: `type PlayMode = 'quiz' | 'tournament' | 'practice';`

**Shared Equivalent**: ✅ `/shared/types/core/game.ts`: `export type PlayMode = 'quiz' | 'tournament' | 'practice' | 'class';`

**Action**: Replace all backend PlayMode with `import { PlayMode } from '@shared/types/core'`

#### **2. Participant Types - CRITICAL DUPLICATE**
**Backend Files**:
- `/sockets/handlers/lobbyHandler.ts`: `LobbyParticipant` interface
- `/sockets/handlers/game/helpers.ts`: `GameParticipant` interface

**Shared Equivalent**: ✅ `/shared/types/core/participant.ts`: 
- `LobbyParticipant` ✅ **EXACT MATCH**
- `GameParticipant` ✅ **EXACT MATCH**

**Action**: Replace with `import { LobbyParticipant, GameParticipant } from '@shared/types/core'`

#### **3. User/Auth Types - DEFINITE DUPLICATE**
**Backend Files**:
- `/core/services/userService.ts`: `UserRole`, `UserRegistrationData`, `UserLoginData`

**Shared Equivalent**: ✅ `/shared/types/core/user.ts`:
- `UserRole` ✅ **EXACT MATCH**
- `UserRegistrationData` ✅ **EXACT MATCH** 
- `UserLoginData` ✅ **EXACT MATCH**

**Action**: Replace with `import { UserRole, UserRegistrationData, UserLoginData } from '@shared/types/core'`

#### **4. Game Creation/Update Types - PARTIAL DUPLICATE**
**Backend Files**:
- `/core/services/gameInstanceService.ts`: `GameInstanceCreationData`
- `/core/services/gameTemplateService.ts`: `GameTemplateCreationData`

**Shared Equivalent**: ✅ `/shared/types/core/game.ts`:
- `GameInstanceCreationData` ✅ **EXACT MATCH**
- `GameTemplateCreationData` ✅ **EXACT MATCH**

**Action**: Replace with `import { GameInstanceCreationData, GameTemplateCreationData } from '@shared/types/core'`

#### **5. Question Types - PARTIAL DUPLICATE**
**Backend Files**:
- `/core/services/questionService.ts`: `QuestionCreationData`, `QuestionUpdateData`

**Shared Equivalent**: ✅ `/shared/types/core/question.ts`:
- `QuestionCreationPayload` ✅ **EQUIVALENT** (rename needed)
- `QuestionUpdatePayload` ✅ **EQUIVALENT** (rename needed)

**Action**: Replace with `import { QuestionCreationPayload as QuestionCreationData, QuestionUpdatePayload as QuestionUpdateData } from '@shared/types/core'`

### **⚠️ MISSING SHARED TYPES (Need to Add)**

#### **1. GameState Interface**
**Backend File**: `/core/gameStateService.ts`: `GameState` interface
**Status**: ❌ **NOT IN SHARED** - Need to move to `/shared/types/core/game.ts`

#### **2. AuthResponse Interface**  
**Backend File**: `/core/services/userService.ts`: `AuthResponse` interface
**Status**: ❌ **NOT IN SHARED** - Need to move to `/shared/types/core/user.ts`

#### **3. GameFlowOptions Interface**
**Backend File**: `/sockets/handlers/sharedGameFlow.ts`: `GameFlowOptions` interface  
**Status**: ❌ **NOT IN SHARED** - Need to move to `/shared/types/core/game.ts`

### **✅ LEGITIMATE LOCAL TYPES (Keep As-Is)**

#### **1. Zod-derived Types** 
- All `z.infer<typeof schema>` types ✅ **CORRECT PATTERN**
- Socket payload types derived from Zod schemas ✅ **CORRECT PATTERN**

#### **2. Service-specific Internal Types**
- `JwtPayload` (auth middleware) ✅ **AUTH-SPECIFIC**
- `Logger` interface ✅ **UTILITY-SPECIFIC**
- Configuration enums ✅ **CONFIG-SPECIFIC**

## **CONSOLIDATION ACTION PLAN**

### **Phase 1: Critical Duplicates (Zero Risk)**
1. ✅ **PlayMode** - Simple type alias replacement
2. ✅ **UserRole/UserRegistrationData/UserLoginData** - Direct import replacement  
3. ✅ **LobbyParticipant/GameParticipant** - Direct import replacement
4. ✅ **GameInstanceCreationData/GameTemplateCreationData** - Direct import replacement

### **Phase 2: Missing Shared Types (Low Risk)**
1. **Move GameState to shared** - Add to `/shared/types/core/game.ts`
2. **Move AuthResponse to shared** - Add to `/shared/types/core/user.ts`
3. **Move GameFlowOptions to shared** - Add to `/shared/types/core/game.ts`

### **Phase 3: Partial Matches (Medium Risk)**
1. **Question types** - Rename imports with aliases
2. **Timer action types** - Validate compatibility with shared timer types

## **NEXT STEPS (Phase 6A.1.2)**

1. **Map to shared equivalents** - Check what shared types already exist
2. **Identify missing shared types** - What needs to be added to shared
3. **Create consolidation plan** - Step-by-step replacement strategy
4. **Validate dependencies** - Ensure no circular imports created
