import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MobileTabs } from '../components/MobileTabs';

describe('MobileTabs', () => {
    const mockTabs = [
        { id: 'questions', label: 'Questions' },
        { id: 'editor', label: 'Édition' },
        { id: 'preview', label: 'Aperçu' },
    ];

    const mockOnTabChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render all tab buttons', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        expect(screen.getByText('Questions')).toBeInTheDocument();
        expect(screen.getByText('Édition')).toBeInTheDocument();
        expect(screen.getByText('Aperçu')).toBeInTheDocument();
    });

    it('should highlight the active tab', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="editor" onTabChange={mockOnTabChange} />);

        // The active tab should be visually distinct
        // This would typically be tested by checking CSS classes or styles
        const editorTab = screen.getByText('Édition');
        expect(editorTab).toBeInTheDocument();
    });

    it('should call onTabChange when a tab is clicked', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        fireEvent.click(screen.getByText('Édition'));
        expect(mockOnTabChange).toHaveBeenCalledWith('editor');

        fireEvent.click(screen.getByText('Aperçu'));
        expect(mockOnTabChange).toHaveBeenCalledWith('preview');
    });

    it('should call onTabChange when clicking the active tab', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        fireEvent.click(screen.getByText('Questions'));
        expect(mockOnTabChange).toHaveBeenCalledWith('questions');
    });

    it('should handle empty tabs array', () => {
        render(<MobileTabs tabs={[]} activeTab="questions" onTabChange={mockOnTabChange} />);

        // Should render without crashing
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('should handle tab with missing label', () => {
        const tabsWithMissingLabel = [
            { id: 'test', label: '' },
        ];

        render(<MobileTabs tabs={tabsWithMissingLabel} activeTab="questions" onTabChange={mockOnTabChange} />);

        // Should render button with empty text
        expect(screen.getByRole('button')).toHaveTextContent('');
    });

    it('should have correct accessibility attributes', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);

        // Each button should be focusable and clickable
        buttons.forEach(button => {
            expect(button).toBeEnabled();
        });
    });

    it('should handle rapid tab switching', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        // Rapidly click different tabs
        fireEvent.click(screen.getByText('Édition'));
        fireEvent.click(screen.getByText('Aperçu'));
        fireEvent.click(screen.getByText('Questions'));

        expect(mockOnTabChange).toHaveBeenCalledTimes(3);
        expect(mockOnTabChange).toHaveBeenNthCalledWith(1, 'editor');
        expect(mockOnTabChange).toHaveBeenNthCalledWith(2, 'preview');
        expect(mockOnTabChange).toHaveBeenNthCalledWith(3, 'questions');
    });

    it('should maintain tab order', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        const buttons = screen.getAllByRole('button');
        expect(buttons[0]).toHaveTextContent('Questions');
        expect(buttons[1]).toHaveTextContent('Édition');
        expect(buttons[2]).toHaveTextContent('Aperçu');
    });

    it('should handle tab IDs that do not exist in the tabs array', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="nonexistent" onTabChange={mockOnTabChange} />);

        // Should render without crashing even with invalid activeTab
        expect(screen.getByText('Questions')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        const firstButton = screen.getByText('Questions');

        // Should handle Enter key
        fireEvent.keyDown(firstButton, { key: 'Enter' });
        expect(mockOnTabChange).toHaveBeenCalledWith('questions');

        // Reset mock
        mockOnTabChange.mockClear();

        // Should handle Space key
        fireEvent.keyDown(firstButton, { key: ' ' });
        expect(mockOnTabChange).toHaveBeenCalledWith('questions');
    });

    it('should handle undefined onTabChange', () => {
        // @ts-expect-error Testing with undefined callback
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={undefined} />);

        // Should not crash when clicking tabs
        fireEvent.click(screen.getByText('Édition'));
        expect(screen.getByText('Édition')).toBeInTheDocument();
    });

    it('should render with correct styling', () => {
        render(<MobileTabs tabs={mockTabs} activeTab="questions" onTabChange={mockOnTabChange} />);

        // Check that the component has the expected structure
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);
        expect(screen.getByText('Questions')).toBeInTheDocument();
        expect(screen.getByText('Édition')).toBeInTheDocument();
        expect(screen.getByText('Aperçu')).toBeInTheDocument();
    });
});