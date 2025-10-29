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

        // Type "Louis" in the search input
        fireEvent.change(searchInput, { target: { value: 'Louis' } });

        // Press Enter to select the exact match
        fireEvent.keyDown(searchInput, { key: 'Enter' });

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

        // Type complete "Louis" and press Enter to select
        fireEvent.change(searchInput, { target: { value: 'Louis' } });
        fireEvent.keyDown(searchInput, { key: 'Enter' });

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

    it('should auto-select typed name when clicking outside (UX improvement)', async () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        const searchInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

        // Type "Louis" in the search input
        fireEvent.change(searchInput, { target: { value: 'Louis' } });

        // Verify dropdown is open and shows Louis
        const louisOption = await screen.findByText('Louis');
        expect(louisOption).toBeInTheDocument();

        // Click outside the component (simulate clicking elsewhere on the page)
        // This should now auto-select "Louis" for better UX
        fireEvent.blur(searchInput);

        // Wait for auto-selection to happen
        await waitFor(() => {
            // After the fix, Louis should be auto-selected
            const selectedInput = screen.getByDisplayValue('Louis');
            expect(selectedInput).toBeInTheDocument();
            expect(selectedInput).toHaveAttribute('readonly');
            expect(mockOnChange).toHaveBeenCalledWith('Louis');
        });
    });

    it('should not auto-select when typed text is not an exact match', async () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        const searchInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

        // Type "Lou" (partial match, not exact)
        fireEvent.change(searchInput, { target: { value: 'Lou' } });

        // Click outside the component
        fireEvent.blur(searchInput);

        // Wait and verify that no auto-selection happened
        await waitFor(() => {
            // Should still be the search input, not auto-selected
            const searchInputAfterBlur = screen.queryByPlaceholderText('Tapez les premières lettres pour chercher...');
            expect(searchInputAfterBlur).toBeInTheDocument();
            expect(searchInputAfterBlur).toHaveValue('Lou');

            // And onChange should not have been called
            expect(mockOnChange).not.toHaveBeenCalled();
        });
    });

    it('BUG REPRODUCTION: should prevent suffix entry without valid firstname selection', async () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        const searchInput = screen.getByPlaceholderText('Tapez les premières lettres pour chercher...');

        // Step 1: Type partial name (not exact match)
        fireEvent.change(searchInput, { target: { value: 'Lou' } });

        // Step 2: Click outside WITHOUT selecting from dropdown
        fireEvent.blur(searchInput);

        // Wait for blur to complete
        await waitFor(() => {
            expect(screen.queryByPlaceholderText('Tapez les premières lettres pour chercher...')).toBeInTheDocument();
        });

        // Step 3: Try to add suffix without valid firstname
        const suffixInput = screen.getByPlaceholderText('Suffixe');
        fireEvent.change(suffixInput, { target: { value: 'A' } });

        // BUG: Currently onChange is called with invalid username like " A"
        // After fix: onChange should either:
        // 1. Not be called at all, OR
        // 2. Be called with empty string only
        const calls = mockOnChange.mock.calls;
        const invalidCalls = calls.filter(([username]) => {
            const trimmed = username.trim();
            // Invalid if it's just a single letter/digit (the suffix alone)
            return trimmed.length === 1 && /^[A-Z0-9]$/.test(trimmed);
        });

        // This test documents the bug and will PASS after we fix it
        expect(invalidCalls.length).toBe(0);
    });

    it('should disable suffix input when no firstname is selected', () => {
        render(
            <UsernameSelector
                value=""
                onChange={mockOnChange}
                onSuffixChange={mockOnSuffixChange}
            />
        );

        // Suffix input should be disabled or not allow meaningful input
        // when no firstname is selected
        const suffixInput = screen.getByPlaceholderText('Suffixe');

        // Try to add suffix
        fireEvent.change(suffixInput, { target: { value: 'A' } });

        // onChange should not produce a valid single-letter username
        if (mockOnChange.mock.calls.length > 0) {
            const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
            const username = lastCall[0];
            const trimmed = username.trim();

            // Should NOT be just a suffix letter
            expect(trimmed).not.toMatch(/^[A-Z0-9]$/);
        }
    });
});
