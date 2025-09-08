/**
 * Integration test for cross-filter incompatibility warnings on teacher/games/new page
 * 
 * This tests that the warning signs (AlertTriangle icons) appear correctly
 * in the dropdowns when filter selections make other options incompatible.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewGamePage from '../page';

// Mock the API fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock the router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        refresh: jest.fn()
    })
}));

// Mock the toast notifications
jest.mock('react-hot-toast', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        loading: jest.fn()
    }
}));

describe('Cross-filter incompatibility warnings on teacher/games/new', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should show warning signs for incompatible options when filters are selected', async () => {
        // Mock initial filters API response (no selections)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'middle', isCompatible: true },
                    { value: 'high', isCompatible: true }
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: true },
                    { value: 'history', isCompatible: true }
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'geometry', isCompatible: true },
                    { value: 'biology', isCompatible: true }
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: true }
                ]
            })
        } as Response);

        // Mock questions API response (initial empty)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                questions: [],
                totalCount: 0,
                availableFilters: {}
            })
        } as Response);

        render(<NewGamePage />);

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByText('Niveau scolaire')).toBeInTheDocument();
        });

        // Verify no warning signs initially (all options compatible)
        expect(screen.queryByTestId('alert-triangle')).not.toBeInTheDocument();

        // Now mock the API response after selecting a filter (elementary grade)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'middle', isCompatible: true },
                    { value: 'high', isCompatible: false } // Now incompatible!
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: false }, // Incompatible!
                    { value: 'history', isCompatible: false } // Incompatible!
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'geometry', isCompatible: true },
                    { value: 'biology', isCompatible: false } // Incompatible!
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: false } // Incompatible!
                ]
            })
        } as Response);

        // Mock questions API response after filter change
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                questions: [],
                totalCount: 0,
                availableFilters: {}
            })
        } as Response);

        // Select "elementary" grade level
        const gradeLevelDropdown = screen.getByText('Niveau scolaire').closest('.dropdown-container');
        const gradeLevelButton = gradeLevelDropdown?.querySelector('button');

        if (gradeLevelButton) {
            fireEvent.click(gradeLevelButton);
        }

        // Wait for dropdown to open and select elementary
        await waitFor(() => {
            const elementaryOption = screen.getByText('elementary');
            fireEvent.click(elementaryOption);
        });

        // Wait for the filters to update
        await waitFor(() => {
            // Now there should be warning signs for incompatible options
            const warningIcons = screen.getAllByTestId('alert-triangle');
            expect(warningIcons.length).toBeGreaterThan(0);
        });

        // Verify specific incompatible options have warning signs
        // Open disciplines dropdown to check for warnings
        const disciplinesDropdown = screen.getByText('Matières').closest('.dropdown-container');
        const disciplinesButton = disciplinesDropdown?.querySelector('button');

        if (disciplinesButton) {
            fireEvent.click(disciplinesButton);
        }

        await waitFor(() => {
            // Check that "science" and "history" have warning icons
            const scienceOption = screen.getByText('science').closest('.dropdown-item');
            const historyOption = screen.getByText('history').closest('.dropdown-item');

            expect(scienceOption?.querySelector('[data-testid="alert-triangle"]')).toBeInTheDocument();
            expect(historyOption?.querySelector('[data-testid="alert-triangle"]')).toBeInTheDocument();

            // Check that "math" does NOT have a warning icon
            const mathOption = screen.getByText('math').closest('.dropdown-item');
            expect(mathOption?.querySelector('[data-testid="alert-triangle"]')).not.toBeInTheDocument();
        });
    });

    it('should remove warning signs when incompatible selections are cleared', async () => {
        // Start with filters that make some options incompatible
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'high', isCompatible: false }
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: false }
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'biology', isCompatible: false }
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: false }
                ]
            })
        } as Response);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                questions: [],
                totalCount: 0,
                availableFilters: {}
            })
        } as Response);

        render(<NewGamePage />);

        await waitFor(() => {
            expect(screen.getByText('Niveau scolaire')).toBeInTheDocument();
        });

        // Verify warning signs are present
        await waitFor(() => {
            const disciplinesDropdown = screen.getByText('Matières').closest('.dropdown-container');
            const disciplinesButton = disciplinesDropdown?.querySelector('button');

            if (disciplinesButton) {
                fireEvent.click(disciplinesButton);
            }
        });

        await waitFor(() => {
            expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
        });

        // Mock API response after clearing filters (all options become compatible again)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'high', isCompatible: true } // Now compatible again!
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: true } // Now compatible again!
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'biology', isCompatible: true } // Now compatible again!
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: true } // Now compatible again!
                ]
            })
        } as Response);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                questions: [],
                totalCount: 0,
                availableFilters: {}
            })
        } as Response);

        // Clear all filters (simulate clicking a "Clear All" button or similar)
        const clearButton = screen.getByText('Effacer les filtres');
        fireEvent.click(clearButton);

        // Wait for filters to update and warning signs to disappear
        await waitFor(() => {
            expect(screen.queryByTestId('alert-triangle')).not.toBeInTheDocument();
        });
    });

    it('should show warning tooltips when hovering over warning icons', async () => {
        // Mock filters with some incompatible options
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'high', isCompatible: false }
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: false }
                ],
                themes: [
                    { value: 'algebra', isCompatible: true }
                ],
                tags: [
                    { value: 'basic', isCompatible: true }
                ]
            })
        } as Response);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                questions: [],
                totalCount: 0,
                availableFilters: {}
            })
        } as Response);

        render(<NewGamePage />);

        await waitFor(() => {
            expect(screen.getByText('Niveau scolaire')).toBeInTheDocument();
        });

        // Open grade level dropdown
        const gradeLevelDropdown = screen.getByText('Niveau scolaire').closest('.dropdown-container');
        const gradeLevelButton = gradeLevelDropdown?.querySelector('button');

        if (gradeLevelButton) {
            fireEvent.click(gradeLevelButton);
        }

        await waitFor(() => {
            const warningIcon = screen.getByTestId('alert-triangle');

            // Hover over the warning icon
            fireEvent.mouseEnter(warningIcon);
        });

        // Check that tooltip appears
        await waitFor(() => {
            expect(screen.getByText(/incompatible|non compatible|non disponible/i)).toBeInTheDocument();
        });
    });

    it('should handle API errors gracefully and not show warning signs', async () => {
        // Mock API error
        mockFetch.mockRejectedValueOnce(new Error('API Error'));

        render(<NewGamePage />);

        // Even with API error, page should render without warning signs
        await waitFor(() => {
            expect(screen.getByText('Nouveau Quiz')).toBeInTheDocument();
        });

        // No warning signs should appear when API fails
        expect(screen.queryByTestId('alert-triangle')).not.toBeInTheDocument();
    });

    it('should update warning signs dynamically as multiple filters are selected', async () => {
        // Initial state - all compatible
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'middle', isCompatible: true },
                    { value: 'high', isCompatible: true }
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: true }
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'biology', isCompatible: true }
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: true }
                ]
            })
        } as Response);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ questions: [], totalCount: 0, availableFilters: {} })
        } as Response);

        render(<NewGamePage />);

        await waitFor(() => {
            expect(screen.getByText('Niveau scolaire')).toBeInTheDocument();
        });

        // Select first filter (elementary) - some options become incompatible
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'middle', isCompatible: true },
                    { value: 'high', isCompatible: false } // Now incompatible
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: false } // Now incompatible
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'biology', isCompatible: false } // Now incompatible
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: false } // Now incompatible
                ]
            })
        } as Response);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ questions: [], totalCount: 0, availableFilters: {} })
        } as Response);

        // Select elementary
        const gradeLevelDropdown = screen.getByText('Niveau scolaire').closest('.dropdown-container');
        const gradeLevelButton = gradeLevelDropdown?.querySelector('button');

        if (gradeLevelButton) {
            fireEvent.click(gradeLevelButton);
        }

        await waitFor(() => {
            const elementaryOption = screen.getByText('elementary');
            fireEvent.click(elementaryOption);
        });

        // Wait for warning signs to appear
        await waitFor(() => {
            expect(screen.getByTestId('alert-triangle')).toBeInTheDocument();
        });

        // Now select math as well - this should further restrict options
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'middle', isCompatible: false }, // Now also incompatible
                    { value: 'high', isCompatible: false }
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: false }
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'biology', isCompatible: false }
                ],
                tags: [
                    { value: 'basic', isCompatible: true },
                    { value: 'advanced', isCompatible: false }
                ]
            })
        } as Response);

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ questions: [], totalCount: 0, availableFilters: {} })
        } as Response);

        // Select math discipline
        const disciplinesDropdown = screen.getByText('Matières').closest('.dropdown-container');
        const disciplinesButton = disciplinesDropdown?.querySelector('button');

        if (disciplinesButton) {
            fireEvent.click(disciplinesButton);
        }

        await waitFor(() => {
            const mathOption = screen.getByText('math');
            fireEvent.click(mathOption);
        });

        // Verify that even more options are now marked as incompatible
        await waitFor(() => {
            // Open grade level dropdown again to see updated warnings
            if (gradeLevelButton) {
                fireEvent.click(gradeLevelButton);
            }
        });

        await waitFor(() => {
            // Now "middle" should also have a warning icon (it became incompatible)
            const middleOption = screen.getByText('middle').closest('.dropdown-item');
            expect(middleOption?.querySelector('[data-testid="alert-triangle"]')).toBeInTheDocument();
        });
    });
});
