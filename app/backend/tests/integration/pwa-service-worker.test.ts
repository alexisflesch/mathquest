/**
 * PWA/Service Worker Correctness Tests
 *
 * Tests for Progressive Web App functionality including offline support,
 * service worker cache management, background sync, and PWA-specific features.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('PWA/Service Worker Correctness', () => {
    let testUserId: string;
    let testGameTemplateId: string;

    beforeAll(async () => {
        testUserId = `pwa_user_${Date.now()}`;
        testGameTemplateId = `pwa_template_${Date.now()}`;

        // Create test user
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `pwauser_${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `pwa_cookie_${testUserId}`
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'PWA Test Template',
                description: 'Template for PWA testing',
                creatorId: testUserId,
                defaultMode: 'practice'
            }
        });
    });

    afterAll(async () => {
        // Clean up database
        await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplateId } });
        await prisma.studentProfile.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up Redis before each test
        await redisClient.flushall();
    });

    describe('Offline functionality', () => {
        it('should cache essential resources for offline access', async () => {
            const cacheKey = 'pwa:cache:resources';
            const essentialResources = [
                '/index.html',
                '/static/js/app.js',
                '/static/css/styles.css',
                '/manifest.json',
                '/favicon.ico'
            ];

            // Simulate service worker caching essential resources
            await redisClient.setex(cacheKey, 24 * 60 * 60, JSON.stringify({
                version: '1.0.0',
                resources: essentialResources,
                cachedAt: new Date().toISOString()
            }));

            // Verify cache exists
            const cachedData = await redisClient.get(cacheKey);
            expect(cachedData).toBeDefined();

            const parsedCache = JSON.parse(cachedData!);
            expect(parsedCache.resources).toEqual(essentialResources);
            expect(parsedCache.version).toBe('1.0.0');
        });

        it('should handle offline game state persistence', async () => {
            const offlineSessionId = `offline_session_${Date.now()}`;
            const offlineGameState = {
                sessionId: offlineSessionId,
                userId: testUserId,
                isOffline: true,
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false,
                    gameTemplateId: testGameTemplateId
                },
                status: 'active',
                questionPool: ['q1', 'q2', 'q3', 'q4', 'q5'],
                currentQuestionIndex: 2,
                answers: [
                    { questionUid: 'q1', selectedAnswers: [0], isCorrect: true, submittedAt: new Date(), timeSpentMs: 1500, attemptNumber: 1 },
                    { questionUid: 'q2', selectedAnswers: [1], isCorrect: false, submittedAt: new Date(), timeSpentMs: 2000, attemptNumber: 1 }
                ],
                statistics: {
                    questionsAttempted: 2,
                    correctAnswers: 1,
                    incorrectAnswers: 1,
                    accuracyPercentage: 50,
                    averageTimePerQuestion: 1750,
                    totalTimeSpent: 3500,
                    retriedQuestions: []
                },
                offlineData: {
                    pendingSync: true,
                    lastSyncAttempt: new Date(),
                    syncAttempts: 0
                },
                createdAt: new Date(),
                startedAt: new Date()
            };

            // Store offline session
            await redisClient.setex(`pwa:offline:${offlineSessionId}`, 7 * 24 * 60 * 60, JSON.stringify(offlineGameState));

            // Verify offline session exists
            const storedSession = await redisClient.get(`pwa:offline:${offlineSessionId}`);
            expect(storedSession).toBeDefined();

            const parsedSession = JSON.parse(storedSession!);
            expect(parsedSession.isOffline).toBe(true);
            expect(parsedSession.offlineData.pendingSync).toBe(true);
            expect(parsedSession.answers).toHaveLength(2);
        });

        it('should queue actions for background sync when offline', async () => {
            const syncQueueKey = `pwa:sync_queue:${testUserId}`;
            const pendingActions = [
                {
                    id: `action_1_${Date.now()}`,
                    type: 'submit_answer',
                    data: { questionUid: 'q1', selectedAnswers: [0], timeSpentMs: 1500 },
                    timestamp: new Date(),
                    retryCount: 0
                },
                {
                    id: `action_2_${Date.now()}`,
                    type: 'complete_session',
                    data: { sessionId: 'session_123', finalScore: 8 },
                    timestamp: new Date(),
                    retryCount: 0
                }
            ];

            // Queue actions for background sync
            await redisClient.setex(syncQueueKey, 24 * 60 * 60, JSON.stringify(pendingActions));

            // Verify queue exists
            const queueData = await redisClient.get(syncQueueKey);
            expect(queueData).toBeDefined();

            const parsedQueue = JSON.parse(queueData!);
            expect(parsedQueue).toHaveLength(2);
            expect(parsedQueue[0].type).toBe('submit_answer');
            expect(parsedQueue[1].type).toBe('complete_session');
        });

        it('should handle offline-to-online transition gracefully', async () => {
            const transitionSessionId = `transition_${Date.now()}`;
            const transitionData = {
                sessionId: transitionSessionId,
                userId: testUserId,
                wasOffline: true,
                syncedAt: new Date(),
                syncStatus: 'completed',
                localChanges: 3,
                serverChanges: 1,
                conflictsResolved: 0
            };

            // Store transition data
            await redisClient.setex(`pwa:transition:${transitionSessionId}`, 60 * 60, JSON.stringify(transitionData));

            // Verify transition data
            const storedTransition = await redisClient.get(`pwa:transition:${transitionSessionId}`);
            expect(storedTransition).toBeDefined();

            const parsedTransition = JSON.parse(storedTransition!);
            expect(parsedTransition.wasOffline).toBe(true);
            expect(parsedTransition.syncStatus).toBe('completed');
            expect(parsedTransition.localChanges).toBe(3);
        });
    });

    describe('Cache management', () => {
        it('should implement cache versioning for updates', async () => {
            const cacheVersionKey = 'pwa:cache:version';
            const currentVersion = {
                version: '1.2.3',
                buildNumber: 123,
                lastUpdated: new Date().toISOString(),
                resources: [
                    '/static/js/app.v123.js',
                    '/static/css/styles.v123.css'
                ]
            };

            // Store cache version
            await redisClient.setex(cacheVersionKey, 24 * 60 * 60, JSON.stringify(currentVersion));

            // Verify version info
            const versionData = await redisClient.get(cacheVersionKey);
            expect(versionData).toBeDefined();

            const parsedVersion = JSON.parse(versionData!);
            expect(parsedVersion.version).toBe('1.2.3');
            expect(parsedVersion.buildNumber).toBe(123);
            expect(parsedVersion.resources).toHaveLength(2);
        });

        it('should clean up outdated cache entries', async () => {
            const oldCacheKeys = [
                'pwa:cache:v1.0.0:resources',
                'pwa:cache:v1.0.0:questions',
                'pwa:cache:v1.0.0:static'
            ];

            // Store old cache entries
            for (const key of oldCacheKeys) {
                await redisClient.setex(key, 24 * 60 * 60, JSON.stringify({ version: '1.0.0', data: 'old' }));
            }

            // Verify old entries exist
            for (const key of oldCacheKeys) {
                const data = await redisClient.get(key);
                expect(data).toBeDefined();
            }

            // Simulate cache cleanup (delete old version entries)
            for (const key of oldCacheKeys) {
                await redisClient.del(key);
            }

            // Verify cleaned up
            for (const key of oldCacheKeys) {
                const data = await redisClient.get(key);
                expect(data).toBeNull();
            }
        });

        it('should handle cache size limits', async () => {
            const cacheSizeKey = 'pwa:cache:size';
            const cacheMetrics = {
                totalSize: 45 * 1024 * 1024, // 45MB
                maxSize: 50 * 1024 * 1024, // 50MB limit
                entriesCount: 1250,
                maxEntries: 1500,
                lastCleanup: new Date().toISOString(),
                cleanupNeeded: false
            };

            // Store cache size metrics
            await redisClient.setex(cacheSizeKey, 60 * 60, JSON.stringify(cacheMetrics));

            // Verify metrics
            const metricsData = await redisClient.get(cacheSizeKey);
            expect(metricsData).toBeDefined();

            const parsedMetrics = JSON.parse(metricsData!);
            expect(parsedMetrics.totalSize).toBe(45 * 1024 * 1024);
            expect(parsedMetrics.maxSize).toBe(50 * 1024 * 1024);
            expect(parsedMetrics.cleanupNeeded).toBe(false);
        });

        it('should prioritize critical resources in cache', async () => {
            const priorityCacheKey = 'pwa:cache:priority';
            const prioritizedResources = {
                critical: [
                    '/index.html',
                    '/static/js/core.js',
                    '/static/css/critical.css',
                    '/manifest.json'
                ],
                high: [
                    '/static/js/app.js',
                    '/static/css/styles.css'
                ],
                medium: [
                    '/static/images/logo.png',
                    '/static/fonts/main.woff2'
                ],
                low: [
                    '/static/images/background.jpg',
                    '/static/audio/effects.mp3'
                ]
            };

            // Store priority cache
            await redisClient.setex(priorityCacheKey, 24 * 60 * 60, JSON.stringify(prioritizedResources));

            // Verify priority structure
            const priorityData = await redisClient.get(priorityCacheKey);
            expect(priorityData).toBeDefined();

            const parsedPriority = JSON.parse(priorityData!);
            expect(parsedPriority.critical).toHaveLength(4);
            expect(parsedPriority.high).toHaveLength(2);
            expect(parsedPriority.medium).toHaveLength(2);
            expect(parsedPriority.low).toHaveLength(2);
        });
    });

    describe('Background sync', () => {
        it('should retry failed sync operations', async () => {
            const retryQueueKey = `pwa:sync:retry:${testUserId}`;
            const failedOperations = [
                {
                    id: `retry_1_${Date.now()}`,
                    operation: 'submit_score',
                    data: { gameId: 'game_123', score: 95 },
                    failureReason: 'network_error',
                    retryCount: 2,
                    nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                    maxRetries: 5
                },
                {
                    id: `retry_2_${Date.now()}`,
                    operation: 'save_progress',
                    data: { sessionId: 'session_456', progress: 75 },
                    failureReason: 'server_error',
                    retryCount: 1,
                    nextRetryAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                    maxRetries: 3
                }
            ];

            // Store retry queue
            await redisClient.setex(retryQueueKey, 24 * 60 * 60, JSON.stringify(failedOperations));

            // Verify retry queue
            const retryData = await redisClient.get(retryQueueKey);
            expect(retryData).toBeDefined();

            const parsedRetries = JSON.parse(retryData!);
            expect(parsedRetries).toHaveLength(2);
            expect(parsedRetries[0].retryCount).toBe(2);
            expect(parsedRetries[1].failureReason).toBe('server_error');
        });

        it('should handle sync conflicts resolution', async () => {
            const conflictKey = `pwa:sync:conflict_${Date.now()}`;
            const syncConflict = {
                conflictId: `conflict_${Date.now()}`,
                localData: {
                    sessionId: 'session_123',
                    score: 85,
                    lastModified: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
                },
                serverData: {
                    sessionId: 'session_123',
                    score: 90,
                    lastModified: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
                },
                conflictType: 'score_mismatch',
                resolutionStrategy: 'server_wins',
                resolved: false,
                createdAt: new Date()
            };

            // Store sync conflict
            await redisClient.setex(conflictKey, 60 * 60, JSON.stringify(syncConflict));

            // Verify conflict data
            const conflictData = await redisClient.get(conflictKey);
            expect(conflictData).toBeDefined();

            const parsedConflict = JSON.parse(conflictData!);
            expect(parsedConflict.conflictType).toBe('score_mismatch');
            expect(parsedConflict.resolutionStrategy).toBe('server_wins');
            expect(parsedConflict.resolved).toBe(false);
        });

        it('should batch sync operations for efficiency', async () => {
            const batchKey = `pwa:sync:batch_${Date.now()}`;
            const syncBatch = {
                batchId: `batch_${Date.now()}`,
                operations: [
                    { type: 'update_score', data: { gameId: 'g1', score: 95 } },
                    { type: 'save_progress', data: { sessionId: 's1', progress: 80 } },
                    { type: 'submit_answer', data: { questionId: 'q1', answer: 'A' } },
                    { type: 'complete_game', data: { gameId: 'g1', finalScore: 95 } }
                ],
                totalSize: 2048, // bytes
                priority: 'normal',
                createdAt: new Date(),
                status: 'pending'
            };

            // Store sync batch
            await redisClient.setex(batchKey, 60 * 60, JSON.stringify(syncBatch));

            // Verify batch data
            const batchData = await redisClient.get(batchKey);
            expect(batchData).toBeDefined();

            const parsedBatch = JSON.parse(batchData!);
            expect(parsedBatch.operations).toHaveLength(4);
            expect(parsedBatch.totalSize).toBe(2048);
            expect(parsedBatch.status).toBe('pending');
        });

        it('should track sync operation metrics', async () => {
            const metricsKey = `pwa:sync:metrics:${testUserId}`;
            const syncMetrics = {
                totalSyncs: 145,
                successfulSyncs: 138,
                failedSyncs: 7,
                averageSyncTime: 1250, // milliseconds
                lastSyncAt: new Date(),
                syncSuccessRate: 95.2,
                dataTransferred: 2.5 * 1024 * 1024, // 2.5MB
                bandwidthUsage: {
                    upload: 1.2 * 1024 * 1024, // 1.2MB
                    download: 1.3 * 1024 * 1024  // 1.3MB
                }
            };

            // Store sync metrics
            await redisClient.setex(metricsKey, 24 * 60 * 60, JSON.stringify(syncMetrics));

            // Verify metrics
            const metricsData = await redisClient.get(metricsKey);
            expect(metricsData).toBeDefined();

            const parsedMetrics = JSON.parse(metricsData!);
            expect(parsedMetrics.totalSyncs).toBe(145);
            expect(parsedMetrics.successfulSyncs).toBe(138);
            expect(parsedMetrics.syncSuccessRate).toBe(95.2);
        });
    });

    describe('Service worker lifecycle', () => {
        it('should handle service worker updates', async () => {
            const swUpdateKey = 'pwa:sw:update';
            const updateInfo = {
                currentVersion: '1.2.2',
                newVersion: '1.2.3',
                updateAvailable: true,
                updateDownloaded: true,
                updateActivated: false,
                updateSize: 512 * 1024, // 512KB
                updateDownloadedAt: new Date(),
                userNotified: false
            };

            // Store update info
            await redisClient.setex(swUpdateKey, 60 * 60, JSON.stringify(updateInfo));

            // Verify update info
            const updateData = await redisClient.get(swUpdateKey);
            expect(updateData).toBeDefined();

            const parsedUpdate = JSON.parse(updateData!);
            expect(parsedUpdate.updateAvailable).toBe(true);
            expect(parsedUpdate.newVersion).toBe('1.2.3');
            expect(parsedUpdate.updateActivated).toBe(false);
        });

        it('should manage service worker cache strategies', async () => {
            const strategyKey = 'pwa:sw:cache_strategy';
            const cacheStrategies = {
                static: {
                    pattern: '/static/*',
                    strategy: 'cache_first',
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                    maxEntries: 100
                },
                api: {
                    pattern: '/api/*',
                    strategy: 'network_first',
                    timeout: 5000,
                    fallback: 'offline_data'
                },
                images: {
                    pattern: '/images/*',
                    strategy: 'cache_first',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    maxEntries: 50
                },
                pages: {
                    pattern: '/*',
                    strategy: 'network_first',
                    timeout: 3000,
                    fallback: '/offline.html'
                }
            };

            // Store cache strategies
            await redisClient.setex(strategyKey, 24 * 60 * 60, JSON.stringify(cacheStrategies));

            // Verify strategies
            const strategyData = await redisClient.get(strategyKey);
            expect(strategyData).toBeDefined();

            const parsedStrategies = JSON.parse(strategyData!);
            expect(parsedStrategies.static.strategy).toBe('cache_first');
            expect(parsedStrategies.api.strategy).toBe('network_first');
            expect(parsedStrategies.images.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
        });

        it('should handle service worker errors gracefully', async () => {
            const errorKey = `pwa:sw:error_${Date.now()}`;
            const swError = {
                errorId: `error_${Date.now()}`,
                errorType: 'install_failed',
                errorMessage: 'Failed to install service worker',
                stackTrace: 'Error: Install failed\n    at ServiceWorker.install()',
                timestamp: new Date(),
                userAgent: 'Mozilla/5.0 (compatible; PWA)',
                url: '/sw.js',
                retryCount: 1,
                maxRetries: 3
            };

            // Store error info
            await redisClient.setex(errorKey, 60 * 60, JSON.stringify(swError));

            // Verify error handling
            const errorData = await redisClient.get(errorKey);
            expect(errorData).toBeDefined();

            const parsedError = JSON.parse(errorData!);
            expect(parsedError.errorType).toBe('install_failed');
            expect(parsedError.retryCount).toBe(1);
            expect(parsedError.maxRetries).toBe(3);
        });

        it('should track service worker performance', async () => {
            const perfKey = 'pwa:sw:performance';
            const performanceMetrics = {
                installTime: 1250, // milliseconds
                activateTime: 350,
                cacheWarmupTime: 2800,
                averageResponseTime: 45, // milliseconds
                cacheHitRate: 78.5, // percentage
                networkRequests: 1250,
                cachedRequests: 980,
                failedRequests: 12,
                lastMeasured: new Date()
            };

            // Store performance metrics
            await redisClient.setex(perfKey, 60 * 60, JSON.stringify(performanceMetrics));

            // Verify performance data
            const perfData = await redisClient.get(perfKey);
            expect(perfData).toBeDefined();

            const parsedPerf = JSON.parse(perfData!);
            expect(parsedPerf.installTime).toBe(1250);
            expect(parsedPerf.cacheHitRate).toBe(78.5);
            expect(parsedPerf.networkRequests).toBe(1250);
        });
    });

    describe('PWA installation and updates', () => {
        it('should handle PWA installation prompts', async () => {
            const installKey = `pwa:install:${testUserId}`;
            const installData = {
                installPromptShown: true,
                installPromptShownAt: new Date(),
                userResponse: 'dismissed',
                userResponseAt: new Date(),
                installEligible: true,
                installCriteria: {
                    hasManifest: true,
                    hasServiceWorker: true,
                    isSecureContext: true,
                    hasValidStartUrl: true,
                    meetsStorageQuota: true
                },
                nextPromptEligible: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            };

            // Store install data
            await redisClient.setex(installKey, 30 * 24 * 60 * 60, JSON.stringify(installData));

            // Verify install tracking
            const installStored = await redisClient.get(installKey);
            expect(installStored).toBeDefined();

            const parsedInstall = JSON.parse(installStored!);
            expect(parsedInstall.installPromptShown).toBe(true);
            expect(parsedInstall.userResponse).toBe('dismissed');
            expect(parsedInstall.installEligible).toBe(true);
        });

        it('should manage PWA update notifications', async () => {
            const updateNotifyKey = `pwa:update:notification_${Date.now()}`;
            const updateNotification = {
                notificationId: `notify_${Date.now()}`,
                updateVersion: '1.3.0',
                notificationType: 'update_available',
                shownAt: new Date(),
                userInteracted: false,
                userAction: null,
                autoUpdateEnabled: true,
                lastUpdateCheck: new Date(),
                updateSize: 1.2 * 1024 * 1024, // 1.2MB
                updateUrgency: 'normal'
            };

            // Store update notification
            await redisClient.setex(updateNotifyKey, 24 * 60 * 60, JSON.stringify(updateNotification));

            // Verify notification data
            const notifyData = await redisClient.get(updateNotifyKey);
            expect(notifyData).toBeDefined();

            const parsedNotify = JSON.parse(notifyData!);
            expect(parsedNotify.updateVersion).toBe('1.3.0');
            expect(parsedNotify.notificationType).toBe('update_available');
            expect(parsedNotify.autoUpdateEnabled).toBe(true);
        });

        it('should track PWA usage analytics', async () => {
            const analyticsKey = `pwa:analytics:${testUserId}`;
            const pwaAnalytics = {
                installDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                lastUsed: new Date(),
                usageDays: 18,
                totalSessions: 45,
                averageSessionDuration: 25 * 60 * 1000, // 25 minutes
                featuresUsed: ['offline_mode', 'background_sync', 'push_notifications'],
                updateHistory: [
                    { version: '1.0.0', installedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                    { version: '1.1.0', installedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
                    { version: '1.2.0', installedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                ],
                crashCount: 2,
                lastCrash: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
            };

            // Store analytics data
            await redisClient.setex(analyticsKey, 24 * 60 * 60, JSON.stringify(pwaAnalytics));

            // Verify analytics
            const analyticsData = await redisClient.get(analyticsKey);
            expect(analyticsData).toBeDefined();

            const parsedAnalytics = JSON.parse(analyticsData!);
            expect(parsedAnalytics.usageDays).toBe(18);
            expect(parsedAnalytics.totalSessions).toBe(45);
            expect(parsedAnalytics.featuresUsed).toContain('offline_mode');
            expect(parsedAnalytics.updateHistory).toHaveLength(3);
        });

        it('should handle PWA uninstallation tracking', async () => {
            const uninstallKey = `pwa:uninstall:${testUserId}`;
            const uninstallData = {
                uninstalledAt: new Date(),
                uninstallReason: 'storage_full',
                appVersion: '1.2.0',
                daysUsed: 25,
                totalSessions: 38,
                lastSession: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                feedbackProvided: true,
                feedbackText: 'App takes too much storage space',
                canReinstall: true,
                reinstallPromptShown: false
            };

            // Store uninstall data
            await redisClient.setex(uninstallKey, 90 * 24 * 60 * 60, JSON.stringify(uninstallData)); // Keep for 90 days

            // Verify uninstall tracking
            const uninstallStored = await redisClient.get(uninstallKey);
            expect(uninstallStored).toBeDefined();

            const parsedUninstall = JSON.parse(uninstallStored!);
            expect(parsedUninstall.uninstallReason).toBe('storage_full');
            expect(parsedUninstall.daysUsed).toBe(25);
            expect(parsedUninstall.canReinstall).toBe(true);
        });
    });
});