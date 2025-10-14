# 2025-10-14: Question Selection Algorithm for Practice/Tournament Mode

## Overview
Implemented a new tag-balanced question selection algorithm to improve UX for students in practice and tournament modes. This replaces the previous simple random shuffling with a balanced distribution across question tags.

## Problem
Students could encounter many questions from the same tag in a single session, leading to repetitive content and poor learning experience.

## Solution
New algorithm in `GameTemplateService.selectRandomQuestions()` that:

1. Identifies all available tags for the selected discipline, grade level, and themes
2. Calculates questions per tag (ceiling of total needed / number of tags)
3. Queries database for random questions per tag
4. Fills remaining slots with additional random questions if needed
5. Shuffles final selection for fairness

## Technical Details

### Database Queries
- Uses PostgreSQL `ORDER BY RANDOM()` for efficient random sampling
- Array operations (`ANY()`, `&&`) for theme/tag matching
- Limits queries to minimize memory usage

### Algorithm Steps
```typescript
// 1. Get tags for themes
tags = getTagsForThemes(discipline, gradeLevel, themes)

// 2. Calculate per-tag allocation
perTag = ceil(N / tags.length)

// 3. Query per tag
for each tag:
  questions = SELECT uid FROM questions
    WHERE discipline = ? AND themes && ? AND tags @> ARRAY[?]
    ORDER BY RANDOM() LIMIT perTag

// 4. Fill remaining if needed
if selected < N:
  remaining = SELECT uid FROM questions
    WHERE ... AND uid NOT IN selected
    ORDER BY RANDOM() LIMIT (N - selected)

// 5. Shuffle and return
shuffle(selected)
return selected.slice(0, N)
```

## Files Modified
- `backend/src/core/services/gameTemplateService.ts`: Added `getTagsForThemes()` and `selectRandomQuestions()` methods
- `backend/src/core/services/gameTemplateService.ts`: Updated `createStudentGameTemplate()` to use new selection logic

## Tests Added
- `backend/tests/unit/gameTemplateService.test.ts`: Unit test verifying balanced tag distribution

## Documentation Updated
- `vuepress/docs/technical/2025-10-14-question-selection-algorithm.md`: Technical implementation details
- `vuepress/docs/utilisation/entrainement.md`: User-facing explanation for practice mode
- `vuepress/docs/utilisation/tournoi.md`: User-facing explanation for tournament mode

## Validation
- All existing tests pass
- New test confirms even tag distribution (e.g., 9 questions across 3 tags = 3 each)
- No duplicates ensured
- Maintains backward compatibility