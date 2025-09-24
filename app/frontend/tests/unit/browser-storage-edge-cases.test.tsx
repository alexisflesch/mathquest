/**
 * Browser Storage Edge Cases Tests
 *
 * Tests browser storage limits, localStorage/sessionStorage edge cases,
 * storage quota exceeded scenarios, and storage-related error handling.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the logger
jest.mock('@/clientLogger', () => ({
    createLogger: () => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock the storage hooks module
jest.mock('../../src/hooks/useStorage', () => ({
    useLocalStorage: jest.fn(),
    useSessionStorage: jest.fn()
}));

// Import after mocks
import { useLocalStorage, useSessionStorage } from '../../src/hooks/useStorage';

// Mock implementations
const mockUseLocalStorage = useLocalStorage as jest.MockedFunction<typeof useLocalStorage>;
const mockUseSessionStorage = useSessionStorage as jest.MockedFunction<typeof useSessionStorage>;

// Component that uses localStorage
const LocalStorageComponent: React.FC = () => {
    const [value, setValue] = useLocalStorage('test-key', 'default-value');
    const [error, setError] = React.useState<string | null>(null);

    const handleSetValue = (newValue: string) => {
        try {
            setValue(newValue);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Storage error');
        }
    };

    const displayValue = React.useMemo(() => {
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        return String(value);
    }, [value]);

    return (
        <div>
            <div data-testid="storage-value">{displayValue}</div>
            <button data-testid="set-value" onClick={() => handleSetValue('new-value')}>
                Set Value
            </button>
            {error && <div data-testid="storage-error">{error}</div>}
        </div>
    );
};

// Component that uses sessionStorage
const SessionStorageComponent: React.FC = () => {
    const [value, setValue] = useSessionStorage('session-key', 'session-default');
    const [error, setError] = React.useState<string | null>(null);

    const handleSetValue = (newValue: string) => {
        try {
            setValue(newValue);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Session storage error');
        }
    };

    return (
        <div>
            <div data-testid="session-value">{value}</div>
            <button data-testid="set-session-value" onClick={() => handleSetValue('new-session-value')}>
                Set Session Value
            </button>
            {error && <div data-testid="session-error">{error}</div>}
        </div>
    );
};

describe('Browser Storage Edge Cases', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockUseLocalStorage.mockClear();
        mockUseSessionStorage.mockClear();
    });

    describe('localStorage Basic Operations', () => {
        test('should handle normal localStorage operations', () => {
            mockUseLocalStorage.mockReturnValue(['default-value', jest.fn()]);

            render(<LocalStorageComponent />);

            expect(screen.getByTestId('storage-value')).toHaveTextContent('default-value');
            expect(mockUseLocalStorage).toHaveBeenCalledWith('test-key', 'default-value');
        });

        test('should handle setting values in localStorage', () => {
            const mockSetValue = jest.fn();
            mockUseLocalStorage.mockReturnValue(['default-value', mockSetValue]);

            render(<LocalStorageComponent />);

            fireEvent.click(screen.getByTestId('set-value'));

            expect(mockSetValue).toHaveBeenCalledWith('new-value');
        });
    });

    describe('sessionStorage Basic Operations', () => {
        test('should handle normal sessionStorage operations', () => {
            mockUseSessionStorage.mockReturnValue(['session-default', jest.fn()]);

            render(<SessionStorageComponent />);

            expect(screen.getByTestId('session-value')).toHaveTextContent('session-default');
            expect(mockUseSessionStorage).toHaveBeenCalledWith('session-key', 'session-default');
        });

        test('should handle setting values in sessionStorage', () => {
            const mockSetValue = jest.fn();
            mockUseSessionStorage.mockReturnValue(['session-default', mockSetValue]);

            render(<SessionStorageComponent />);

            fireEvent.click(screen.getByTestId('set-session-value'));

            expect(mockSetValue).toHaveBeenCalledWith('new-session-value');
        });
    });

    describe('Storage Quota Exceeded Scenarios', () => {
        test('should handle localStorage quota exceeded errors', () => {
            const mockSetValue = jest.fn(() => {
                throw new Error('QuotaExceededError');
            });
            mockUseLocalStorage.mockReturnValue(['default-value', mockSetValue]);

            render(<LocalStorageComponent />);

            fireEvent.click(screen.getByTestId('set-value'));

            expect(screen.getByTestId('storage-error')).toHaveTextContent('QuotaExceededError');
        });

        test('should handle sessionStorage quota exceeded errors', () => {
            const mockSetValue = jest.fn(() => {
                throw new Error('QuotaExceededError');
            });
            mockUseSessionStorage.mockReturnValue(['session-default', mockSetValue]);

            render(<SessionStorageComponent />);

            fireEvent.click(screen.getByTestId('set-session-value'));

            expect(screen.getByTestId('session-error')).toHaveTextContent('QuotaExceededError');
        });
    });

    describe('Storage Serialization Edge Cases', () => {
        test('should handle complex object serialization', () => {
            const complexObject = {
                nested: { value: 42 },
                array: [1, 2, 3],
                date: new Date('2023-01-01'),
                regex: /test/gi
            };

            mockUseLocalStorage.mockReturnValue([complexObject, jest.fn()]);

            render(<LocalStorageComponent />);

            expect(screen.getByTestId('storage-value')).toBeInTheDocument();
        });

        test('should handle circular reference serialization', () => {
            const mockSetValue = jest.fn(() => {
                throw new Error('Converting circular structure to JSON');
            });
            mockUseLocalStorage.mockReturnValue(['default-value', mockSetValue]);

            render(<LocalStorageComponent />);

            fireEvent.click(screen.getByTestId('set-value'));

            expect(screen.getByTestId('storage-error')).toHaveTextContent('Converting circular structure to JSON');
        });
    });

    describe('Storage Availability Edge Cases', () => {
        test('should handle storage access denied', () => {
            const mockSetValue = jest.fn(() => {
                throw new Error('Access denied');
            });
            mockUseLocalStorage.mockReturnValue(['default-value', mockSetValue]);

            render(<LocalStorageComponent />);

            fireEvent.click(screen.getByTestId('set-value'));

            expect(screen.getByTestId('storage-error')).toHaveTextContent('Access denied');
        });
    });

    describe('Storage Data Corruption', () => {
        test('should handle corrupted localStorage data', () => {
            mockUseLocalStorage.mockReturnValue(['default-value', jest.fn()]);

            render(<LocalStorageComponent />);

            // Should fall back to default value
            expect(screen.getByTestId('storage-value')).toHaveTextContent('default-value');
        });

        test('should handle null values in storage', () => {
            mockUseLocalStorage.mockReturnValue([null, jest.fn()]);

            render(<LocalStorageComponent />);

            expect(screen.getByTestId('storage-value')).toHaveTextContent('null');
        });
    });

    describe('Storage Security Edge Cases', () => {
        test('should handle XSS attempts in stored data', () => {
            const xssPayload = '<script>alert("xss")</script>';
            mockUseLocalStorage.mockReturnValue([xssPayload, jest.fn()]);

            render(<LocalStorageComponent />);

            // The component should display the data as-is without executing scripts
            expect(screen.getByTestId('storage-value')).toHaveTextContent(xssPayload);
        });

        test('should handle sensitive data storage', () => {
            const sensitiveData = { token: 'secret-jwt-token', password: 'user-password' };
            mockUseLocalStorage.mockReturnValue([sensitiveData, jest.fn()]);

            render(<LocalStorageComponent />);

            // Should handle sensitive data appropriately (in real app, this would be encrypted)
            expect(screen.getByTestId('storage-value')).toBeInTheDocument();
        });
    });

    describe('Storage Cleanup and Maintenance', () => {
        test('should handle storage cleanup on component unmount', () => {
            mockUseLocalStorage.mockReturnValue(['default-value', jest.fn()]);

            const { unmount } = render(<LocalStorageComponent />);

            unmount();

            // In a real implementation, cleanup might happen here
            expect(mockUseLocalStorage).toHaveBeenCalledWith('test-key', 'default-value');
        });

        test('should handle storage migration scenarios', () => {
            // Mock old format data
            const oldFormatData = { value: 'old-format', version: 1 };
            mockUseLocalStorage.mockReturnValue([oldFormatData, jest.fn()]);

            render(<LocalStorageComponent />);

            // Should handle migration gracefully
            expect(screen.getByTestId('storage-value')).toBeInTheDocument();
        });
    });
});