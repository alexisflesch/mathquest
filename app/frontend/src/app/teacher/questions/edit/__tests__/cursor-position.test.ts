/**
 * Test for cursor position bug in YAML editor
 *
 * Bug: When pasting YAML with multiple questions, the cursor position
 * at the end should select the last question, but it's selecting an incorrect one.
 */

import { getQuestionIndexFromCursor } from '../utils';

describe('getQuestionIndexFromCursor', () => {
    it('should return correct question index for cursor at end of YAML', () => {
        const yaml = `- uid: "question-1"
  title: "First Question"

- uid: "question-2"
  title: "Second Question"

- uid: "question-3"
  title: "Third Question"
`;

        // Cursor at the very end (after the last character)
        const cursorPosition = yaml.length;

        const result = getQuestionIndexFromCursor(yaml, cursorPosition);

        // Should return 2 (index of third question, since cursor is at end)
        expect(result).toBe(2);
    });

    it('should return correct question index for cursor in middle of YAML', () => {
        const yaml = `- uid: "question-1"
  title: "First Question"

- uid: "question-2"
  title: "Second Question"

- uid: "question-3"
  title: "Third Question"
`;

        // Cursor somewhere in the second question
        const secondQuestionStart = yaml.indexOf('- uid: "question-2"');
        const cursorPosition = secondQuestionStart + 10;

        const result = getQuestionIndexFromCursor(yaml, cursorPosition);

        // Should return 1 (index of second question)
        expect(result).toBe(1);
    });

    it('should handle cursor at beginning', () => {
        const yaml = `- uid: "question-1"
  title: "First Question"

- uid: "question-2"
  title: "Second Question"
`;

        const cursorPosition = 0;

        const result = getQuestionIndexFromCursor(yaml, cursorPosition);

        // Should return 0 (first question)
        expect(result).toBe(0);
    });

    // Test case that reproduces the reported bug
    it('should correctly identify question at cursor when pasting multiple questions', () => {
        // Use a simplified version of the YAML content
        const pastedYaml = `- uid: "q1"
  title: "Question 1"

- uid: "q2"
  title: "Question 2"

- uid: "q3"
  title: "Question 3"

- uid: "q4"
  title: "Question 4"

- uid: "q5"
  title: "Question 5"

- uid: "q6"
  title: "Question 6"
`;

        // Cursor at the end after pasting
        const cursorPosition = pastedYaml.length;

        const result = getQuestionIndexFromCursor(pastedYaml, cursorPosition);

        // There are 6 questions, so cursor at end should return 6
        const questionCount = (pastedYaml.match(/- uid:/g) || []).length;
        console.log('Question count:', questionCount);
        console.log('Result:', result);

        // For cursor at end, it should return the last question index
        expect(result).toBe(questionCount - 1);
    });

    // Test what happens if cursor is not at the end
    it('should handle cursor not at end after paste', () => {
        const pastedYaml = `- uid: "q1"
  title: "Question 1"

- uid: "q2"
  title: "Question 2"

- uid: "q3"
  title: "Question 3"

- uid: "q4"
  title: "Question 4"

- uid: "q5"
  title: "Question 5"

- uid: "q6"
  title: "Question 6"
`;

        // Suppose cursor is positioned at the start of the third question
        const thirdQuestionStart = pastedYaml.indexOf('- uid: "q3"');
        const cursorPosition = thirdQuestionStart;

        const result = getQuestionIndexFromCursor(pastedYaml, cursorPosition);

        // Should return 2 (third question, 0-indexed)
        expect(result).toBe(2);
    });
});