// Utility functions for the teacher question editor

/**
 * Determines which question the cursor is in based on YAML structure
 * @param yamlContent The full YAML content as a string
 * @param cursorPosition The cursor position (0-based index)
 * @returns The index of the question the cursor is in, or -1 if not found
 */
export function getQuestionIndexFromCursor(yamlContent: string, cursorPosition: number): number {
    // If cursor is at the beginning, it's in the first question
    if (cursorPosition === 0) {
        return 0;
    }

    const lines = yamlContent.substring(0, cursorPosition).split('\n');
    let questionIndex = -1;
    let inQuestion = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line starts a new question (indicated by - uid:)
        if (line.trim().startsWith('- uid:') || line.trim().startsWith('-uid:')) {
            questionIndex++;
            inQuestion = true;
        }
        // Alternative: check for array items starting with -
        else if (line.trim().startsWith('- ') && !line.includes(':') && !inQuestion) {
            questionIndex++;
            inQuestion = true;
        }
    }

    return questionIndex;
}