# ExcludedFrom Mode Filtering Bug Fix

## Issue Description
The student create game page (both `/student/create-game` and `/student/create-game?training=true`) was showing questions that should be excluded from practice and tournament modes. Questions with `excludedFrom: ["practice"]` or `excludedFrom: ["tournament"]` were still appearing in the filter dropdowns.

## Root Cause
The frontend API route `/api/questions/filters` was not passing the `mode` parameter to the backend, even though:
1. The backend API correctly supported the `mode` parameter
2. The backend properly filtered out questions based on `excludedFrom` field
3. The student pages were correctly sending `mode=practice` or `mode=tournament` parameters

The frontend API was acting as a middleware but wasn't forwarding the crucial `mode` parameter.

## Solution
Updated `/frontend/src/app/api/questions/filters/route.ts` to:

1. **Extract mode parameter** from the request:
```typescript
const mode = searchParams.get('mode');
```

2. **Forward mode to "all options" backend call**:
```typescript
const allOptionsParams = new URLSearchParams();
if (mode) {
    allOptionsParams.append('mode', mode);
}
const allOptionsUrl = `${backendUrl}/questions/filters${allOptionsParams.toString() ? '?' + allOptionsParams.toString() : ''}`;
```

3. **Forward mode to "compatible options" backend call**:
```typescript
if (mode) {
    compatibleParams.append('mode', mode);
}
```

## Files Changed
- `/frontend/src/app/api/questions/filters/route.ts` - Added mode parameter forwarding

## Tests Added
- `tests/e2e/excludedfrom-mode-filtering.spec.ts` - Comprehensive test suite validating the fix

## Verification Results

### Before Fix
```bash
curl "/api/questions/filters?gradeLevel=L2&mode=practice"
# Returned: 5 themes including excluded ones like "Déterminant", "Espaces préhilbertiens"
```

### After Fix  
```bash
curl "/api/questions/filters?gradeLevel=L2&mode=practice"
# Returns: Only "Intégrales généralisées" (correctly filtered)

curl "/api/questions/filters?gradeLevel=L2"  
# Returns: All 5 themes (correct when no mode specified)
```

### Test Results
✅ All API-level tests passing:
- Filter out questions excluded from practice mode
- Filter out questions excluded from tournament mode  
- Show all questions when no mode specified
- Pass mode parameter to backend correctly
- Backend API directly filters by excludedFrom

## Impact
- **Student Create Game (tournament)**: Now only shows questions not excluded from tournaments
- **Student Create Game (practice)**: Now only shows questions not excluded from practice  
- **Teacher Pages**: Unaffected (they don't use mode filtering)
- **Backward Compatibility**: Maintained (no mode = all questions)

## Data Evidence
For L2 grade level:
- **No mode**: 5 themes available
- **Practice mode**: 1 theme available ("Intégrales généralisées")
- **Tournament mode**: 1 theme available ("Intégrales généralisées")

This shows that 4 out of 5 L2 themes are excluded from both practice and tournament modes, which is now correctly respected.
