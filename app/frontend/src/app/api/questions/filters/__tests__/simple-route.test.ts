/**
 * Simplified tests for the questions filters API route
 */

import { GET } from '../route';

// Mock the backend API
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Set environment variable
process.env.NEXT_PUBLIC_BACKEND_API_URL = 'http://localhost:3005';

describe('/api/questions/filters - Simplified Tests', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Basic functionality', () => {
        it('should return filter options with isCompatible flags', async () => {
            // Mock backend response for all options
            const allOptionsResponse = {
                gradeLevel: ['L1', 'L2'],
                disciplines: ['Mathématiques', 'Français'],
                themes: ['Calcul', 'Géométrie'],
                tags: ['additions', 'formes']
            };

            // Mock backend response for filtered options (when gradeLevel=L1)
            const filteredOptionsResponse = {
                gradeLevel: ['L1', 'L2'],
                disciplines: ['Mathématiques'], // Français is not compatible with L1
                themes: ['Calcul'], // Géométrie is not compatible with L1
                tags: ['additions'] // formes is not compatible with L1
            };

            // First call: get all options
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => allOptionsResponse,
            } as Response);

            // Second call: get filtered options
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => filteredOptionsResponse,
            } as Response);

            // Create a mock request with gradeLevel=L1
            const mockRequest = {
                url: 'http://localhost:3000/api/questions/filters?gradeLevel=L1',
                nextUrl: {
                    searchParams: new URLSearchParams('gradeLevel=L1')
                }
            } as any;

            const response = await GET(mockRequest);
            expect(response.status).toBe(200);

            const data = await response.json();

            // Verify structure
            expect(data).toHaveProperty('gradeLevel');
            expect(data).toHaveProperty('disciplines');
            expect(data).toHaveProperty('themes');
            expect(data).toHaveProperty('tags');

            // Verify that all options are FilterOption objects with isCompatible flags
            expect(data.gradeLevel).toEqual([
                { value: 'L1', isCompatible: true },
                { value: 'L2', isCompatible: true }
            ]);

            expect(data.disciplines).toEqual([
                { value: 'Mathématiques', isCompatible: true },
                { value: 'Français', isCompatible: false }
            ]);

            expect(data.themes).toEqual([
                { value: 'Calcul', isCompatible: true },
                { value: 'Géométrie', isCompatible: false }
            ]);

            expect(data.tags).toEqual([
                { value: 'additions', isCompatible: true },
                { value: 'formes', isCompatible: false }
            ]);
        });

        it('should mark all options as compatible when no filters are selected', async () => {
            const allOptionsResponse = {
                gradeLevel: ['L1', 'L2'],
                disciplines: ['Mathématiques', 'Français'],
                themes: ['Calcul', 'Géométrie'],
                tags: ['additions', 'formes']
            };

            // When no filters are selected, both calls should return the same data
            mockFetch.mockResolvedValue({
                ok: true,
                json: async () => allOptionsResponse,
            } as Response);

            // Create a mock request with no filters
            const mockRequest = {
                url: 'http://localhost:3000/api/questions/filters',
                nextUrl: {
                    searchParams: new URLSearchParams('')
                }
            } as any;

            const response = await GET(mockRequest);
            expect(response.status).toBe(200);

            const data = await response.json();

            // All options should be marked as compatible
            expect(data.disciplines.every((option: any) => option.isCompatible)).toBe(true);
            expect(data.themes.every((option: any) => option.isCompatible)).toBe(true);
            expect(data.tags.every((option: any) => option.isCompatible)).toBe(true);
        });

        it('should handle backend errors gracefully', async () => {
            mockFetch.mockRejectedValue(new Error('Backend error'));

            const mockRequest = {
                url: 'http://localhost:3000/api/questions/filters',
                nextUrl: {
                    searchParams: new URLSearchParams('')
                }
            } as any;

            const response = await GET(mockRequest);
            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data).toHaveProperty('error');
        });
    });
});
