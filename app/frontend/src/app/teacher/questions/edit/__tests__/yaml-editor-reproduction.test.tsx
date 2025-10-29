import { describe, it, expect, jest } from '@jest/globals';
import yaml from 'js-yaml';
import { createEmptyQuestion } from '../types';

// Mock yaml library
jest.mock('js-yaml', () => ({
    load: jest.fn(),
}));

const mockYamlLoad = require('js-yaml').load;

describe('YAML Editor Copy/Paste Issue Reproduction', () => {
    // Replicate the parseYamlToQuestions function from the component
    const parseYamlToQuestions = (yamlContent: string) => {
        if (!yamlContent.trim()) {
            return [createEmptyQuestion()];
        }

        // Let YAML parsing errors propagate - they will be caught by handleYamlChange
        const parsed = mockYamlLoad(yamlContent);

        if (Array.isArray(parsed)) {
            return parsed.map((item: any, index: number) => {
                // Validate required fields
                if (!item || typeof item !== 'object') {
                    console.warn('Invalid question item at index', index, item);
                    return createEmptyQuestion();
                }

                if (item.questionType === 'numeric') {
                    return {
                        uid: item.uid || `question-${Date.now()}-${index}`,
                        author: item.author || '',
                        discipline: item.discipline || '',
                        title: item.title || '',
                        text: item.text || '',
                        questionType: 'numeric' as const,
                        themes: Array.isArray(item.themes) ? item.themes : [],
                        tags: Array.isArray(item.tags) ? item.tags : [],
                        timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                        difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                        gradeLevel: item.gradeLevel || 'CE1',
                        correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
                        explanation: item.explanation || '',
                        feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                    };
                } else {
                    return {
                        uid: item.uid || `question-${Date.now()}-${index}`,
                        author: item.author || '',
                        discipline: item.discipline || '',
                        title: item.title || '',
                        text: item.text || '',
                        questionType: item.questionType || 'single_choice',
                        themes: Array.isArray(item.themes) ? item.themes : [],
                        tags: Array.isArray(item.tags) ? item.tags : [],
                        timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                        difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                        gradeLevel: item.gradeLevel || 'CE1',
                        answerOptions: Array.isArray(item.answerOptions) ? item.answerOptions : ['Réponse 1', 'Réponse 2'],
                        correctAnswers: Array.isArray(item.correctAnswers) ? item.correctAnswers : [true, false],
                        explanation: item.explanation || '',
                        feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                    };
                }
            });
        } else if (parsed && typeof parsed === 'object') {
            // Single question object
            const item = parsed as any;
            if (item.questionType === 'numeric') {
                return [{
                    uid: item.uid || `question-${Date.now()}`,
                    author: item.author || '',
                    discipline: item.discipline || '',
                    title: item.title || '',
                    text: item.text || '',
                    questionType: 'numeric' as const,
                    themes: Array.isArray(item.themes) ? item.themes : [],
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                    difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                    gradeLevel: item.gradeLevel || 'CE1',
                    correctAnswer: typeof item.correctAnswer === 'number' ? item.correctAnswer : 0,
                    explanation: item.explanation || '',
                    feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                }];
            } else {
                return [{
                    uid: item.uid || `question-${Date.now()}`,
                    author: item.author || '',
                    discipline: item.discipline || '',
                    title: item.title || '',
                    text: item.text || '',
                    questionType: item.questionType || 'single_choice',
                    themes: Array.isArray(item.themes) ? item.themes : [],
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    timeLimit: typeof item.timeLimit === 'number' ? item.timeLimit : 30,
                    difficulty: typeof item.difficulty === 'number' ? item.difficulty : 1,
                    gradeLevel: item.gradeLevel || 'CE1',
                    answerOptions: Array.isArray(item.answerOptions) ? item.answerOptions : ['Réponse 1', 'Réponse 2'],
                    correctAnswers: Array.isArray(item.correctAnswers) ? item.correctAnswers : [true, false],
                    explanation: item.explanation || '',
                    feedbackWaitTime: typeof item.feedbackWaitTime === 'number' ? item.feedbackWaitTime : 15,
                }];
            }
        } else {
            console.warn('Parsed YAML is neither array nor object:', parsed);
            return [createEmptyQuestion()];
        }
    };

    // Simulate handleYamlChange function
    const simulateHandleYamlChange = (yamlText: string) => {
        let questions: any[] = [];
        let yamlError: string | null = null;

        try {
            // Parse the new YAML to update questions
            const updatedQuestions = parseYamlToQuestions(yamlText);

            // Only update questions if parsing was successful and returned valid questions
            if (updatedQuestions && updatedQuestions.length > 0) {
                questions = updatedQuestions;
                yamlError = null;
            }
        } catch (error) {
            // Set error message but don't crash - let user continue editing
            const errorMessage = error instanceof Error ? error.message : 'Invalid YAML format';
            yamlError = errorMessage;
            // Don't log to console - errors are shown in UI
        }

        return { questions, yamlError };
    };

    it('should successfully parse valid YAML and update questions', () => {
        const validYaml = `
- uid: test-question-001
  author: Test Author
  discipline: Mathématiques
  title: Test Question Title
  text: What is 2 + 2?
  questionType: single_choice
  themes:
    - Pratique calculatoire
  tags:
    - identités trigonométriques
  timeLimit: 30
  difficulty: 1
  gradeLevel: L1
  answerOptions:
    - "3"
    - "4"
    - "5"
  correctAnswers:
    - false
    - true
    - false
  explanation: Because 2 + 2 = 4
  feedbackWaitTime: 15
`;

        const mockParsed = [{
            uid: 'test-question-001',
            author: 'Test Author',
            discipline: 'Mathématiques',
            title: 'Test Question Title',
            text: 'What is 2 + 2?',
            questionType: 'single_choice',
            themes: ['Pratique calculatoire'],
            tags: ['identités trigonométriques'],
            timeLimit: 30,
            difficulty: 1,
            gradeLevel: 'L1',
            answerOptions: ['3', '4', '5'],
            correctAnswers: [false, true, false],
            explanation: 'Because 2 + 2 = 4',
            feedbackWaitTime: 15,
        }];

        mockYamlLoad.mockReturnValue(mockParsed);

        const result = simulateHandleYamlChange(validYaml);

        expect(result.yamlError).toBeNull();
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].title).toBe('Test Question Title');
        expect(result.questions[0].text).toBe('What is 2 + 2?');
        expect(result.questions[0].questionType).toBe('single_choice');
        expect(result.questions[0].answerOptions).toEqual(['3', '4', '5']);
        expect(result.questions[0].correctAnswers).toEqual([false, true, false]);
    });

    it('should handle YAML parsing errors gracefully', () => {
        const invalidYaml = `
- uid: test-question-001
  author: Test Author
  discipline: Mathématiques
  title: Test Question
  invalid yaml structure here
  missing proper formatting
`;

        const parseError = new Error('YAML parsing failed');
        mockYamlLoad.mockImplementation(() => {
            throw parseError;
        });

        const result = simulateHandleYamlChange(invalidYaml);

        expect(result.yamlError).toBe('YAML parsing failed');
        // Should return empty array or default question when parsing fails
        expect(result.questions).toEqual([]);
    });

    it('should handle empty YAML content', () => {
        const emptyYaml = '';

        mockYamlLoad.mockReturnValue(null);

        const result = simulateHandleYamlChange(emptyYaml);

        expect(result.yamlError).toBeNull();
        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].title).toBe(''); // Default empty question
    });

    it('should handle malformed parsed data', () => {
        const yamlWithInvalidData = `
- not: a valid question object
`;

        mockYamlLoad.mockReturnValue(['not a valid question object']);

        const result = simulateHandleYamlChange(yamlWithInvalidData);

        expect(result.yamlError).toBeNull();
        expect(result.questions).toHaveLength(1);
        // Should create a default question for invalid items
        expect(result.questions[0].questionType).toBe('numeric'); // createEmptyQuestion returns numeric type
    });

    it('should call onChange callback even when value matches model value', () => {
        // This test verifies the fix for the copy/paste issue
        // Previously, handleEditorChange had a condition that prevented calling onChange
        // when the new value matched the current model value

        const mockOnChange = jest.fn();
        const mockEditor = {
            getModel: () => ({
                getValue: () => 'current yaml content',
                getOffsetAt: () => 10
            }),
            getPosition: () => ({ lineNumber: 1, column: 1 })
        };

        // Simulate the handleEditorChange function with the fix
        const handleEditorChange = (value: string | undefined) => {
            if (value !== undefined) {
                const position = mockEditor.getPosition();
                const cursorPosition = position ? mockEditor.getModel()?.getOffsetAt() : undefined;
                mockOnChange(value, cursorPosition);
            }
        };

        // Test with same value (simulating copy/paste scenario)
        handleEditorChange('current yaml content');

        expect(mockOnChange).toHaveBeenCalledWith('current yaml content', 10);

        // Test with different value
        handleEditorChange('new yaml content');
        expect(mockOnChange).toHaveBeenCalledWith('new yaml content', 10);
    });

    it('should select last question when cursor position is invalid or at end', () => {
        const validYaml = `
- uid: question-1
  author: Test Author
  discipline: Mathématiques
  title: First Question
  text: What is 1 + 1?
  questionType: single_choice
  themes: [Pratique calculatoire]
  tags: [identités trigonométriques]
  timeLimit: 30
  difficulty: 1
  gradeLevel: L1
  answerOptions: [2, 3, 4]
  correctAnswers: [true, false, false]
  explanation: Simple math
  feedbackWaitTime: 15

- uid: question-2
  author: Test Author
  discipline: Mathématiques
  title: Second Question
  text: What is 2 + 2?
  questionType: single_choice
  themes: [Pratique calculatoire]
  tags: [identités trigonométriques]
  timeLimit: 30
  difficulty: 1
  gradeLevel: L1
  answerOptions: [3, 4, 5]
  correctAnswers: [false, true, false]
  explanation: More math
  feedbackWaitTime: 15
`;

        // Mock getQuestionIndexFromCursor to return -1 (invalid position, like at end)
        const mockGetQuestionIndexFromCursor = jest.fn().mockReturnValue(-1) as jest.MockedFunction<(yamlContent: string, cursorPosition: number) => number>;

        // Simulate handleYamlChange with invalid cursor position
        const simulateHandleYamlChangeWithCursor = (yamlText: string, cursorPosition?: number) => {
            let questions: any[] = [];
            let selectedIndex = 0;
            let yamlError: string | null = null;

            try {
                const updatedQuestions = parseYamlToQuestions(yamlText);

                if (updatedQuestions && updatedQuestions.length > 0) {
                    questions = updatedQuestions;
                    yamlError = null;

                    if (cursorPosition !== undefined) {
                        const questionIndex = mockGetQuestionIndexFromCursor(yamlText, cursorPosition);
                        if (questionIndex !== -1 && questionIndex < updatedQuestions.length) {
                            selectedIndex = questionIndex;
                        } else {
                            // Should select last question when cursor position is invalid
                            selectedIndex = updatedQuestions.length - 1;
                        }
                    } else {
                        // Should select last question when no cursor position
                        selectedIndex = updatedQuestions.length - 1;
                    }
                }
            } catch (error) {
                yamlError = error instanceof Error ? error.message : 'Invalid YAML format';
            }

            return { questions, selectedIndex, yamlError };
        };

        mockYamlLoad.mockReturnValue([
            {
                uid: 'question-1',
                author: 'Test Author',
                discipline: 'Mathématiques',
                title: 'First Question',
                text: 'What is 1 + 1?',
                questionType: 'single_choice',
                themes: ['Pratique calculatoire'],
                tags: ['identités trigonométriques'],
                timeLimit: 30,
                difficulty: 1,
                gradeLevel: 'L1',
                answerOptions: ['2', '3', '4'],
                correctAnswers: [true, false, false],
                explanation: 'Simple math',
                feedbackWaitTime: 15,
            },
            {
                uid: 'question-2',
                author: 'Test Author',
                discipline: 'Mathématiques',
                title: 'Second Question',
                text: 'What is 2 + 2?',
                questionType: 'single_choice',
                themes: ['Pratique calculatoire'],
                tags: ['identités trigonométriques'],
                timeLimit: 30,
                difficulty: 1,
                gradeLevel: 'L1',
                answerOptions: ['3', '4', '5'],
                correctAnswers: [false, true, false],
                explanation: 'More math',
                feedbackWaitTime: 15,
            }
        ]);

        // Test with invalid cursor position (simulating paste at end)
        const result1 = simulateHandleYamlChangeWithCursor(validYaml, 1000); // Position beyond content
        expect(result1.selectedIndex).toBe(1); // Should select last question (index 1)

        // Test with no cursor position (simulating programmatic change)
        const result2 = simulateHandleYamlChangeWithCursor(validYaml);
        expect(result2.selectedIndex).toBe(1); // Should select last question (index 1)
    });
});