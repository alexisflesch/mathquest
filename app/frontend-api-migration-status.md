# Frontend API Types Migration Progress

## Current Status: 42 TypeScript Errors to Fix

The migration to shared types is well underway but needs completion. Here's a summary of the remaining work:

## ✅ Completed
1. **Updated `frontend/src/types/api.ts`** - Now re-exports shared types while maintaining backward compatibility
2. **Updated 3 Next.js API routes** with shared types and validation:
   - `/api/auth/status` 
   - `/api/auth/universal-login`
   - `/api/games`

## 🔧 Remaining Issues (42 errors in 11 files)

### 1. Missing Schema Exports (Easy Fix)
Files affected: `src/app/debug/page.tsx`, `src/app/student/create-game/page.tsx`, `src/app/teacher/games/new/page.tsx`

**Issue**: Some files import schemas from `@/types/api` that don't exist
**Solution**: Either add the exports to `frontend/src/types/api.ts` or import directly from `@shared/types/api/schemas`

### 2. Question Type Property Conflicts (Fixed in Shared Types)
Files affected: `src/app/teacher/dashboard/[code]/page.tsx`, `src/components/SortableQuestion.tsx` (13 errors)

**Issue**: Frontend expects `timeLimit`, `feedbackWaitTime`, `time` properties on Question type
**Status**: ✅ Fixed - Added these properties to `shared/types/quiz/question.ts`

### 3. Field Name Mismatches (Schema/UI Mismatch)
Files affected: `src/app/teacher/TeacherDashboardClient.tsx`, `src/app/teacher/quiz/use/page.tsx`

**Issues**:
- Frontend UI expects `nom` but shared GameTemplate uses `name`
- Frontend UI expects `ownerId` but shared GameTemplate uses `creatorId` 
- Frontend UI expects `questions_ids` but shared GameTemplate uses `questionIds`

**Solution Options**:
a) Update frontend UI to use shared type field names (recommended)
b) Create adapter/mapper functions in frontend
c) Update backend to return legacy field names (not recommended)

### 4. Schema Validation Type Conflicts
Files affected: `src/app/leaderboard/[code]/page.tsx`, `src/app/teacher/TeacherDashboardClient.tsx`

**Issue**: Schema validation fails because:
- Local schemas expect different field structures than shared types
- `LeaderboardEntry` structure differences between local and shared
- `GameTemplate` structure differences

**Solution**: Align local schemas with shared types or remove schema validation where types provide sufficient safety

### 5. Type Filter Incompatibilities  
Files affected: `src/app/student/create-game/page.tsx`, `src/components/QuestionSelector.tsx`

**Issue**: `QuestionFiltersResponse.niveaux` is `(string | null)[]` but frontend expects `string[]`
**Solution**: Handle null values in frontend or update shared types to not allow null

## 🎯 Recommended Next Steps

### Step 1: Fix Missing Schema Exports (5 min)
Add missing schema exports to `frontend/src/types/api.ts`:
```typescript
export const GameCreationResponseSchema = QuizCreationResponseSchema; // Alias
```

### Step 2: Update Frontend UI Components (30 min)
Update components to use shared type field names:
- Change `quiz.nom` → `quiz.name`
- Change `quiz.ownerId` → `quiz.creatorId`  
- Change `quiz.questions_ids` → `quiz.questionIds`

### Step 3: Fix Schema Validation Conflicts (20 min)
Either:
- Remove schema validation where types provide safety
- Update local schemas to match shared types exactly
- Add field mappers/adapters

### Step 4: Handle Null Values in Filters (10 min)
Filter out null values: `niveaux.filter(n => n !== null)`

### Step 5: Complete Remaining API Routes (60 min)
Update remaining Next.js API routes to use shared types:
- `/api/auth/register`
- `/api/auth/logout` 
- `/api/quiz/*`
- `/api/questions/*`
- etc.

## 🚀 Expected Result
After completing these steps:
- 0 TypeScript errors in frontend
- All API requests/responses use shared types
- Runtime validation on all API boundaries
- Contract enforcement between frontend/backend
- Consistent type safety across the application

## 📝 Files That Need Updates

### Priority 1 (Type Import Issues):
- `src/app/debug/page.tsx` - ✅ Fixed
- `src/app/student/create-game/page.tsx`
- `src/app/teacher/games/new/page.tsx`

### Priority 2 (Field Name Mismatches):
- `src/app/teacher/TeacherDashboardClient.tsx`
- `src/app/teacher/quiz/use/page.tsx`
- `src/app/teacher/quiz/create/page.tsx`

### Priority 3 (Schema Conflicts):
- `src/app/leaderboard/[code]/page.tsx`
- `src/components/QuestionSelector.tsx`
- `src/components/SortableQuestion.tsx` - ✅ Question type fixed

### Priority 4 (Remaining API Routes):
- All files in `src/app/api/*/route.ts`
