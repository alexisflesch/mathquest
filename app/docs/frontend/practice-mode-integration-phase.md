# Practice Mode Integration Phase - Phase Plan

**Date**: May 27, 2025  
**Status**: 🚧 **PLANNING**

## Overview

With the Backend Socket Event Alignment phase now complete, the next major phase is to update the existing Practice Mode frontend to use the new backend socket system. The current practice mode uses direct API calls to fetch questions, but the new backend implements a socket-based practice mode with proper state management, feedback, and progression tracking.

## Current State Assessment

### ✅ What's Already Complete
- **Backend Practice Mode**: Fully implemented with socket events (`join_game`, `game_answer`, `request_next_question`, `game_ended`)
- **Backend Testing**: Comprehensive integration tests in `/backend/tests/integration/practiceMode.test.ts`
- **Practice Mode Documentation**: Complete flow documentation in `/docs/sockets/practice-mode-flow.md`
- **Frontend Practice Page**: Basic practice session page exists at `/frontend/src/app/student/practice/session/page.tsx`

### 🚨 What Needs Migration
- **Frontend Socket Integration**: Current practice page uses API calls instead of socket events
- **State Management**: Update to use proper socket-based state management like live tournaments
- **Feedback System**: Implement immediate answer feedback using `answer_received` events
- **Progression Control**: Update "Next Question" flow to use `request_next_question` events
- **Game Completion**: Update completion flow to use `game_ended` events

## Phase Objectives

### 1. ✅ Create Practice Mode Socket Hook
- [ ] **`usePracticeGameSocket`** - New custom hook for practice mode socket management
  - [ ] Socket connection with authentication
  - [ ] Event handlers for practice-specific events (`game_question`, `answer_received`, `game_ended`)
  - [ ] State management for current question, score, feedback, completion status
  - [ ] Action functions (`joinPractice`, `submitAnswer`, `requestNextQuestion`)
  - [ ] Error handling and disconnection management

### 2. ✅ Update Practice Session Page
- [ ] **Replace API calls with socket integration**
  - [ ] Remove direct fetch calls to `/api/questions`
  - [ ] Integrate `usePracticeGameSocket` hook
  - [ ] Update component state to use socket-provided data
- [ ] **Implement proper practice flow**
  - [ ] Socket-based game joining with practice parameters
  - [ ] Question display using socket-provided question data
  - [ ] Answer submission via socket events
  - [ ] Feedback display after each answer
  - [ ] Manual progression with "Next Question" button
  - [ ] Game completion with final score display

### 3. ✅ Practice Mode Creation Integration
- [ ] **Update practice tournament creation**
  - [ ] Ensure practice games are created with `isDiffered: true` flag
  - [ ] Integrate with backend game instance creation
  - [ ] Proper access code generation for practice sessions
- [ ] **Connection Flow**
  - [ ] Update practice session URL routing
  - [ ] Proper authentication and game joining
  - [ ] Error handling for practice mode availability

### 4. ✅ Enhanced User Experience
- [ ] **Feedback System**
  - [ ] Immediate answer feedback with correct answer display
  - [ ] Explanation display when available
  - [ ] Progress tracking (X of Y questions completed)
- [ ] **State Persistence**
  - [ ] Session recovery on page refresh
  - [ ] Proper cleanup on navigation away
  - [ ] Progress saving for longer practice sessions

### 5. ✅ Testing & Validation
- [ ] **Unit Tests**
  - [ ] Test suite for `usePracticeGameSocket` hook
  - [ ] Component tests for updated practice session page
  - [ ] Mock socket integration for testing
- [ ] **Integration Testing**
  - [ ] End-to-end practice mode flow testing
  - [ ] Backend socket integration validation
  - [ ] Error scenario testing (disconnection, invalid states)

## Technical Implementation Details

### New Practice Mode Socket Events Flow

```typescript
// 1. Join practice session
socket.emit('join_game', {
  accessCode: practiceCode,
  userId: student.id,
  username: student.username,
  isDiffered: true
});

// 2. Receive first question
socket.on('game_question', (question) => {
  // Display question to student
});

// 3. Submit answer
socket.emit('game_answer', {
  accessCode: practiceCode,
  userId: student.id,
  questionId: currentQuestion.uid,
  answer: selectedAnswer,
  timeSpent: timeUsed
});

// 4. Receive feedback
socket.on('answer_received', (feedback) => {
  // Show correct/incorrect feedback with explanation
});

// 5. Request next question
socket.emit('request_next_question', {
  accessCode: practiceCode,
  userId: student.id,
  currentQuestionId: currentQuestion.uid
});

// 6. Game completion
socket.on('game_ended', (results) => {
  // Display final score and completion status
});
```

### Key Architectural Changes

1. **Remove Direct API Dependencies**: Replace `/api/questions` calls with socket events
2. **State Management Update**: Use socket-provided state instead of local question arrays
3. **Real-time Feedback**: Implement immediate answer feedback system
4. **Manual Progression**: Add "Next Question" button with socket event triggers
5. **Error Handling**: Proper socket disconnection and error state management

## Files to Modify

### Frontend Files
- `/frontend/src/hooks/usePracticeGameSocket.ts` - **NEW** - Practice mode socket hook
- `/frontend/src/app/student/practice/session/page.tsx` - **UPDATE** - Convert to socket-based
- `/frontend/src/app/student/create-game/page.tsx` - **UPDATE** - Practice mode integration
- `/frontend/src/components/QuestionCard.tsx` - **VALIDATE** - Ensure compatibility with practice mode

### Backend Files (Validation Only)
- `/backend/src/sockets/handlers/game/joinGame.ts` - **VALIDATE** - Practice mode support
- `/backend/src/sockets/handlers/game/gameAnswer.ts` - **VALIDATE** - Practice feedback
- `/backend/src/sockets/handlers/game/requestNextQuestion.ts` - **VALIDATE** - Practice progression

### Testing Files
- `/frontend/src/hooks/__tests__/usePracticeGameSocket.*.test.ts` - **NEW** - Hook test suites
- `/frontend/src/app/student/practice/__tests__/session.test.tsx` - **NEW** - Component tests

## Success Criteria

1. ✅ **Functional Practice Mode**: Students can complete practice sessions using socket events
2. ✅ **Immediate Feedback**: Answer feedback displays correctly after each submission
3. ✅ **Manual Progression**: Students control question progression with "Next Question" button
4. ✅ **Proper Completion**: Final score and results display correctly
5. ✅ **Error Handling**: Graceful handling of disconnections and errors
6. ✅ **Test Coverage**: Comprehensive test suite for practice mode functionality
7. ✅ **Backend Integration**: Seamless integration with existing backend practice mode

## Expected Timeline

- **Week 1**: `usePracticeGameSocket` hook development and testing
- **Week 2**: Practice session page migration and integration
- **Week 3**: Enhanced UX features and comprehensive testing
- **Week 4**: Integration testing and documentation updates

## Dependencies

- ✅ Backend Socket Event Alignment (COMPLETED)
- ✅ Shared Types Alignment (COMPLETED)
- ✅ Backend Practice Mode Implementation (COMPLETED)
- ✅ Frontend Socket Infrastructure (COMPLETED)

## Next Steps

1. **Start with Hook Development**: Create `usePracticeGameSocket` following patterns from `useStudentGameSocket`
2. **Mock Integration**: Test hook with backend practice mode integration tests
3. **Page Migration**: Update practice session page to use new socket hook
4. **User Testing**: Validate complete practice flow end-to-end

This phase represents a significant enhancement to the student experience by providing real-time feedback and proper state management for practice sessions, while aligning with the new backend architecture.
