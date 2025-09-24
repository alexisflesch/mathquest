/**
 * Tests for the questions filters API route
 * 
 * This tests the cross-filter incompatibility detection functionality
 * that determines which filter options should show warning signs.
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the backend API
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('/api/questions/filters', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Cross-filter incompatibility detection', () => {
        it('should mark incompatible options when filters are selected', async () => {
            // Mock backend responses
            // First call: get ALL available options
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary', 'middle', 'high'],
                    disciplines: ['math', 'science', 'history'],
                    themes: ['algebra', 'geometry', 'biology', 'chemistry'],
                    tags: ['basic', 'advanced', 'quiz', 'exam']
                })
            } as Response);

            // Second call: get COMPATIBLE options with current selections
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary', 'middle'], // 'high' is incompatible
                    disciplines: ['math'], // 'science', 'history' are incompatible
                    themes: ['algebra', 'geometry'], // 'biology', 'chemistry' are incompatible
                    tags: ['basic', 'quiz'] // 'advanced', 'exam' are incompatible
                })
            } as Response);

            const url = new URL('http://localhost:3000/api/questions/filters?gradeLevel=elementary&disciplines=math');
            const request = new NextRequest(url);

            const response = await GET(request);
            const data = await response.json();

            // Verify the structure and incompatibility flags
            expect(data).toEqual({
                gradeLevel: [
                    { value: 'elementary', isCompatible: true },
                    { value: 'middle', isCompatible: true },
                    { value: 'high', isCompatible: false }
                ],
                disciplines: [
                    { value: 'math', isCompatible: true },
                    { value: 'science', isCompatible: false },
                    { value: 'history', isCompatible: false }
                ],
                themes: [
                    { value: 'algebra', isCompatible: true },
                    { value: 'geometry', isCompatible: true },
                    { value: 'biology', isCompatible: false },
                    { value: 'chemistry', isCompatible: false }
                ],
                tags: expect.arrayContaining([
                    { value: 'basic', isCompatible: true },
                    { value: 'quiz', isCompatible: true },
                    { value: 'advanced', isCompatible: false },
                    { value: 'exam', isCompatible: false }
                ])
            });

            // Verify backend was called with correct parameters
            expect(mockFetch).toHaveBeenCalledTimes(2);

            // First call: get all options (no filters)
            expect(mockFetch).toHaveBeenNthCalledWith(1,
                expect.stringContaining('/questions/filters'),
                expect.objectContaining({
                    method: 'GET'
                })
            );

            // Second call: get compatible options (with filters)
            expect(mockFetch).toHaveBeenNthCalledWith(2,
                expect.stringContaining('/questions/filters?gradeLevel=elementary&discipline=math'),
                expect.objectContaining({
                    method: 'GET'
                })
            );
        });

        it('should handle multiple values for the same filter', async () => {
            // Mock backend responses for multiple values
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary', 'middle', 'high'],
                    disciplines: ['math', 'science'],
                    themes: ['algebra', 'geometry', 'biology'],
                    tags: ['basic', 'advanced']
                })
            } as Response);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary', 'middle'], // only these are compatible
                    disciplines: ['math', 'science'],
                    themes: ['algebra', 'geometry'],
                    tags: ['basic']
                })
            } as Response);

            const url = new URL('http://localhost:3000/api/questions/filters?gradeLevel=elementary&gradeLevel=middle&themes=algebra');
            const request = new NextRequest(url);

            const response = await GET(request);
            const data = await response.json();

            expect(data.gradeLevel).toEqual([
                { value: 'elementary', isCompatible: true },
                { value: 'middle', isCompatible: true },
                { value: 'high', isCompatible: false }
            ]);

            expect(data.themes).toEqual([
                { value: 'algebra', isCompatible: true },
                { value: 'geometry', isCompatible: true },
                { value: 'biology', isCompatible: false }
            ]);

            // Verify the backend was called with multiple values properly formatted
            const secondCallUrl = mockFetch.mock.calls[1][0] as string;
            expect(secondCallUrl).toMatch(/gradeLevel=elementary/);
            expect(secondCallUrl).toMatch(/gradeLevel=middle/);
            expect(secondCallUrl).toMatch(/theme=algebra/);
        });

        it('should return all options as compatible when no filters are selected', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary', 'middle', 'high'],
                    disciplines: ['math', 'science'],
                    themes: ['algebra', 'geometry'],
                    tags: ['basic', 'advanced']
                })
            } as Response);

            // When no filters, we only need one call since all options are compatible
            const url = new URL('http://localhost:3000/api/questions/filters');
            const request = new NextRequest(url);

            const response = await GET(request);
            const data = await response.json();

            // All options should be marked as compatible
            expect(data.gradeLevel.every((opt: any) => opt.isCompatible)).toBe(true);
            expect(data.disciplines.every((opt: any) => opt.isCompatible)).toBe(true);
            expect(data.themes.every((opt: any) => opt.isCompatible)).toBe(true);
            expect(data.tags.every((opt: any) => opt.isCompatible)).toBe(true);

            // Should only make one backend call
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should handle backend errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Backend unavailable'));

            const url = new URL('http://localhost:3000/api/questions/filters');
            const request = new NextRequest(url);

            const response = await GET(request);

            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data).toHaveProperty('error');
        });

        it('should handle backend returning empty results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: [],
                    disciplines: [],
                    themes: [],
                    tags: []
                })
            } as Response);

            const url = new URL('http://localhost:3000/api/questions/filters');
            const request = new NextRequest(url);

            const response = await GET(request);
            const data = await response.json();

            expect(data).toEqual({
                gradeLevel: [],
                disciplines: [],
                themes: [],
                tags: []
            });
        });

        it('should properly encode special characters in query parameters', async () => {
            // Mock the first call (all options)
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['K-12'],
                    disciplines: ['Math & Science'],
                    themes: ['Topic A/B'],
                    tags: ['Tag#1']
                })
            } as Response);

            // Mock the second call (compatible options)  
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['K-12'],
                    disciplines: ['Math & Science'],
                    themes: ['Topic A/B'],
                    tags: ['Tag#1']
                })
            } as Response);

            const url = new URL('http://localhost:3000/api/questions/filters?disciplines=Math%20%26%20Science&themes=Topic%20A%2FB');
            const request = new NextRequest(url);

            const response = await GET(request);

            expect(response.status).toBe(200);

            // Verify that special characters are handled correctly
            const backendCallUrl = mockFetch.mock.calls[1][0] as string;
            expect(backendCallUrl).toContain('discipline=Math+%26+Science');
            expect(backendCallUrl).toContain('theme=Topic+A%2FB');
        });
    });

    describe('Filter option structure validation', () => {
        it('should transform backend string arrays to FilterOption objects', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary'],
                    disciplines: ['math'],
                    themes: ['algebra'],
                    tags: ['basic']
                })
            } as Response);

            const url = new URL('http://localhost:3000/api/questions/filters');
            const request = new NextRequest(url);

            const response = await GET(request);
            const data = await response.json();

            // Verify all values are transformed to FilterOption objects
            expect(data.gradeLevel[0]).toEqual({ value: 'elementary', isCompatible: true });
            expect(data.disciplines[0]).toEqual({ value: 'math', isCompatible: true });
            expect(data.themes[0]).toEqual({ value: 'algebra', isCompatible: true });
            expect(data.tags[0]).toEqual({ value: 'basic', isCompatible: true });
        });

        it('should maintain consistent structure across all filter types', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    gradeLevel: ['elementary', 'middle'],
                    disciplines: ['math'],
                    themes: ['algebra', 'geometry', 'calculus'],
                    tags: ['basic']
                })
            } as Response);

            const url = new URL('http://localhost:3000/api/questions/filters');
            const request = new NextRequest(url);

            const response = await GET(request);
            const data = await response.json();

            // Verify all filter types have the same object structure
            const verifyStructure = (options: any[]) => {
                options.forEach(option => {
                    expect(option).toHaveProperty('value');
                    expect(option).toHaveProperty('isCompatible');
                    expect(typeof option.value).toBe('string');
                    expect(typeof option.isCompatible).toBe('boolean');
                });
            };

            verifyStructure(data.gradeLevel);
            verifyStructure(data.disciplines);
            verifyStructure(data.themes);
            verifyStructure(data.tags);
        });
    });
});
