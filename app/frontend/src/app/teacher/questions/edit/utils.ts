// Utility functions for the teacher question editor

/**
 * Determines which question the cursor is in based on YAML structure
 * @param yamlContent The full YAML content as a string
 * @param cursorPosition The cursor position (0-based index)
 * @returns The index of the question the cursor is in, or -1 if not found
 */
export function getQuestionIndexFromCursor(yamlContent: string, cursorPosition: number): number {
    // Find all question start positions
    const questionStarts: number[] = [];
    const lines = yamlContent.split('\n');

    let currentPosition = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('- uid:') || line.trim().startsWith('-uid:')) {
            questionStarts.push(currentPosition);
        }
        currentPosition += line.length + 1; // +1 for newline
    }

    // Find the last question start position that is <= cursorPosition
    for (let i = questionStarts.length - 1; i >= 0; i--) {
        if (questionStarts[i] <= cursorPosition) {
            return i;
        }
    }

    return 0; // Default to first question
}