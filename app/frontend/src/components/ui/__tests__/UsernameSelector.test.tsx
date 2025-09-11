import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsernameSelector from '../UsernameSelector';

// Mock the prenoms data
jest.mock('@shared/prenoms.json', () => [
    'Louis',
    'Marie',
    'Jean',
    'Pierre',
    'Sophie'
]);

describe('UsernameSelector', () => {
    const mockOnChange = jest.fn();
    const mockOnSuffixChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should auto-select exact match and handle suffix correctly', async () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        // Find the search input (when no firstname is selected yet)
        const searchInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

        // Type "Louis" in the search input - this should auto-select
        fireEvent.change(searchInput, { target: { value: 'Louis' } });

        // The input should now show "Louis" as selected (readOnly input appears)
        await waitFor(() => {
            const selectedInput = screen.getByDisplayValue('Louis');
            expect(selectedInput).toBeInTheDocument();
            expect(selectedInput).toHaveAttribute('readonly');
        });

        // Find the suffix input
        const suffixInput = screen.getByPlaceholderText('Suffixe');

        // Type "F" in the suffix input
        fireEvent.change(suffixInput, { target: { value: 'F' } });

        // Should correctly combine to "Louis F"
        expect(mockOnChange).toHaveBeenLastCalledWith('Louis F');
    });

    it('should work correctly when selecting from dropdown then adding suffix', async () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        const searchInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

        // Type partial "Lou" to show dropdown without auto-selecting
        fireEvent.change(searchInput, { target: { value: 'Lou' } });

        // Click on "Louis" in the dropdown to select it
        const louisOption = await screen.findByText('Louis');
        fireEvent.mouseDown(louisOption);

        // Find the suffix input
        const suffixInput = screen.getByPlaceholderText('Suffixe');

        // Type "F" in the suffix input
        fireEvent.change(suffixInput, { target: { value: 'F' } });

        // Should correctly combine to "Louis F"
        expect(mockOnChange).toHaveBeenLastCalledWith('Louis F');
    });

    it('should auto-select exact match when typing complete prenom', async () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        const searchInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

        // Type complete "Louis" - this should auto-select
        fireEvent.change(searchInput, { target: { value: 'Louis' } });

        // The input should now show "Louis" as selected (readOnly input appears)
        await waitFor(() => {
            const selectedInput = screen.getByDisplayValue('Louis');
            expect(selectedInput).toBeInTheDocument();
            expect(selectedInput).toHaveAttribute('readonly');
        });

        // Find the suffix input
        const suffixInput = screen.getByPlaceholderText('Suffixe');

        // Type "F" in the suffix input
        fireEvent.change(suffixInput, { target: { value: 'F' } });

        // Should correctly combine to "Louis F"
        expect(mockOnChange).toHaveBeenLastCalledWith('Louis F');
    });
});
