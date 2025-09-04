# Test Plan: Question Filtering by Mode

## Summary
Backend now excludes questions based on their `excludedFrom` field:
- `/student/create-game` excludes questions with `excludedFrom: ['tournament']`
- `/student/create-game?training=true` excludes questions with `excludedFrom: ['practice']`

## Changes Made

### Backend Changes
1. **questionService.ts**: Updated `getQuestions()` method to accept `mode` parameter
2. **questions.ts API**: Added mode parameter support to main questions endpoint and `/list` endpoint
3. **Fixed conflicting logic**: Separated `isHidden` (teacher-only visibility) from `excludedFrom` (mode-specific exclusion)

### Frontend Changes
1. **create-game/page.tsx**: Updated to pass `mode` parameter based on training flag
   - Regular tournament creation: `mode=tournament`
   - Training mode: `mode=practice`

## Test Steps

### 1. Test Tournament Mode Filtering
```bash
# Should exclude questions with excludedFrom containing 'tournament'
curl "http://localhost:5000/api/v1/questions/list?gradeLevel=elementary&discipline=math&mode=tournament"
```

### 2. Test Practice Mode Filtering  
```bash
# Should exclude questions with excludedFrom containing 'practice'
curl "http://localhost:5000/api/v1/questions/list?gradeLevel=elementary&discipline=math&mode=practice"
```

### 3. Test Frontend Integration
1. Visit `http://localhost:3000/student/create-game`
2. Select niveau, discipline, themes
3. Verify question count reflects tournament-excluded questions
4. Visit `http://localhost:3000/student/create-game?training=true`
5. Verify question count reflects practice-excluded questions

## Database Query Examples
The backend now generates these Prisma queries:

**Tournament Mode:**
```sql
SELECT * FROM questions WHERE 
  NOT (excluded_from ? 'tournament') 
  AND grade_level = 'elementary' 
  AND discipline = 'math'
  AND is_hidden != true;
```

**Practice Mode:**
```sql
SELECT * FROM questions WHERE 
  NOT (excluded_from ? 'practice') 
  AND grade_level = 'elementary' 
  AND discipline = 'math'
  AND is_hidden != true;
```

## Expected Behavior
- Questions with `excludedFrom: ['tournament']` won't appear in tournament creation
- Questions with `excludedFrom: ['practice']` won't appear in practice mode
- Questions with `excludedFrom: ['quiz', 'tournament', 'practice']` won't appear for non-teachers (via `isHidden` logic)
- Regular questions without exclusions appear in all modes

## Verification
✅ Backend compiles successfully
✅ Frontend compiles successfully
✅ Mode parameter properly passed from frontend to backend
✅ Question filtering logic updated to handle both `isHidden` and `excludedFrom`
