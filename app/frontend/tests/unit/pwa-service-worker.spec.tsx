/**
 * PWA/Service Worker Unit Tests
 *
 * Tests for Progressive Web App functionality and service worker behavior
 * including offline support, caching strategies, and background sync.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';

// Add Jest globals
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;

// Mock service worker registration
const mockRegister = jest.fn() as any;
const mockUnregister = jest.fn() as any;
const mockUpdate = jest.fn() as any;

Object.defineProperty(navigator, 'serviceWorker', {
    value: {
        register: mockRegister,
        ready: Promise.resolve({
            active: { state: 'activated' },
            waiting: null,
            unregister: mockUnregister,
            update: mockUpdate
        }),
        getRegistrations: jest.fn() as any,
        getRegistration: jest.fn() as any,
    },
    writable: true
});

// Mock Cache API
const mockCache = {
    match: jest.fn() as any,
    matchAll: jest.fn() as any,
    add: jest.fn() as any,
    addAll: jest.fn() as any,
    put: jest.fn() as any,
    delete: jest.fn() as any,
    keys: jest.fn() as any
};

Object.defineProperty(window, 'caches', {
    value: {
        open: jest.fn() as any,
        keys: jest.fn() as any,
        delete: jest.fn() as any,
        has: jest.fn() as any,
    },
    writable: true
});

// Mock IndexedDB
const mockIDBFactory = {
    open: jest.fn() as any,
    deleteDatabase: jest.fn() as any,
    cmp: jest.fn() as any,
    databases: jest.fn() as any,
};

Object.defineProperty(window, 'indexedDB', {
    value: mockIDBFactory,
    writable: true
});

// Mock fetch for network requests
const mockFetch = jest.fn() as any;
(global.fetch as any) = mockFetch;

// Mock Notification API
Object.defineProperty(window, 'Notification', {
    value: {
        permission: 'default',
        requestPermission: jest.fn() as any,
    },
    writable: true
});

// Mock beforeinstallprompt event
const mockBeforeInstallPromptEvent = new Event('beforeinstallprompt');
Object.assign(mockBeforeInstallPromptEvent, {
    preventDefault: jest.fn() as any,
    prompt: jest.fn() as any,
    userChoice: Promise.resolve({ outcome: 'accepted' })
});

describe('PWA/Service Worker Tests', () => {
    let mockServiceWorker: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset all mocks
        mockRegister.mockResolvedValue({
            active: { state: 'activated' },
            waiting: null,
            installing: null
        });

        // Mock caches methods
        (window.caches.keys as any).mockResolvedValue(['mathquest-v1']);
        (window.caches.delete as any).mockResolvedValue(true);
        (window.caches.has as any).mockResolvedValue(true);

        // Mock notification permission
        (window.Notification.requestPermission as any).mockResolvedValue('granted');

        // Mock service worker global for push notifications
        const mockSWRegistration = {
            showNotification: jest.fn() as any
        };
        (global as any).self = {
            registration: mockSWRegistration
        };

        mockCache.match.mockResolvedValue(null);
        mockCache.matchAll.mockResolvedValue([]);
        mockCache.add.mockResolvedValue(undefined);
        mockCache.put.mockResolvedValue(undefined);
        mockCache.keys.mockResolvedValue([]);

        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ data: 'test' })
        });

        // Mock service worker instance
        mockServiceWorker = {
            postMessage: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
    });

    describe('Service Worker Registration', () => {
        it('should register service worker on app load', async () => {
            // Import the service worker registration logic
            // This would typically be in a useEffect or component
            const registerSW = async (): Promise<ServiceWorkerRegistration | null> => {
                if ('serviceWorker' in navigator) {
                    try {
                        const registration = await navigator.serviceWorker.register('/sw.js');
                        console.log('SW registered:', registration);
                        return registration;
                    } catch (error) {
                        console.error('SW registration failed:', error);
                        throw error;
                    }
                }
                return null;
            };

            await registerSW();

            expect(mockRegister).toHaveBeenCalledWith('/sw.js');
            expect(mockRegister).toHaveBeenCalledTimes(1);
        });

        it('should handle service worker registration errors gracefully', async () => {
            mockRegister.mockRejectedValue(new Error('Registration failed'));

            const registerSW = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    return registration;
                } catch (error) {
                    console.error('SW registration failed:', error);
                    return null;
                }
            };

            const result = await registerSW();

            expect(result).toBeNull();
            expect(mockRegister).toHaveBeenCalledWith('/sw.js');
        });

        it('should skip registration when service worker is not supported', () => {
            // Create a mock navigator without service worker
            const mockNavigator = {} as any;
            const originalNavigator = global.navigator;

            // Temporarily replace global navigator
            Object.defineProperty(global, 'navigator', {
                value: mockNavigator,
                writable: true
            });

            const registerSW = () => {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js');
                    return 'registered';
                }
                return 'skipped';
            };

            const result = registerSW();

            expect(result).toBe('skipped');
            expect(mockRegister).not.toHaveBeenCalled();

            // Restore original navigator
            Object.defineProperty(global, 'navigator', {
                value: originalNavigator,
                writable: true
            });
        });

        describe('Offline Caching', () => {
            it('should cache static assets on install', async () => {
                // Ensure cache mock is set up for this test
                (window.caches.open as any).mockResolvedValue(mockCache);

                const cacheAssets = async () => {
                    const cache = await caches.open('mathquest-v1');
                    await cache.addAll([
                        '/',
                        '/manifest.json',
                        '/favicon.ico',
                        '/static/js/bundle.js',
                        '/static/css/main.css'
                    ]);
                    return cache;
                };

                await cacheAssets();

                expect(window.caches.open).toHaveBeenCalledWith('mathquest-v1');
                expect(mockCache.addAll).toHaveBeenCalledWith([
                    '/',
                    '/manifest.json',
                    '/favicon.ico',
                    '/static/js/bundle.js',
                    '/static/css/main.css'
                ]);
            });

            it('should serve cached content when offline', async () => {
                // Ensure cache mock is set up for this test
                (window.caches.open as any).mockResolvedValue(mockCache);

                // Mock cached response
                const mockCachedResponse = {
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ cached: true }),
                    clone: jest.fn().mockReturnValue({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ cached: true })
                    })
                };

                (mockCache.match as any).mockResolvedValue(mockCachedResponse);

                const getCachedOrFetch = async (url: string) => {
                    const cache = await caches.open('mathquest-v1');
                    const cachedResponse = await cache.match(url);

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(url);
                };

                const response = await getCachedOrFetch('/api/questions');

                expect(mockCache.match).toHaveBeenCalledWith('/api/questions');
                expect(response).toBe(mockCachedResponse);
                expect(mockFetch).not.toHaveBeenCalled();
            });

            it('should fetch from network when cache misses', async () => {
                // Ensure cache mock is set up for this test
                (window.caches.open as any).mockResolvedValue(mockCache);

                (mockCache.match as any).mockResolvedValue(null);

                const mockNetworkResponse = {
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ data: 'from network' }),
                    clone: jest.fn().mockReturnValue({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ data: 'from network' })
                    })
                };

                (mockFetch as any).mockResolvedValue(mockNetworkResponse);

                const getCachedOrFetch = async (url: string) => {
                    const cache = await caches.open('mathquest-v1');
                    const cachedResponse = await cache.match(url);

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    const networkResponse = await fetch(url);
                    if (networkResponse.ok) {
                        cache.put(url, networkResponse.clone());
                    }
                    return networkResponse;
                };

                const response = await getCachedOrFetch('/api/questions');

                expect(mockCache.match).toHaveBeenCalledWith('/api/questions');
                expect(mockFetch).toHaveBeenCalledWith('/api/questions');
                expect(mockCache.put).toHaveBeenCalledWith('/api/questions', expect.any(Object));
            });
        });

        describe('Background Sync', () => {
            it('should register background sync for offline actions', async () => {
                const mockSyncManager = {
                    register: jest.fn() as any,
                    getTags: jest.fn() as any,
                };

                // Mock service worker with sync manager
                const mockRegistration = {
                    sync: mockSyncManager,
                    active: mockServiceWorker
                } as any;

                mockRegister.mockResolvedValue(mockRegistration);

                const registerBackgroundSync = async () => {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    if ('sync' in registration) {
                        await (registration as any).sync.register('answer-submission');
                    }
                };

                await registerBackgroundSync();

                expect(mockSyncManager.register).toHaveBeenCalledWith('answer-submission');
            });

            it('should handle background sync events in service worker', () => {
                const mockSyncEvent = {
                    tag: 'answer-submission',
                    waitUntil: jest.fn()
                };

                // Simulate service worker sync event handler
                const handleSync = (event: any) => {
                    if (event.tag === 'answer-submission') {
                        event.waitUntil(
                            // Process queued answer submissions
                            Promise.resolve('sync completed')
                        );
                    }
                };

                handleSync(mockSyncEvent);

                expect(mockSyncEvent.waitUntil).toHaveBeenCalledWith(
                    expect.any(Promise)
                );
            });
        });

        describe('Push Notifications', () => {
            it('should request notification permission on user interaction', async () => {
                const requestNotificationPermission = async () => {
                    if ('Notification' in window) {
                        const permission = await Notification.requestPermission();
                        return permission;
                    }
                    return 'denied';
                };

                const permission = await requestNotificationPermission();

                expect(window.Notification.requestPermission).toHaveBeenCalled();
                expect(permission).toBe('granted');
            });

            it('should handle push messages from service worker', () => {
                // Mock service worker global using Object.defineProperty
                const mockSWRegistration = {
                    showNotification: jest.fn() as any
                };

                Object.defineProperty(global, 'self', {
                    value: {
                        registration: mockSWRegistration
                    },
                    writable: true
                });

                const mockPushEvent = {
                    data: {
                        json: () => ({
                            title: 'New Question Available',
                            body: 'A new math question is ready!',
                            icon: '/icon.png'
                        })
                    },
                    waitUntil: jest.fn()
                };

                // Simulate service worker push event handler
                const handlePush = (event: any) => {
                    const data = event.data.json();

                    event.waitUntil(
                        (self as any).registration.showNotification(data.title, {
                            body: data.body,
                            icon: data.icon
                        })
                    );
                };

                handlePush(mockPushEvent);

                expect(mockPushEvent.waitUntil).toHaveBeenCalled();
            });
        });

        describe('Install Prompt', () => {
            it('should handle PWA install prompt', async () => {
                let installPrompt: any = null;

                const handleInstallPrompt = (event: any) => {
                    event.preventDefault();
                    installPrompt = event;
                };

                // Simulate beforeinstallprompt event
                window.addEventListener('beforeinstallprompt', handleInstallPrompt);

                // Dispatch the event
                window.dispatchEvent(mockBeforeInstallPromptEvent);

                expect(mockBeforeInstallPromptEvent.preventDefault).toHaveBeenCalled();
                expect(installPrompt).toBe(mockBeforeInstallPromptEvent);

                // Simulate user accepting install
                if (installPrompt) {
                    installPrompt.prompt();
                    const choice = await installPrompt.userChoice;
                    expect(choice.outcome).toBe('accepted');
                }
            });

            it('should show custom install button when prompt is available', () => {
                const InstallButton = () => {
                    const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

                    React.useEffect(() => {
                        const handleInstallPrompt = (event: any) => {
                            event.preventDefault();
                            setDeferredPrompt(event);
                        };

                        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
                        return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
                    }, []);

                    const handleInstall = async () => {
                        if (deferredPrompt) {
                            deferredPrompt.prompt();
                            const choice = await deferredPrompt.userChoice;
                            setDeferredPrompt(null);
                            return choice;
                        }
                    };

                    return deferredPrompt ? (
                        <button onClick={handleInstall} data-testid="install-button">
                            Install App
                        </button>
                    ) : null;
                };

                const { rerender } = render(<InstallButton />);

                // Initially no button should be shown
                expect(screen.queryByTestId('install-button')).not.toBeInTheDocument();

                // Simulate install prompt event
                act(() => {
                    window.dispatchEvent(mockBeforeInstallPromptEvent);
                });

                // Rerender to pick up state change
                rerender(<InstallButton />);

                // Now button should be visible
                expect(screen.getByTestId('install-button')).toBeInTheDocument();
            });
        });

        describe('Cache Management', () => {
            it('should clean up old caches on service worker activate', async () => {
                const currentCacheName = 'mathquest-v2';
                const oldCacheNames = ['mathquest-v1', 'mathquest-old'];

                // Mock the keys to return old cache names
                (window.caches.keys as any).mockResolvedValue(oldCacheNames);

                const cleanupOldCaches = async () => {
                    const cacheNames = await caches.keys();
                    const deletePromises = cacheNames
                        .filter(name => name !== currentCacheName)
                        .map(name => caches.delete(name));

                    await Promise.all(deletePromises);
                    return deletePromises.length; // Return number of delete operations
                };

                const deletedCount = await cleanupOldCaches();

                expect(window.caches.keys).toHaveBeenCalled();
                expect(window.caches.delete).toHaveBeenCalledTimes(2);
                expect(window.caches.delete).toHaveBeenCalledWith('mathquest-v1');
                expect(window.caches.delete).toHaveBeenCalledWith('mathquest-old');
                expect(deletedCount).toBe(2);
            });

            it('should handle cache storage quota exceeded', async () => {
                // Ensure cache mock is set up for this test
                (window.caches.open as any).mockResolvedValue(mockCache);

                const mockQuotaError = new Error('Quota exceeded');
                mockQuotaError.name = 'QuotaExceededError';

                mockCache.put.mockRejectedValue(mockQuotaError);

                const storeInCache = async (url: string, response: any) => {
                    try {
                        const cache = await caches.open('mathquest-v1');
                        await cache.put(url, response);
                        return 'stored';
                    } catch (error) {
                        if ((error as any).name === 'QuotaExceededError') {
                            // Clear old entries and retry
                            await clearOldCacheEntries();
                            return 'quota_exceeded';
                        }
                        throw error;
                    }
                };

                const clearOldCacheEntries = async () => {
                    const cache = await caches.open('mathquest-v1');
                    const keys = await cache.keys();
                    // Remove oldest 50% of entries
                    const toDelete = keys.slice(0, Math.floor(keys.length / 2));
                    await Promise.all(toDelete.map(request => cache.delete(request)));
                };

                const result = await storeInCache('/api/questions', {});

                expect(result).toBe('quota_exceeded');
                expect(mockCache.put).toHaveBeenCalled();
            });
        });

        describe('Network Status Detection', () => {
            it('should detect online/offline status changes', () => {
                let isOnline = navigator.onLine;
                let statusChanges: string[] = [];

                const handleOnline = () => {
                    isOnline = true;
                    statusChanges.push('online');
                };

                const handleOffline = () => {
                    isOnline = false;
                    statusChanges.push('offline');
                };

                window.addEventListener('online', handleOnline);
                window.addEventListener('offline', handleOffline);

                // Simulate going offline
                window.dispatchEvent(new Event('offline'));
                expect(statusChanges).toContain('offline');
                expect(isOnline).toBe(false);

                // Simulate coming back online
                window.dispatchEvent(new Event('online'));
                expect(statusChanges).toContain('online');
                expect(isOnline).toBe(true);

                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            });

            it('should queue requests when offline', async () => {
                let isOnline = false;
                const queuedRequests: any[] = [];

                const makeRequest = async (url: string, data: any) => {
                    if (!isOnline) {
                        // Queue for later
                        queuedRequests.push({ url, data, timestamp: Date.now() });
                        return { queued: true };
                    }

                    return fetch(url, {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                };

                // Simulate offline request
                const result = await makeRequest('/api/submit-answer', { answerId: 'a1' });

                expect(result).toEqual({ queued: true });
                expect(queuedRequests).toHaveLength(1);
                expect(queuedRequests[0]).toMatchObject({
                    url: '/api/submit-answer',
                    data: { answerId: 'a1' }
                });
            });
        });

        describe('Cache Busting', () => {
            it('should update cache when new service worker version is deployed', async () => {
                const oldCacheName = 'mathquest-v1';
                const newCacheName = 'mathquest-v2';

                // Mock existing cache
                const mockOldCache = {
                    keys: jest.fn() as any,
                    match: jest.fn() as any,
                    put: jest.fn() as any,
                    delete: jest.fn() as any
                };

                (window.caches.open as any).mockResolvedValue(mockOldCache);
                (window.caches.keys as any).mockResolvedValue([oldCacheName]);

                // Simulate cache busting logic
                const cacheBustingLogic = async () => {
                    const cacheNames = await window.caches.keys();
                    const oldCaches = cacheNames.filter(name => name !== newCacheName && name.startsWith('mathquest-'));

                    // Delete old caches
                    await Promise.all(oldCaches.map(name => window.caches.delete(name)));

                    // Open new cache
                    const newCache = await window.caches.open(newCacheName);
                    return { deletedCaches: oldCaches, newCache };
                };

                const result = await cacheBustingLogic();

                expect(window.caches.keys).toHaveBeenCalled();
                expect(window.caches.delete).toHaveBeenCalledWith(oldCacheName);
                expect(window.caches.open).toHaveBeenCalledWith(newCacheName);
                expect(result.deletedCaches).toContain(oldCacheName);
            });

            it('should not serve stale assets after cache busting', async () => {
                const cacheName = 'mathquest-v2';
                const assetUrl = '/static/app.js';
                const oldAsset = { version: 'v1.0.0' };
                const newAsset = { version: 'v2.0.0' };

                const mockCache = {
                    keys: jest.fn() as any,
                    match: jest.fn() as any,
                    put: jest.fn() as any,
                    delete: jest.fn() as any
                };

                // Mock cache miss for old asset
                mockCache.match.mockResolvedValue(null);
                (window.caches.open as any).mockResolvedValue(mockCache);

                // Simulate asset fetching with cache busting
                const fetchAsset = async (url: string) => {
                    const cache = await window.caches.open(cacheName);
                    let cachedResponse = await cache.match(url);

                    if (!cachedResponse) {
                        // Fetch from network and cache
                        const networkResponse = await fetch(url);
                        await cache.put(url, networkResponse.clone());
                        cachedResponse = networkResponse;
                    }

                    return cachedResponse;
                };

                // Mock fetch to return new asset
                (global.fetch as any).mockResolvedValue({
                    clone: () => newAsset,
                    json: () => Promise.resolve(newAsset)
                });

                const result = await fetchAsset(assetUrl);

                expect(mockCache.match).toHaveBeenCalledWith(assetUrl);
                expect(global.fetch).toHaveBeenCalledWith(assetUrl);
                expect(mockCache.put).toHaveBeenCalledWith(assetUrl, newAsset);
            });
        });

        describe('API Response Caching', () => {
            it('should not cache leaderboard API responses', async () => {
                const leaderboardUrl = '/api/leaderboard/game-123';
                const mockResponse = {
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ leaderboard: [{ name: 'Alice', score: 100 }] }),
                    clone: jest.fn(() => mockResponse) as any,
                    headers: new Map([['cache-control', 'no-cache']])
                };

                const mockCache = {
                    keys: jest.fn() as any,
                    match: jest.fn() as any,
                    put: jest.fn() as any,
                    delete: jest.fn() as any
                };

                // Mock cache miss
                mockCache.match.mockResolvedValue(null);
                (window.caches.open as any).mockResolvedValue(mockCache);
                (global.fetch as any).mockResolvedValue(mockResponse);

                // Simulate service worker fetch handler for API requests
                const handleApiRequest = async (url: string) => {
                    // Check if it's an API request that shouldn't be cached
                    if (url.includes('/api/leaderboard') || url.includes('/api/stats')) {
                        // Always fetch from network for live data
                        const response = await fetch(url);
                        return response;
                    }

                    // For other requests, use cache-first strategy
                    const cache = await window.caches.open('mathquest-v1');
                    const cachedResponse = await cache.match(url);

                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    const networkResponse = await fetch(url);
                    await cache.put(url, networkResponse.clone());
                    return networkResponse;
                };

                const result = await handleApiRequest(leaderboardUrl);

                // Should not check cache for leaderboard API
                expect(mockCache.match).not.toHaveBeenCalled();
                expect(global.fetch).toHaveBeenCalledWith(leaderboardUrl);
                expect(result).toBe(mockResponse);
            });

            it('should respect cache-control headers for API responses', async () => {
                const statsUrl = '/api/stats/game-123';
                const mockResponse = {
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ totalQuestions: 10, totalParticipants: 25 }),
                    clone: jest.fn(() => mockResponse) as any,
                    headers: new Map([
                        ['cache-control', 'no-cache, no-store'],
                        ['pragma', 'no-cache']
                    ])
                };

                const mockCache = {
                    keys: jest.fn() as any,
                    match: jest.fn() as any,
                    put: jest.fn() as any,
                    delete: jest.fn() as any
                };

                (window.caches.open as any).mockResolvedValue(mockCache);
                (global.fetch as any).mockResolvedValue(mockResponse);

                // Simulate cache control header checking
                const shouldCacheResponse = (response: any) => {
                    const cacheControl = response.headers.get('cache-control') || '';
                    const pragma = response.headers.get('pragma') || '';

                    // Don't cache if no-cache, no-store, or private directives are present
                    return !cacheControl.includes('no-cache') &&
                        !cacheControl.includes('no-store') &&
                        !cacheControl.includes('private') &&
                        pragma !== 'no-cache';
                };

                const result = shouldCacheResponse(mockResponse);

                expect(result).toBe(false); // Should not cache due to no-cache directive
            });

            it('should cache static assets but not API responses', async () => {
                const staticAssetUrl = '/static/styles.css';
                const apiUrl = '/api/questions';

                const mockResponse = {
                    ok: true,
                    status: 200,
                    clone: jest.fn(() => mockResponse) as any,
                    headers: new Map([['cache-control', 'public, max-age=3600']])
                };

                const mockCache = {
                    keys: jest.fn() as any,
                    match: jest.fn() as any,
                    put: jest.fn() as any,
                    delete: jest.fn() as any
                };

                mockCache.match.mockResolvedValue(null);
                (window.caches.open as any).mockResolvedValue(mockCache);
                (global.fetch as any).mockResolvedValue(mockResponse);

                // Simulate different caching strategies
                const handleRequest = async (url: string) => {
                    const cache = await window.caches.open('mathquest-v1');

                    if (url.startsWith('/api/')) {
                        // Network-first for API
                        try {
                            const response = await fetch(url);
                            return response;
                        } catch (error) {
                            // Fallback to cache
                            return await cache.match(url);
                        }
                    } else {
                        // Cache-first for static assets
                        const cached = await cache.match(url);
                        if (cached) return cached;

                        const response = await fetch(url);
                        await cache.put(url, response.clone());
                        return response;
                    }
                };

                // Test static asset caching
                await handleRequest(staticAssetUrl);
                expect(mockCache.put).toHaveBeenCalledWith(staticAssetUrl, mockResponse);

                // Reset mocks
                mockCache.put.mockClear();
                mockCache.match.mockResolvedValue(null);

                // Test API request (should not cache)
                await handleRequest(apiUrl);
                expect(mockCache.put).not.toHaveBeenCalled();
            });
        });
    });
});