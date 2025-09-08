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

    it('should show all options including incompatible ones with warning signs', () => {
        const mockOnChange = jest.fn();

        render(
            <EnhancedMultiSelectDropdown
                options={mockOptions}
                selected={[]}
                onChange={mockOnChange}
                label="Test Dropdown"
            />
        );

        // Open the dropdown
        const button = screen.getByRole('button');
        fireEvent.click(button);

        // All options should be visible
        expect(screen.getByText('compatible-option')).toBeInTheDocument();
        expect(screen.getByText('incompatible-option')).toBeInTheDocument();
        expect(screen.getByText('another-compatible')).toBeInTheDocument();

        // The incompatible option should have the warning triangle icon
        const alertTriangle = screen.getByTitle('Pas de question disponible avec ce filtre');
        expect(alertTriangle).toBeInTheDocument();
    });

    it('should not filter out incompatible options', () => {
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

        // Even when something is selected, incompatible options should still show
        expect(screen.getByText('incompatible-option')).toBeInTheDocument();
    });
});
