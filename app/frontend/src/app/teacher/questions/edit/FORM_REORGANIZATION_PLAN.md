# Formulaire Panel Reorganization Plan

## Overview
The current form uses free-text inputs for fields that should be constrained dropdowns populated from metadata extracted from the question YAML files in `/questions/` directory.

## Required Changes

### 1. Extract Metadata from YAML Files
**Location**: `/home/aflesch/mathquest/questions/`

Extract and aggregate from all `*.yaml` files:
- **Disciplines**: Unique list of all `discipline` values
- **Themes**: Unique list of all `themes` array values
- **Tags**: Unique list of all `tags` array values  
- **Grade Levels**: Already hardcoded (CP, CE1, CE2, CM1, CM2, L1, L2, L3) - keep as is

**Output**: Create JSON metadata files (e.g., `questions-metadata.json` or separate files per field)

### 2. Replace Text Inputs with Dropdowns

#### Current (incorrect):
```tsx
// Discipline - free text
<input type="text" value={question.discipline} />

// Themes - comma-separated text
<input type="text" value={question.themes?.join(', ')} />

// Tags - comma-separated text
<input type="text" value={question.tags?.join(', ')} />
```

#### Target (correct):
```tsx
// Discipline - single-select dropdown
<Select value={question.discipline} options={availableDisciplines} />

// Themes - multi-select dropdown
<MultiSelect value={question.themes} options={availableThemes} />

// Tags - multi-select dropdown
<MultiSelect value={question.tags} options={availableTags} />
```

### 3. Field Reorganization

#### Move to Placeholders:
- **UID**: Show as placeholder text, not editable field (auto-generated)
- **Author**: Show as placeholder, pre-filled from `AuthContext.user.username`

#### Field Order (compact layout):
1. **Title** (text input, prominent)
2. **Discipline** (dropdown)
3. **Grade Level** (dropdown)
4. **Themes** (multi-select)
5. **Tags** (multi-select)
6. Question type-specific fields (answers, etc.)

### 4. Component Requirements

**New Components Needed**:
- `<Select>` - Single-select dropdown (check if exists in shared components)
- `<MultiSelect>` - Multi-select dropdown with checkboxes/tags

**Integration**:
- Load metadata JSON on component mount
- Pass available options to dropdown components
- Handle array updates for multi-select fields

### 5. AuthContext Integration

**Current**: Author field is free text  
**Target**: Pre-fill from authenticated user

```tsx
const { user } = useAuth();
// Set author to user.username when creating new question
// Show as placeholder: "Par: {username}"
```

## Implementation Strategy

1. **Phase 1**: Extract metadata script
   - Create Node.js script to parse all YAML files
   - Extract unique disciplines, themes, tags
   - Output to JSON file(s)
   - Add to build process or run manually

2. **Phase 2**: Create/import dropdown components
   - Check `shared/` for existing Select/MultiSelect components
   - Create if needed, following theme system (--primary, --border, etc.)

3. **Phase 3**: Update QuestionEditor.tsx
   - Replace text inputs with dropdowns
   - Add metadata loading logic
   - Update field change handlers for array values
   - Compact layout with CSS Grid

4. **Phase 4**: Update field visibility
   - UID: Move to placeholder or remove from form
   - Author: Get from AuthContext, show as readonly/placeholder

5. **Phase 5**: Update tests
   - Test dropdown interactions
   - Test multi-select behavior
   - Test metadata loading
   - Test YAML synchronization with dropdowns

## Notes

- **NO free-text inputs** for constrained fields
- Dropdowns prevent typos and ensure consistency
- Multi-select UI should show selected items as tags/chips
- Metadata should be regenerated when question files change
