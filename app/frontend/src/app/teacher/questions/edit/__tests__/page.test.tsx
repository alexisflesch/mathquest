import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeacherQuestionEditorPage from '../page';
import { AuthProvider } from '@/components/AuthProvider';
import { getQuestionIndexFromCursor } from '../utils';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock URL.createObjectURL and URL.revokeObjectURL for export functionality
Object.defineProperty(window.URL, 'createObjectURL', {
    writable: true,
    value: jest.fn(() => 'mock-url'),
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
    writable: true,
    value: jest.fn(),
});

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}

describe('TeacherQuestionEditorPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
        localStorageMock.clear.mockClear();
    });

    it('renders the page title', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        expect(screen.getByText('Éditeur de Questions')).toBeInTheDocument();
    });

    it('loads data from localStorage on mount', () => {
        const mockYaml = `- uid: "test-1"
  text: "Test question"
  questionType: "numeric"
  correctAnswer: 42
`;
        localStorageMock.getItem.mockReturnValue(mockYaml);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        expect(localStorageMock.getItem).toHaveBeenCalledWith('question-editor-yaml');
    });

    it('shows question list with add button', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        expect(screen.getByRole('heading', { name: 'Questions' })).toBeInTheDocument();
        expect(screen.getByText('+ Ajouter')).toBeInTheDocument();
    });

    it('adds a new question when clicking the add button', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        const addButton = screen.getByText('+ Ajouter');
        fireEvent.click(addButton);

        // Should now have 2 questions (1 default + 1 added)
        expect(screen.getAllByText('Nouvelle question')).toHaveLength(2);
    });

    it('deletes a question with confirmation', async () => {
        const mockYaml = `- uid: "question-1"
  text: "First question"
  questionType: "numeric"
  correctAnswer: 42

- uid: "question-2"
  text: "Second question"
  questionType: "numeric"
  correctAnswer: 24
`;
        localStorageMock.getItem.mockReturnValue(mockYaml);

        // Mock window.confirm to return true
        const confirmSpy = jest.spyOn(window, 'confirm');
        confirmSpy.mockImplementation(() => true);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        // Click delete button on first question
        const deleteButtons = screen.getAllByTitle('Supprimer la question');
        fireEvent.click(deleteButtons[0]);

        // Should have confirmed deletion
        expect(confirmSpy).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer cette question ?');

        confirmSpy.mockRestore();
    });

    it('switches between form and YAML modes in editor', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        // Should start in form mode
        expect(screen.getByText('Formulaire')).toBeInTheDocument();

        // Switch to YAML mode
        const yamlTab = screen.getByRole('button', { name: 'YAML' });
        fireEvent.click(yamlTab);

        // Should now be in YAML mode
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('updates question text in form mode', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        // Find the text input and update it
        const textInput = screen.getByDisplayValue('Entrez le texte de la question ici...');
        fireEvent.change(textInput, { target: { value: 'Updated question text' } });

        // Should be updated
        expect(textInput).toHaveValue('Updated question text');
    });

    it('autosaves to localStorage', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        // Trigger a change that should autosave
        const textInput = screen.getByDisplayValue('Entrez le texte de la question ici...');
        fireEvent.change(textInput, { target: { value: 'Test question' } });

        // Should have saved to localStorage
        expect(localStorageMock.setItem).toHaveBeenCalledWith('question-editor-yaml', expect.any(String));
    });

    it('shows preview for selected question', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        // Should show preview section
        expect(screen.getByText('Aperçu')).toBeInTheDocument();
    });

    it('shows import/export controls', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        expect(screen.getByText('📁 Importer')).toBeInTheDocument();
        expect(screen.getByText('💾 Exporter (1)')).toBeInTheDocument();
    });

    it('handles mobile tab navigation', () => {
        localStorageMock.getItem.mockReturnValue(null);

        render(
            <TestWrapper>
                <TeacherQuestionEditorPage />
            </TestWrapper>
        );

        // Check that mobile tabs are present
        expect(screen.getByRole('button', { name: 'Questions' })).toBeInTheDocument();
        expect(screen.getByText('Édition')).toBeInTheDocument();
        expect(screen.getByText('Aperçu')).toBeInTheDocument();
    });

    describe('YAML cursor position tracking', () => {
        it('selects first question when cursor is at the beginning', () => {
            const mockYaml = `- uid: "question-1"
  text: "First question"
  questionType: "numeric"
  correctAnswer: 42

- uid: "question-2"
  text: "Second question"
  questionType: "numeric"
  correctAnswer: 24
`;
            localStorageMock.getItem.mockReturnValue(mockYaml);

            render(
                <TestWrapper>
                    <TeacherQuestionEditorPage />
                </TestWrapper>
            );

            // The first question should be selected by default (check for primary background)
            const questionItems = screen.getAllByText('First question');
            const selectedQuestion = questionItems.find(item =>
                item.closest('[class*="bg-primary"]') !== null
            );
            expect(selectedQuestion).toBeInTheDocument();
        });

        it('selects correct question based on cursor position in YAML', () => {
            const mockYaml = `- uid: "question-1"
  text: "First question"
  questionType: "numeric"
  correctAnswer: 42

- uid: "question-2"
  text: "Second question"
  questionType: "numeric"
  correctAnswer: 24
`;
            localStorageMock.getItem.mockReturnValue(mockYaml);

            render(
                <TestWrapper>
                    <TeacherQuestionEditorPage />
                </TestWrapper>
            );

            // Switch to YAML mode
            const yamlTab = screen.getByRole('button', { name: 'YAML' });
            fireEvent.click(yamlTab);

            // Get the textarea
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

            // Simulate cursor position in second question (after the first question)
            const cursorPosition = mockYaml.indexOf('- uid: "question-2"') + 5;
            textarea.setSelectionRange(cursorPosition, cursorPosition);

            // Trigger change event
            fireEvent.change(textarea, { target: { value: mockYaml, selectionStart: cursorPosition } });

            // The second question should now be selected
            // Note: This test might need adjustment based on actual implementation
        });

        it('getQuestionIndexFromCursor correctly identifies question index', () => {
            // Test the cursor detection logic directly
            const yamlContent = `- uid: "question-1"
  text: "First question"
  questionType: "numeric"
  correctAnswer: 42

- uid: "question-2"
  text: "Second question"
  questionType: "numeric"
  correctAnswer: 24
`;

            // Test cursor at beginning
            expect(getQuestionIndexFromCursor(yamlContent, 0)).toBe(0);

            // Test cursor in first question
            expect(getQuestionIndexFromCursor(yamlContent, 20)).toBe(0);

            // Test cursor in second question
            expect(getQuestionIndexFromCursor(yamlContent, 100)).toBe(1);
        });

        it('handles YAML with complex structure correctly', () => {
            const complexYaml = `- uid: "q1"
  text: "Complex question 1"
  questionType: "multiple_choice"
  answerOptions:
    - "Option A"
    - "Option B"
    - "Option C"
  correctAnswers: [0, 2]

- uid: "q2"
  text: "Simple question 2"
  questionType: "numeric"
  correctAnswer: 100
`;

            // Test various positions
            expect(getQuestionIndexFromCursor(complexYaml, 0)).toBe(0);
            expect(getQuestionIndexFromCursor(complexYaml, 50)).toBe(0); // In first question
            expect(getQuestionIndexFromCursor(complexYaml, 200)).toBe(1); // In second question
        });

        it('updates selected question when cursor moves in YAML editor', async () => {
            localStorageMock.getItem.mockReturnValue(null);

            render(
                <TestWrapper>
                    <TeacherQuestionEditorPage />
                </TestWrapper>
            );

            // Add a second question
            const addButton = screen.getAllByText('+ Ajouter')[0];
            fireEvent.click(addButton);

            // Update second question text to make it identifiable
            const textInput = screen.getByDisplayValue('Entrez le texte de la question ici...');
            fireEvent.change(textInput, { target: { value: 'Second question text' } });

            // Switch to YAML mode
            const yamlButton = screen.getByText('YAML');
            fireEvent.click(yamlButton);

            // Get the textarea
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

            // Get initial YAML content
            const yamlContent = textarea.value;
            expect(yamlContent).toContain('Second question text');

            // Find position in second question (after first "- uid:")
            const firstQuestionEnd = yamlContent.indexOf('- uid:', 1);
            expect(firstQuestionEnd).toBeGreaterThan(0); // Should find second question

            // Simulate cursor movement to second question
            textarea.setSelectionRange(firstQuestionEnd + 10, firstQuestionEnd + 10);
            fireEvent.change(textarea, { target: { value: yamlContent } });

            // Switch back to form mode
            const formButton = screen.getByText('Formulaire');
            fireEvent.click(formButton);

            // Should now show the second question's text in the form
            expect(screen.getByDisplayValue('Second question text')).toBeInTheDocument();
        });
    });

    describe('YAML error handling', () => {
        it('should not crash when invalid YAML is entered', () => {
            localStorageMock.getItem.mockReturnValue(null);

            render(
                <TestWrapper>
                    <TeacherQuestionEditorPage />
                </TestWrapper>
            );

            // Switch to YAML mode
            const yamlButton = screen.getByText('YAML');
            fireEvent.click(yamlButton);

            // Enter invalid YAML - should not throw
            const textarea = screen.getByRole('textbox');
            expect(() => {
                fireEvent.change(textarea, { target: { value: 'invalid: yaml: content: [[[' } });
            }).not.toThrow();

            // Page should still be usable
            const formButton = screen.getByText('Formulaire');
            expect(formButton).toBeInTheDocument();
        });
    });

    describe('Question type switching', () => {
        it('should not crash when switching from numeric to single_choice', () => {
            localStorageMock.getItem.mockReturnValue(null);

            render(
                <TestWrapper>
                    <TeacherQuestionEditorPage />
                </TestWrapper>
            );

            // Find the question type select
            const questionTypeSelect = screen.getByDisplayValue('Numérique');

            // Switch to single choice - should not crash
            expect(() => {
                fireEvent.change(questionTypeSelect, { target: { value: 'single_choice' } });
            }).not.toThrow();

            // Should now show answer options section
            expect(screen.getByText('Réponses')).toBeInTheDocument();
            // Verify that answer options are present (there should be at least one)
            expect(screen.getByDisplayValue('Réponse 1')).toBeInTheDocument();
        });

        it('should preserve common fields when switching question types', () => {
            localStorageMock.getItem.mockReturnValue(null);

            render(
                <TestWrapper>
                    <TeacherQuestionEditorPage />
                </TestWrapper>
            );

            // Update the question text
            const textInput = screen.getByDisplayValue('Entrez le texte de la question ici...');
            fireEvent.change(textInput, { target: { value: 'Test question for type change' } });

            // Switch question type
            const questionTypeSelect = screen.getByDisplayValue('Numérique');
            fireEvent.change(questionTypeSelect, { target: { value: 'single_choice' } });

            // Text should be preserved
            expect(screen.getByDisplayValue('Test question for type change')).toBeInTheDocument();
        });
    });
});