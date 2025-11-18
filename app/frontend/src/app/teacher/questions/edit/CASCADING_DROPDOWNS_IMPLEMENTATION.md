# Teacher Question Editor - Cascading Dropdowns Implementation Summary

## Completed: October 3, 2025

### Overview
Successfully implemented cascading dropdown functionality for the teacher question editor, replacing free-text inputs with metadata-driven dropdowns that ensure data consistency.

## Implementation Details

### 1. Metadata Source
- **Source**: `GET /api/v1/questions/taxonomy` (backend API) served from the `taxonomy` table in the database.
- **Populate taxonomy**: Use the `scripts/import_taxonomy.py` script to import root-level nomenclature YAMLs from `questions/*.yaml` into the DB.

**Metadata Structure**:
```yaml
niveau: "CP"
disciplines:
  - nom: "Mathématiques"
    themes:
      - nom: "Nombres"
        tags:
          - "dénombrer"
          - "comparer des quantités"
          ...
```

### 2. Type Definitions
**File**: `types/metadata.ts`

```typescript
interface MetadataTheme {
    nom: string;
    tags: string[];
}

interface MetadataDiscipline {
    nom: string;
    themes: MetadataTheme[];
}

interface GradeLevelMetadata {
    niveau: string;
    disciplines: MetadataDiscipline[];
}

interface ParsedMetadata {
    gradeLevels: string[];
    metadata: Record<string, GradeLevelMetadata>;
}
```

### 3. Metadata Loading Utilities
**File**: `utils/metadata.ts`

**Key Functions**:
- `loadMetadata()`: Async function to fetch taxonomy metadata from backend API (`/api/v1/questions/taxonomy`) and return a ParsedMetadata object.
- `getDisciplinesForGradeLevel()`: Get available disciplines for selected grade level
- `getThemesForDiscipline()`: Get available themes for selected discipline  
- `getTagsForThemes()`: Get available tags for selected theme(s) - returns union of all theme tags

### 4. Cascading Dropdown Logic

**Flow**:
1. **Grade Level** selected → enables Discipline dropdown
2. **Discipline** selected → enables Themes multi-select
3. **Theme(s)** selected → enables Tags multi-select

**Implementation in QuestionEditor.tsx**:
```typescript
// Cascading state management with useEffect hooks
useEffect(() => {
    if (question.gradeLevel) {
        const disciplines = getDisciplinesForGradeLevel(metadata, question.gradeLevel);
        setAvailableDisciplines(disciplines);
        // Reset discipline if not in new list
    }
}, [question.gradeLevel, metadata]);

useEffect(() => {
    if (question.gradeLevel && question.discipline) {
        const themes = getThemesForDiscipline(metadata, question.gradeLevel, question.discipline);
        setAvailableThemes(themes);
        // Reset themes if not in new list
    }
}, [question.gradeLevel, question.discipline, metadata]);

useEffect(() => {
    if (question.themes && question.themes.length > 0) {
        const tags = getTagsForThemes(metadata, question.gradeLevel, question.discipline, question.themes);
        setAvailableTags(tags);
        // Reset tags if not in new list
    }
}, [question.themes, metadata]);
```

### 5. UI Components Used

- **EnhancedSingleSelectDropdown**: For Grade Level and Discipline
- **EnhancedMultiSelectDropdown**: For Themes and Tags

**Features**:
- Disabled state when prerequisites not met
- Automatic reset of dependent fields when parent changes
- Visual feedback with proper styling
- Placeholder text for guidance

### 6. Form Field Organization

**New Layout** (in order):
1. **Title** (text input, prominent) - First field, larger font
2. **Grade Level** (single-select dropdown) - Required first
3. **Discipline** (single-select dropdown) - Enabled after grade level
4. **Themes** (multi-select dropdown) - Enabled after discipline
5. **Tags** (multi-select dropdown) - Enabled after themes
6. **Question Text** (textarea)
7. **Question Type** (single-choice, multiple-choice, numeric)
8. **Time Limit** and **Difficulty**
9. **Answer Options** (dynamic based on question type)
10. **Explanation** (optional textarea)
11. **Metadata Info** (UID and Author as readonly display)

**Removed**:
- UID input field → Now shown as readonly info
- Author input field → Now shown as readonly info (future: will pre-fill from AuthContext)
- Free-text "Thèmes (séparés par des virgules)"
- Free-text "Tags (séparés par des virgules)"
- Free-text Discipline input

### 7. Grade Level Sorting

Uses existing `sortGradeLevels()` utility from `@/utils/gradeLevelSort`

**Order**: CP, CE1, CE2, CM1, Sixème, Cinquième, Quatrième, Troisième, Seconde, Première, Terminal, L1, L2, L3, M1, M2

### 8. Files Modified

1. **page.tsx**:
   - Added `ParsedMetadata` state
   - Added `useEffect` to load metadata on mount
   - Passed `metadata` prop to QuestionEditor
   - Added loading state message

2. **components/QuestionEditor.tsx**:
   - Added `metadata` prop to interface
   - Added cascading dropdown state management
   - Replaced all free-text inputs with dropdowns
   - Added 3 `useEffect` hooks for cascading logic
   - Reorganized form field order
   - Changed UID/Author to readonly display

3. **types/metadata.ts**: Created new file with metadata type definitions

4. **utils/metadata.ts**: Created new file with metadata loading and helper functions

### 9. Data Consistency Benefits

✅ **No more typos** in discipline names  
✅ **No more invalid theme/tag combinations**  
✅ **Automatic validation** - only compatible options available  
✅ **Better UX** - clear guidance through required selection flow  
✅ **YAML consistency** - all questions use standardized values  

### 10. Future Enhancements

**Author Field**:
Currently shown as readonly. Next step:
```typescript
const { user } = useAuth();
// Pre-fill author from user.username when creating new question
// Show as: "Auteur: {username}"
```

**Dynamic Metadata Updates**:
- The runtime taxonomy used by the frontend is obtained from the backend API: `GET /api/v1/questions/taxonomy`.
- To update the DB taxonomy, run `scripts/import_taxonomy.py --yes` (it imports `questions/*.yaml` into the database). After running this, the dropdowns will reflect updated taxonomy on page reload.
- The `scripts/generate_json.py` tool is used only to convert YAML files into VuePress JSON for docs generation — it does **not** affect the runtime taxonomy. 

## Testing

**Manual Testing Checklist**:
- [x] Grade level selection enables discipline dropdown
- [x] Discipline selection enables themes multi-select
- [x] Themes selection enables tags multi-select
- [x] Changing grade level resets discipline/themes/tags appropriately
- [x] Changing discipline resets themes/tags appropriately
- [x] YAML mode still works correctly
- [x] Form-to-YAML synchronization maintains dropdown values
- [x] Type checking passes with no errors

## Notes

- Metadata files are loaded once on component mount
- Failed metadata loads are logged to console but don't crash the app
- Empty/invalid selections are handled gracefully
- All dropdowns respect theme system colors (--primary, --border, etc.)
- Multi-select dropdowns show selected items as tags/chips for easy visual feedback
