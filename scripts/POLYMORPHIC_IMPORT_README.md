# Polymorphic Question Import Script Updates

## Changes Made

The `import_questions.py` script has been updated to support the new polymorphic question structure:

### New Question Types Supported

1. **Multiple Choice Questions** (`questionType: "multipleChoice"`)
   - Required fields: `answerOptions`, `correctAnswers`
   - Example:
   ```yaml
   - uid: "mc_001"
     questionType: "multipleChoice"
     answerOptions: ["Option A", "Option B", "Option C", "Option D"]
     correctAnswers: [true, false, false, true]
   ```

2. **Numeric Questions** (`questionType: "numeric"`)
   - Required fields: `correctAnswer`
   - Optional fields: `tolerance`, `unit`
   - Example:
   ```yaml
   - uid: "num_001"
     questionType: "numeric"
     correctAnswer: 42
     tolerance: 0.5
     unit: "cm"
   ```

### Database Structure

Questions are now stored across multiple tables:
- **`questions`**: Main question data (text, type, metadata)
- **`multiple_choice_questions`**: Multiple choice specific data
- **`numeric_questions`**: Numeric question specific data

### Validation Changes

- Questions are validated based on their type
- Multiple choice questions must have `answerOptions` and `correctAnswers`
- Numeric questions must have `correctAnswer` (must be a valid number)
- Numeric questions can optionally have `tolerance` and `unit`

### Import Process

1. Validates question structure based on type
2. Inserts into main `questions` table
3. Inserts type-specific data into appropriate polymorphic table
4. Cleans up orphaned records

### Example Usage

```bash
# Import all questions with polymorphic support
python import_questions.py

# Clear database and import
python import_questions.py --clear-db
python import_questions.py

# Verbose output to see warnings
python import_questions.py --verbose
```

### Backward Compatibility

- Existing multiple choice questions will continue to work
- The script now properly supports both question types
- Database cleanup ensures data consistency across polymorphic tables
