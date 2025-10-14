import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ImportExportControls } from '../components/ImportExportControls';
import { createEmptyQuestion } from '../types';

describe('ImportExportControls', () => {
    const mockQuestions = [
        { ...createEmptyQuestion(), uid: 'q1', title: 'Question 1' },
        { ...createEmptyQuestion(), uid: 'q2', title: 'Question 2' },
    ];

    const mockOnImport = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render import button', () => {
        render(<ImportExportControls questions={mockQuestions} onImport={mockOnImport} />);

        expect(screen.getByText('Importer')).toBeInTheDocument();
    });

    it('should render export button', () => {
        render(<ImportExportControls questions={mockQuestions} onImport={mockOnImport} />);

        expect(screen.getByText('Exporter')).toBeInTheDocument();
    });

    it('should disable export button when no questions', () => {
        render(<ImportExportControls questions={[]} onImport={mockOnImport} />);

        const exportButton = screen.getByRole('button', { name: /exporter/i });
        expect(exportButton).toBeDisabled();
    });

    it('should handle malformed questions gracefully', () => {
        const malformedQuestions = [
            { ...createEmptyQuestion(), uid: 'malformed', title: undefined },
        ];

        render(<ImportExportControls questions={malformedQuestions} onImport={mockOnImport} />);

        // Should render without crashing
        expect(screen.getByText('Importer')).toBeInTheDocument();
        expect(screen.getByText('Exporter')).toBeInTheDocument();
    });
});