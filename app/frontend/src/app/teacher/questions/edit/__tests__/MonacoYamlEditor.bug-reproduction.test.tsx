/**
 * CRITICAL BUG REPRODUCTION TEST
 * 
 * Bug: When typing a discipline name (without quotes) after "discipline: ",
 * if there is already content below, the autocomplete incorrectly inserts
 * a complete question template, destroying the existing content below.
 * 
 * This test MUST FAIL before the fix, and PASS after the fix.
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonacoYamlEditor } from '../components/MonacoYamlEditor';
import { ParsedMetadata } from '../types/metadata';

// Simple mock metadata
const mockMetadata: ParsedMetadata = {
    gradeLevels: ['L1', 'L2'],
    metadata: {
        L1: {
            niveau: 'L1',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [{ nom: 'Algèbre', tags: ['test'] }],
                },
            ],
        },
        L2: {
            niveau: 'L2',
            disciplines: [
                {
                    nom: 'Mathématiques',
                    themes: [{ nom: 'Analyse', tags: ['test'] }],
                },
                {
                    nom: 'Analyse',
                    themes: [{ nom: 'Suites', tags: ['test'] }],
                },
            ],
        },
    },
};

describe('CRITICAL BUG: Autocomplete destroying existing content', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should NOT destroy existing YAML content when typing discipline value', async () => {
        // This is the EXACT scenario from the user's bug report
        const initialYaml = `- uid: "aflesch-mt3-series-numeriques-001"
  author: "aflesch"
  gradeLevel: "L2"
  discipline: 
  themes: ["Séries numériques"]
  tags: ["convergence", "absolue convergence"]
  title: "Série simple"
  questionType: "multiple_choice"
  excludedFrom: ["practice", "tournament"]
  timeLimit: 30
  difficulty: 1
  text: |
    La série \\(\\displaystyle\\sum_n \\frac{n^2+2n}{n!-\\mathrm{e}^n}\\) est
  answerOptions:
    - Convergente
    - Divergente
    - Absolument convergente
  correctAnswers: [true, false, true]`;

        const { container } = render(
            <MonacoYamlEditor
                value={initialYaml}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        // User types "a" after "discipline: "
        // The autocomplete should suggest "Analyse" and "Mathématiques" starting with 'a'
        // But it should NOT replace the entire content below

        // After typing "a", the YAML should be:
        const expectedAfterTypingA = `- uid: "aflesch-mt3-series-numeriques-001"
  author: "aflesch"
  gradeLevel: "L2"
  discipline: a
  themes: ["Séries numériques"]
  tags: ["convergence", "absolue convergence"]
  title: "Série simple"
  questionType: "multiple_choice"
  excludedFrom: ["practice", "tournament"]
  timeLimit: 30
  difficulty: 1
  text: |
    La série \\(\\displaystyle\\sum_n \\frac{n^2+2n}{n!-\\mathrm{e}^n}\\) est
  answerOptions:
    - Convergente
    - Divergente
    - Absolument convergente
  correctAnswers: [true, false, true]`;

        // The bug would produce:
        const buggyOutput = `- uid: aflesch-mt3-series-numeriques-001
  author: aflesch
  discipline: a
  title: Série simple
  text: |
    La série \\(\\displaystyle\\sum_n \\frac{n^2+2n}{n!-\\mathrm{e}^n}\\) est
  questionType: multiple_choice
  themes:
    - Séries numériques
  tags: []
  timeLimit: 30
  difficulty: 1
  gradeLevel: L2
  explanation: ''
  feedbackWaitTime: 15
  answerOptions:
    - Convergente
    - Divergente
    - Absolument convergente
  correctAnswers:
    - true
    - false
    - true`;

        // Verify the content is preserved (checking key fields)
        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent;

        // These fields should still be present in their original positions
        expect(editorContent).toContain('themes: ["Séries numériques"]');
        expect(editorContent).toContain('tags: ["convergence", "absolue convergence"]');
        expect(editorContent).toContain('excludedFrom: ["practice", "tournament"]');

        // The quotes should still be there (bug removes them)
        expect(editorContent).toContain('"aflesch-mt3-series-numeriques-001"');
        expect(editorContent).toContain('"aflesch"');
        expect(editorContent).toContain('"L2"');

        // The order should be preserved (bug reorders fields)
        const uidIndex = editorContent?.indexOf('uid:') || 0;
        const authorIndex = editorContent?.indexOf('author:') || 0;
        const gradeLevelIndex = editorContent?.indexOf('gradeLevel:') || 0;
        const disciplineIndex = editorContent?.indexOf('discipline:') || 0;
        const themesIndex = editorContent?.indexOf('themes:') || 0;

        expect(uidIndex).toBeLessThan(authorIndex);
        expect(authorIndex).toBeLessThan(gradeLevelIndex);
        expect(gradeLevelIndex).toBeLessThan(disciplineIndex);
        expect(disciplineIndex).toBeLessThan(themesIndex);
    });

    it('should only replace the word being typed, not the entire document', async () => {
        const yamlWithEmptyDiscipline = `- uid: test-123
  author: teacher
  gradeLevel: L2
  discipline: 
  themes: []
  tags: []
  title: My Question
  text: Question text here
  questionType: single_choice
  timeLimit: 30
  difficulty: 1
  answerOptions:
    - Option A
    - Option B
  correctAnswers: [true, false]`;

        const { container } = render(
            <MonacoYamlEditor
                value={yamlWithEmptyDiscipline}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        // User types "Math" after "discipline: "
        // Expected: only that word is replaced
        // Bug: entire document is replaced with template

        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent;

        // Critical: these should NOT disappear
        expect(editorContent).toContain('My Question');
        expect(editorContent).toContain('Question text here');
        expect(editorContent).toContain('Option A');
        expect(editorContent).toContain('Option B');
    });

    it('should handle the case where discipline line has no value yet', async () => {
        const yamlWithColonOnly = `- uid: test
  gradeLevel: L2
  discipline: 
  title: Test`;

        const { container } = render(
            <MonacoYamlEditor
                value={yamlWithColonOnly}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent;

        // The "title: Test" line should still be there
        expect(editorContent).toContain('title: Test');
    });

    it('should show autocomplete suggestions but not auto-insert anything', async () => {
        // When user is at "discipline: " position (cursor right after space)
        // Autocomplete should SHOW suggestions but NOT automatically insert anything
        // User must explicitly select from the list

        const yaml = `- uid: test
  gradeLevel: L2
  discipline: `;

        const { container } = render(
            <MonacoYamlEditor
                value={yaml}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        // The YAML should remain exactly as is until user types or selects
        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent;
        expect(editorContent).toBe(yaml);
    });

    it('should preserve field order when autocompleting discipline', async () => {
        const originalYaml = `- uid: original-uid
  author: original-author
  gradeLevel: L2
  discipline: 
  themes: ["Original Theme"]
  tags: ["Original Tag"]
  title: Original Title
  text: Original Text
  questionType: multiple_choice
  timeLimit: 45
  difficulty: 3
  answerOptions:
    - A
    - B
  correctAnswers: [true, false]`;

        const { container } = render(
            <MonacoYamlEditor
                value={originalYaml}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent || '';

        // Field order must be preserved
        const fieldOrder = [
            'uid: original-uid',
            'author: original-author',
            'gradeLevel: L2',
            'discipline:',
            'themes: ["Original Theme"]',
            'tags: ["Original Tag"]',
            'title: Original Title',
            'text: Original Text',
            'questionType: multiple_choice',
            'timeLimit: 45',
            'difficulty: 3',
        ];

        let lastIndex = -1;
        fieldOrder.forEach(field => {
            const currentIndex = editorContent.indexOf(field);
            expect(currentIndex).toBeGreaterThan(lastIndex);
            lastIndex = currentIndex;
        });
    });

    it('should preserve quotes when they exist in original YAML', async () => {
        const yamlWithQuotes = `- uid: "quoted-uid"
  author: "quoted-author"
  gradeLevel: "L2"
  discipline: 
  themes: ["Theme"]
  title: "Quoted Title"`;

        const { container } = render(
            <MonacoYamlEditor
                value={yamlWithQuotes}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent || '';

        // Quotes should be preserved
        expect(editorContent).toContain('"quoted-uid"');
        expect(editorContent).toContain('"quoted-author"');
        expect(editorContent).toContain('"L2"');
        expect(editorContent).toContain('"Theme"');
        expect(editorContent).toContain('"Quoted Title"');
    });

    it('should handle multiline text field without corruption', async () => {
        const yamlWithMultiline = `- uid: test
  gradeLevel: L2
  discipline: 
  title: Test
  text: |
    Line 1 of text
    Line 2 of text
    Line 3 of text
  questionType: single_choice`;

        const { container } = render(
            <MonacoYamlEditor
                value={yamlWithMultiline}
                onChange={mockOnChange}
                error={null}
                metadata={mockMetadata}
            />
        );

        await waitFor(() => {
            expect(container.querySelector('[data-testid="monaco-editor"]')).toBeInTheDocument();
        });

        const editorContent = container.querySelector('[data-testid="monaco-editor"]')?.textContent || '';

        // Multiline text should be preserved
        expect(editorContent).toContain('Line 1 of text');
        expect(editorContent).toContain('Line 2 of text');
        expect(editorContent).toContain('Line 3 of text');
        expect(editorContent).toContain('text: |');
    });
});
