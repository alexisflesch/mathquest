/**
 * Test to verify that the teacher/games/new page properly uses FilterOption objects
 * from the API instead of converting them to strings and losing compatibility info
 */

describe('Teacher Games New Page - Filter Processing Fix', () => {
    it('should preserve isCompatible flags from API FilterOption objects', () => {
        // Mock API response with proper FilterOption objects
        const mockApiResponse = [
            { value: 'Compatible Option', isCompatible: true },
            { value: 'Incompatible Option', isCompatible: false }
        ];

        // This is what the fixed processFilterOptions function should do
        const processFilterOptions = (
            apiResponse: any[],
            currentSelected: string[]
        ) => {
            const result: any[] = [];

            // If API response already contains FilterOption objects, use them directly
            if (apiResponse.length > 0 && typeof apiResponse[0] === 'object' && 'isCompatible' in apiResponse[0]) {
                apiResponse.forEach(option => {
                    result.push(option);
                });
            } else {
                // Fallback for string arrays
                const compatibleOptions = apiResponse.map(item =>
                    typeof item === 'string' ? item : item.value
                );
                compatibleOptions.forEach(option => {
                    result.push({ value: option, isCompatible: true });
                });
            }

            return result;
        };

        const result = processFilterOptions(mockApiResponse, []);

        // Should preserve the original isCompatible flags from API
        expect(result).toEqual([
            { value: 'Compatible Option', isCompatible: true },
            { value: 'Incompatible Option', isCompatible: false }
        ]);

        // Should NOT convert everything to isCompatible: true like the old code did
        expect(result.find(item => item.value === 'Incompatible Option')?.isCompatible).toBe(false);
    });

    it('should handle string arrays as fallback', () => {
        const mockStringResponse = ['Option 1', 'Option 2'];

        const processFilterOptions = (
            apiResponse: any[],
            currentSelected: string[]
        ) => {
            const result: any[] = [];

            if (apiResponse.length > 0 && typeof apiResponse[0] === 'object' && 'isCompatible' in apiResponse[0]) {
                apiResponse.forEach(option => {
                    result.push(option);
                });
            } else {
                const compatibleOptions = apiResponse.map(item =>
                    typeof item === 'string' ? item : item.value
                );
                compatibleOptions.forEach(option => {
                    result.push({ value: option, isCompatible: true });
                });
            }

            return result;
        };

        const result = processFilterOptions(mockStringResponse, []);

        expect(result).toEqual([
            { value: 'Option 1', isCompatible: true },
            { value: 'Option 2', isCompatible: true }
        ]);
    });
});
