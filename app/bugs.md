# Documented Bugs

This file documents bugs found during codebase exploration. These are not fixed as per the plan.

## Potential Bugs

### 1. Auth API - Password Reset Token Reuse
- **Location**: `backend/src/api/v1/auth.ts` - `reset-password/confirm` endpoint
- **Issue**: Password reset tokens might be reusable if not invalidated after use
- **Impact**: Security vulnerability allowing replay attacks
- **Evidence**: Token is used once but not marked as used in database

### 2. Socket.IO - No Rate Limiting
- **Location**: `backend/src/sockets/index.ts`
- **Issue**: No rate limiting on socket events, potential for DoS attacks
- **Impact**: Server could be overwhelmed by rapid socket connections
- **Evidence**: No middleware for rate limiting in socket handlers

### 3. Timer Service - Race Conditions
- **Location**: `backend/src/core/services/canonicalTimerService.ts`
- **Issue**: Potential race conditions in Redis operations for timer management
- **Impact**: Inconsistent timer states in concurrent scenarios
- **Evidence**: Multiple Redis operations without transactions

### 4. Question Validation - LaTeX Injection
- **Location**: `backend/src/api/v1/questions.ts`
- **Issue**: LaTeX content in questions not properly sanitized
- **Impact**: Potential XSS through malformed LaTeX rendering
- **Evidence**: Only basic Zod validation, no LaTeX-specific sanitization

### 5. Database - No Connection Pool Limits
- **Location**: `backend/src/db/prisma.ts`
- **Issue**: Prisma client has no connection pool limits configured
- **Impact**: Potential database connection exhaustion
- **Evidence**: Default Prisma configuration used

### 6. Frontend - No Error Boundaries for Socket Errors
- **Location**: `frontend/src/hooks/useGameSocket.ts`
- **Issue**: Socket connection errors not properly handled in React components
- **Impact**: Unhandled errors could crash the app
- **Evidence**: No try-catch in socket event handlers

### 7. Email Service - No Retry Mechanism
- **Location**: `backend/src/core/services/emailService.ts` (assumed)
- **Issue**: Email sending failures have no retry logic
- **Impact**: Important emails (verification, password reset) might not be delivered
- **Evidence**: No retry configuration in email service

### 8. Tournament Mode - Leaderboard Race Conditions
- **Location**: `backend/src/sockets/handlers/tournament/`
- **Issue**: Concurrent score updates might cause leaderboard inconsistencies
- **Impact**: Incorrect rankings in tournaments
- **Evidence**: Multiple Redis operations for leaderboard updates without atomicity

### 9. Practice Mode - Session Persistence
- **Location**: `backend/src/core/services/practiceSessionService.ts`
- **Issue**: Practice sessions might not persist correctly across browser refreshes
- **Impact**: Loss of progress in practice mode
- **Evidence**: No explicit session recovery logic

### 10. File Upload - No Size Limits
- **Location**: Question creation endpoints
- **Issue**: No file size limits for question attachments/images
- **Impact**: Potential DoS through large file uploads
- **Evidence**: No multer or similar middleware with size limits
