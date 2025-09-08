# Student Create Game Filtering Bug Fix

## Issue Description
On the student/create-game page, the dropdown filters were not working correctly. When selecting a grade level (e.g., L2), all disciplines were still showing instead of only the compatible ones (should show only "Mathématiques" for L2).

## Root Cause
The student create game page was extracting ALL values from the API response instead of filtering for only compatible ones:

**BROKEN CODE:**
```typescript
// This was showing ALL disciplines/themes regardless of compatibility
setAvailableDisciplines(data.disciplines.map(option => option.value).sort());
setAvailableThemes(data.themes.map(option => option.value).sort());
```

## Solution
Added filtering to only include options marked as compatible:

**FIXED CODE:**
```typescript
// This now shows only compatible disciplines/themes
setAvailableDisciplines(data.disciplines.filter(option => option.isCompatible).map(option => option.value).sort());
setAvailableThemes(data.themes.filter(option => option.isCompatible).map(option => option.value).sort());
```

## Files Changed
- `/frontend/src/app/student/create-game/page.tsx` - Fixed filtering logic in two useEffect hooks
- Added test IDs for better testing: `data-testid="grade-level-dropdown"`, `data-testid="discipline-dropdown"`, `data-testid="themes-dropdown"`

## Tests Added
- **Unit Test**: `frontend/tests/unit/student-create-game-filtering.test.ts` - Validates the filtering logic
- **Manual Test Script**: `manual-test-filtering.js` - Browser console script for manual verification
- **E2E Test**: `tests/e2e/student-create-game-filtering.spec.ts` - Full browser automation test

## Verification
### API Level
```bash
# L2 should return only Mathématiques as compatible
curl "http://localhost:3008/api/questions/filters?gradeLevel=L2"
# Returns: "Mathématiques" with isCompatible:true, others with isCompatible:false
```

### Unit Test Results
```
✓ should filter out incompatible disciplines with new logic
✓ should filter out incompatible themes with new logic  
✓ should demonstrate the bug that was fixed
```

### Expected Behavior
1. Select "L2" → Only "Mathématiques" appears in discipline dropdown
2. Select "Mathématiques" → Only compatible themes appear (Déterminant, Espaces préhilbertiens, Intégrales généralisées, etc.)
3. Incompatible options like "Anglais", "Calcul", "Géométrie" do NOT appear

## Related Context
This bug was introduced when the API was refactored to return `FilterOption` objects with `{value, isCompatible}` format instead of plain strings. The teacher/games/new page was correctly updated to handle this, but the student/create-game page was not updated accordingly.

The API correctly returns compatibility flags, the issue was purely in the frontend processing of the response.
