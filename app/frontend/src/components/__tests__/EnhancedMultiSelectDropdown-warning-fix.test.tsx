/**
 * Test for the fixed EnhancedMultiSelectDropdown component
 * This verifies that incompatible options show with warning signs
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedMultiSelectDropdown from '../EnhancedMultiSelectDropdown';

describe('EnhancedMultiSelectDropdown - Warning Signs Fix', () => {
    const mockOptions = [
        { value: 'compatible-option', isCompatible: true },
        { value: 'incompatible-option', isCompatible: false },
        { value: 'another-compatible', isCompatible: true },
    ];

    it('should show warning signs for incompatible selected options', () => {
        const mockOnChange = jest.fn();

        render(
            <EnhancedMultiSelectDropdown
                options={mockOptions}
                selected={['incompatible-option']} // Pre-select the incompatible option
                onChange={mockOnChange}
                label="Test Dropdown"
            />
        );

        // Open the dropdown
        const button = screen.getByRole('button');
        fireEvent.click(button);

        // All options should be visible (compatible ones always, incompatible only if selected)
        expect(screen.getByText('compatible-option')).toBeInTheDocument();
        expect(screen.getByText('incompatible-option')).toBeInTheDocument(); // This should be visible because it's selected
        expect(screen.getByText('another-compatible')).toBeInTheDocument();

        // The incompatible option should have the warning triangle icon
        const alertTriangle = screen.getByTitle('Pas de question disponible avec ce filtre');
        expect(alertTriangle).toBeInTheDocument();
    });

    it('should filter out incompatible options when not selected', () => {
        const mockOnChange = jest.fn();

        render(
            <EnhancedMultiSelectDropdown
                options={mockOptions}
                selected={['compatible-option']}
                onChange={mockOnChange}
                label="Test Dropdown"
            />
        );

        // Open the dropdown
        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Compatible options should be visible in the dropdown list
        const dropdownOptions = screen.getAllByText('compatible-option');
        expect(dropdownOptions.length).toBeGreaterThan(0);

        expect(screen.getByText('another-compatible')).toBeInTheDocument();

        // Incompatible options should be filtered out when not selected
        expect(screen.queryByText('incompatible-option')).not.toBeInTheDocument();
    });
});
