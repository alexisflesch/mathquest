/**
 * Test StorageEvent Polyfill
 *
 * This test verifies that the StorageEvent polyfill works correctly
 * in the jsdom test environment.
 */

describe('StorageEvent Polyfill', () => {
    it('should have StorageEvent constructor available', () => {
        expect(window.StorageEvent).toBeDefined();
        expect(typeof window.StorageEvent).toBe('function');
    });

    it('should create StorageEvent instances correctly', () => {
        const event = new window.StorageEvent('storage', {
            key: 'testKey',
            oldValue: 'oldValue',
            newValue: 'newValue',
            storageArea: localStorage
        });

        expect(event).toBeInstanceOf(Event);
        expect(event.type).toBe('storage');
        expect(event.key).toBe('testKey');
        expect(event.oldValue).toBe('oldValue');
        expect(event.newValue).toBe('newValue');
        expect(event.storageArea).toBe(localStorage);
    });

    it('should handle StorageEvent with minimal options', () => {
        const event = new window.StorageEvent('storage');

        expect(event).toBeInstanceOf(Event);
        expect(event.type).toBe('storage');
        expect(event.key).toBeNull();
        expect(event.oldValue).toBeNull();
        expect(event.newValue).toBeNull();
        expect(event.storageArea).toBeNull();
    });

    it('should work with useStorage hooks', () => {
        // This test verifies that the StorageEvent polyfill doesn't break
        // the useStorage hooks that depend on StorageEvent typing
        expect(() => {
            // Just importing the hook should work without TypeScript errors
            const { useLocalStorage } = require('../../src/hooks/useStorage');
            expect(useLocalStorage).toBeDefined();
        }).not.toThrow();
    });
});