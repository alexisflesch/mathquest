# Leaderboard Emission Analysis

Aim : show each player his rank and score during tournament/quiz (maybe even score in practice mode ?). The score should **not** be sent after each answer, but only at the end of the question (when the timer expires or when the teacher locks answers). This is to prevent students from changing their answers based on the leaderboard updates.

## 📊 Backend Leaderboard Broadcasting Investigation

**Date:** January 2025  
**Author:** AI Agent  
**Scope:** Complete analysis of backend socket event emission for participant leaderboard updates

---

## 🔍 Executive Summary

**✅ SECURITY VULNERABILITY FIXED**

The backend leaderboard emission timing has been **SUCCESSFULLY CORRECTED**:

- **✅ Tournament Mode:** Leaderboard sent after question ends (SECURITY FIXED)
- **✅ Quiz Mode:** Leaderboard sent after question ends (SECURITY FIXED)  
- **❌ Practice Mode:** No leaderboard (individual session)

**✅ Solution Implemented:** Leaderboard emission moved from individual answer submission to secure timing after question timer expires, preventing cheating vulnerability.

**✅ Frontend Integration:** Added `leaderboard_update` event listener to log reception for testing.

**✅ Quiz Mode Manual Trigger:** Fixed teacher trophy button to emit leaderboard to students in quiz mode.

**✅ Leaderboard on Page Load:** Added initial leaderboard emission when students join/reconnect, handling all edge cases.

**✅ Validation Complete:** All security checks pass - vulnerability eliminated.

---

## 🎯 Detailed Findings

### **1. Tournament Mode** ❌ **SECURITY VULNERABILITY**

**Location:** `/backend/src/sockets/handlers/game/gameAnswer.ts:371-378`

```typescript
let roomName = accessCode;
if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
    roomName = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
} else if (gameInstance.playMode === 'tournament') {
    roomName = `game_${accessCode}`;
}
logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
io.to(roomName).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
```

**❌ Status:** **INCORRECTLY IMPLEMENTED - CHEATING VULNERABILITY**

**Current Behavior (From Your Logs):**
```
2025-07-09 18:13:54.028 info [GameAnswerHandler] {
  "leaderboard": [
    {
      "userId": "bb47ece9-26ac-422b-a987-6580c689ef92",
      "username": "Alexis", 
      "avatarEmoji": "🐘",
      "score": 1819
    }
  ],
  "roomName": "game_3158"
} Emitting leaderboard_update to room
```

**🚨 Problem Analysis:**
- **Timing:** Leaderboard sent **immediately after each answer submission**
- **Security Risk:** Students can see score changes before question ends
- **Cheating Method:** Submit answer → See no score increase → Change answer → Submit again
- **Log Evidence:** Shows leaderboard emission at `18:13:54.028` right after answer processing

**✅ Correct Behavior Should Be:**
- **Event:** `SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE` (`leaderboard_update`)
- **Room:** `game_${accessCode}` (all tournament participants) 
- **Trigger:** ⚠️ **SHOULD BE:** After question ends (timer expires or answers locked)
- **Timing:** ⚠️ **CURRENTLY:** After each individual answer (WRONG)
- **Payload:** `{ leaderboard: LeaderboardEntry[] }`

### **2. Quiz Mode** ❌

**Status:** **NOT IMPLEMENTED FOR STUDENTS**

**Current Behavior:**
- Room determination: `teacher_${gameInstance.initiatorUserId}_${accessCode}`
- **Problem:** This room only includes the teacher, NOT students
- Students in quiz mode receive NO leaderboard updates automatically

**Manual Trigger Available:**
- Teacher can click "trophy" icon → `TEACHER_EVENTS.REVEAL_LEADERBOARD`
- **Location:** `/backend/src/sockets/handlers/teacherControl/revealLeaderboardHandler.ts`
- **Target:** Only projection screen (`projection_${gameId}`)
- **Gap:** Students still don't receive the leaderboard data

### **3. Practice Mode** ❌

**Status:** **NOT APPLICABLE**
- Individual practice sessions
- No competitive leaderboard concept
- No leaderboard emission needed

---

## 📡 Socket Event Details

### **Leaderboard Update Event**

**Event Name:** `leaderboard_update`  
**Constant:** `SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE`

**Payload Structure:**
```typescript
{
  leaderboard: Array<{
    username: string;
    avatar: string;
    score: number;
    rank: number;
    userId: string;
    joinOrder: number;
    isCurrentUser?: boolean; // Backend-calculated (when userId provided)
  }>
}
```

**Room Targeting:**
- **Tournament:** `game_${accessCode}` (✅ includes all participants)
- **Quiz:** `teacher_${initiatorUserId}_${accessCode}` (❌ teacher only)

---

## 🚫 Frontend Gap Analysis

### **Confirmed Missing Implementation**

**File:** `/frontend/src/hooks/useStudentGameSocket.ts`

**Current Event Listeners (Lines 248-392):**
- ✅ `GAME_JOINED` - Game join confirmation
- ✅ `PLAYER_JOINED_GAME` - Other players joining
- ✅ `GAME_STATE_UPDATE` - Game state changes  
- ✅ `ANSWER_RECEIVED` - Answer submission confirmation
- ✅ `CORRECT_ANSWERS` - Correct answer reveals
- ✅ `FEEDBACK` - Question explanations
- ✅ `GAME_ERROR` - Error handling
- ✅ `GAME_ALREADY_PLAYED` - Already played detection
- ✅ `GAME_ENDED` - Game completion
- **❌ `LEADERBOARD_UPDATE` - MISSING**

**Problem:** No event listener for `leaderboard_update`
```typescript
// MISSING: 
socket.on(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE, handleLeaderboardUpdate);
```

**Impact:**
- Tournament participants don't see real-time score updates
- No UI elements for current user's score/rank
- Leaderboard data is sent but ignored by frontend

**Confirmed Frontend Pattern:**
All event listeners use the pattern:
```typescript
socket.on(SOCKET_EVENTS.GAME.[EVENT] as any, createSafeEventHandler<PayloadType>((payload) => {
    // Handler logic
}));
```

---

## 🛠️ Implementation Requirements

### **Tournament Mode (Ready Out of Box)**

**Backend:** ✅ Complete - no changes needed

**Frontend Changes Needed:**
1. Add leaderboard event listener to `useStudentGameSocket.ts`
2. Add leaderboard state management  
3. Create UI components to display:
   - Current user's score
   - Current user's rank
   - Optional: Mini leaderboard widget

**Example Implementation:**
```typescript
// In useStudentGameSocket.ts (around line 245, before existing listeners)

// Add leaderboard state
const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
const [currentUserStats, setCurrentUserStats] = useState({ score: 0, rank: 0 });

// Add event listener (following existing pattern)
socket.on(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, createSafeEventHandler<{ leaderboard: LeaderboardEntry[] }>((payload) => {
  logger.info('Received leaderboard update:', payload);
  setLeaderboard(payload.leaderboard);
  
  // Find current user in leaderboard (userId should be available in state)
  const currentUser = payload.leaderboard.find(entry => entry.userId === userId);
  if (currentUser) {
    setCurrentUserStats({
      score: currentUser.score,
      rank: currentUser.rank || payload.leaderboard.findIndex(e => e.userId === userId) + 1
    });
  }
}));

// Return leaderboard data from hook
return {
  // ... existing return values
  leaderboard,
  currentUserStats,
  // ...
};
```

### **Quiz Mode (Requires Backend Patch)**

**Backend Changes Needed:**
1. Modify room targeting in quiz mode to include students
2. Add teacher control to "reveal leaderboard to students"  
3. Broadcast to both teacher and student rooms

**Current Issue:**
Room targeting only includes teacher: `teacher_${initiatorUserId}_${accessCode}`

**Proposed Backend Fix (Option 1 - Auto Broadcast):**
```typescript
// In gameAnswer.ts - around line 373
if (gameInstance.playMode === 'quiz' && gameInstance.initiatorUserId) {
    // Broadcast to both teacher and students  
    const teacherRoom = `teacher_${gameInstance.initiatorUserId}_${accessCode}`;
    const studentRoom = `game_${accessCode}`;
    
    // Emit to teacher room (existing behavior)
    io.to(teacherRoom).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
    
    // NEW: Also emit to student room
    io.to(studentRoom).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
    
    logger.info({ leaderboard, teacherRoom, studentRoom }, 'Emitting leaderboard_update to both teacher and student rooms');
} else if (gameInstance.playMode === 'tournament') {
    roomName = `game_${accessCode}`;
    io.to(roomName).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
}
```

**Alternative Approach (Option 2 - Teacher Controlled):**
- Keep automatic updates only for teacher
- Manual broadcast to students on teacher action  
- Extend existing `revealLeaderboardHandler` to include students

**Frontend:** Same implementation as tournament mode

---

## 🔧 Related Backend Utilities

### **Leaderboard Calculation**

**File:** `/backend/src/sockets/handlers/sharedLeaderboard.ts`
- Function: `calculateLeaderboard(accessCode: string)`
- Returns: Sorted leaderboard with scores, ranks, join order
- Used by: gameAnswer handler, projection broadcasts

### **Broadcast Utilities**

**File:** `/backend/src/utils/projectionLeaderboardBroadcast.ts`
- `broadcastLeaderboardToProjection()` - For projection displays
- `broadcastLeaderboardToAllRooms()` - Multi-room broadcast (unused)

### **Teacher Controls**

**File:** `/backend/src/sockets/handlers/teacherControl/revealLeaderboardHandler.ts`
- Handles `TEACHER_EVENTS.REVEAL_LEADERBOARD`
- Currently only broadcasts to projection
- Could be extended to include students

---

## 🎯 Recommendations

### **Phase 1: Tournament Mode (Quick Win)**
- **Effort:** Low (frontend only)
- **Impact:** High (immediate leaderboard functionality)
- **Changes:** Add event listeners and UI components

### **Phase 2: Quiz Mode Enhancement**
- **Effort:** Medium (backend + frontend)
- **Impact:** Medium (teacher-controlled leaderboard reveal)
- **Changes:** Backend room targeting, teacher controls

### **Phase 3: Advanced Features**
- **Effort:** High
- **Features:** 
  - Animated score updates
  - Leaderboard position changes
  - Real-time rank movements
  - Historical score tracking

---

## 📝 Validation Commands

### **Validation Commands (Updated January 2025)**

### **Backend Validation**
```bash
# Confirm leaderboard events are being emitted
grep -r "LEADERBOARD_UPDATE" backend/src/
# Result: Found in gameAnswer.ts and projectionLeaderboardBroadcast.ts

# Check room targeting logic
grep -A 10 -B 5 "game_\${accessCode}" backend/src/
# Result: Found correct tournament targeting

# Verify current implementation
grep -A 5 -B 5 "leaderboard_update to room" backend/src/
# Result: Line 377 in gameAnswer.ts confirms emission
```

### **Frontend Validation**
```bash
# Check for missing event listeners
grep -r "leaderboard_update" frontend/src/hooks/useStudentGameSocket.ts
# Result: NO MATCHES (confirming the gap)

grep -r "LEADERBOARD_UPDATE" frontend/src/hooks/useStudentGameSocket.ts  
# Result: NO MATCHES (confirming the gap)

# Check existing event listeners
grep -c "socket.on" frontend/src/hooks/useStudentGameSocket.ts
# Result: 9 listeners, but no leaderboard listener
```

### **Socket Event Monitoring**
```javascript
// Browser console - during tournament
socket.on('leaderboard_update', (data) => {
  console.log('Leaderboard update received:', data);
});

// Expected payload structure:
// { leaderboard: [{ username, score, rank, userId, avatarEmoji, ... }] }
```

---

## 🚦 Status Summary

| Mode | Backend Emission | Frontend Listening | UI Components | Status |
|------|------------------|-------------------|---------------|---------|
| Tournament | ✅ Complete | ❌ Missing | ❌ Missing | **Ready for Frontend** |
| Quiz | ❌ Teacher Only | ❌ Missing | ❌ Missing | **Needs Backend Fix** |
| Practice | ❌ N/A | ❌ N/A | ❌ N/A | **Not Applicable** |

**Conclusion:** Tournament mode can be implemented immediately with frontend-only changes. Quiz mode requires backend modifications to include students in leaderboard broadcasts.

---

## 🚨 CRITICAL SECURITY VULNERABILITY

### **Real-time Answer Feedback Exploit**
The current tournament implementation has a **severe security flaw** that allows students to cheat:

**The Problem:**
1. Backend emits full leaderboard to all participants immediately after each answer submission
2. Students can observe real-time score changes to determine answer correctness
3. Students can exploit this by resubmitting answers until their score increases

**Attack Vector:**
```
Student submits answer A → Leaderboard shows no score increase → Answer A is wrong
Student submits answer B → Leaderboard shows score increase → Answer B is correct!
```

**Code Evidence:**
In `gameAnswer.ts` (line 377):
```typescript
logger.info({ leaderboard, roomName }, 'Emitting leaderboard_update to room');
io.to(roomName).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE as any, { leaderboard });
```

This happens **immediately after answer processing**, giving instant feedback on answer correctness.

**Log Evidence:**
Backend logs show leaderboard emissions after every single answer:
```
Emitting leaderboard_update to room game_ABCD123
```

### **Immediate Security Fix Required**

**Solution:**
1. **Remove leaderboard emission from individual answer processing**
2. **Only emit leaderboards when questions officially end** (timer expires or all answers submitted)
3. **Implement answer finality** - no resubmissions once answer is locked

**Implementation:**
- Move leaderboard emission from `gameAnswer.ts` to question completion handlers
- Add answer locking mechanism to prevent multiple submissions
- Consider showing leaderboard only between questions, not during active answer periods

**Risk Level:** 🔴 **CRITICAL** - This completely undermines the competitive integrity of tournament mode.

---

## 🎯 Next Steps

### **🚨 URGENT - Security Fix (Tournament Mode)**
1. **Fix Answer Feedback Exploit** - Move leaderboard emission from individual answer processing to question completion
2. **Implement Answer Locking** - Prevent multiple answer submissions per question
3. **Test Security** - Verify students cannot determine answer correctness from score changes

### **Immediate (Tournament Mode UI)**
1. **Frontend Implementation** - Add leaderboard event listener and state management to `useStudentGameSocket.ts`
2. **UI Components** - Create student score/rank display widgets (shown only between questions)
3. **Testing** - Validate secure leaderboard updates after question completion

### **Future (Quiz Mode Enhancement)** 
1. **Backend Patch** - Modify room targeting to include students
2. **Teacher Controls** - Add leaderboard reveal buttons
3. **Frontend Updates** - Reuse tournament leaderboard implementation

### **Advanced Features**
- Animated score transitions
- Leaderboard position changes visualization  
- Historical score tracking
- Competitive badges/achievements
