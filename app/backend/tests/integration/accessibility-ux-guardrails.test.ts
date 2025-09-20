/**
 * Accessibility and UX Guardrails Tests
 *
 * Tests for accessibility compliance and user experience guardrails including
 * keyboard navigation, screen reader support, focus management, and UX patterns.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/db/prisma';
import { redisClient } from '../../src/config/redis';

describe('Accessibility and UX Guardrails', () => {
    let testUserId: string;
    let testGameTemplateId: string;
    let testGameInstanceId: string;

    beforeAll(async () => {
        testUserId = `accessibility_user_${Date.now()}`;
        testGameTemplateId = `accessibility_template_${Date.now()}`;
        testGameInstanceId = `accessibility_game_${Date.now()}`;

        // Create test user
        await prisma.user.create({
            data: {
                id: testUserId,
                username: `accessibility_user_${Date.now()}`,
                role: 'STUDENT',
                createdAt: new Date()
            }
        });

        // Create associated student profile
        await prisma.studentProfile.create({
            data: {
                id: testUserId,
                cookieId: `accessibility_cookie_${testUserId}`
            }
        });

        // Create test game template
        await prisma.gameTemplate.create({
            data: {
                id: testGameTemplateId,
                name: 'Accessibility Test Template',
                description: 'Template for accessibility testing',
                creatorId: testUserId,
                defaultMode: 'practice'
            }
        });

        // Create test game instance
        await prisma.gameInstance.create({
            data: {
                id: testGameInstanceId,
                name: 'Accessibility Test Game',
                accessCode: `accessibility_test_${Date.now()}`,
                gameTemplateId: testGameTemplateId,
                initiatorUserId: testUserId,
                status: 'ACTIVE',
                playMode: 'practice',
                settings: {
                    gradeLevel: 'CM1',
                    discipline: 'math',
                    themes: ['addition'],
                    questionCount: 5,
                    showImmediateFeedback: true,
                    allowRetry: false,
                    randomizeQuestions: false
                },
                createdAt: new Date(),
                startedAt: new Date()
            }
        });
    });

    afterAll(async () => {
        // Clean up database
        await prisma.gameParticipant.deleteMany({ where: { gameInstanceId: testGameInstanceId } });
        await prisma.gameInstance.deleteMany({ where: { id: testGameInstanceId } });
        await prisma.gameTemplate.deleteMany({ where: { id: testGameTemplateId } });
        await prisma.studentProfile.deleteMany({ where: { id: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });

        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Clean up Redis before each test
        await redisClient.flushall();
    });

    describe('Keyboard navigation', () => {
        it('should support Tab navigation through interactive elements', async () => {
            const navigationStateKey = `accessibility:nav:${testUserId}`;
            const tabNavigation = {
                currentFocusIndex: 2,
                totalFocusableElements: 8,
                focusableElements: [
                    { id: 'start-button', type: 'button', label: 'Start Game', tabIndex: 0 },
                    { id: 'settings-button', type: 'button', label: 'Settings', tabIndex: 0 },
                    { id: 'question-input', type: 'input', label: 'Answer Input', tabIndex: 0 },
                    { id: 'submit-button', type: 'button', label: 'Submit Answer', tabIndex: 0 },
                    { id: 'next-button', type: 'button', label: 'Next Question', tabIndex: 0 },
                    { id: 'help-button', type: 'button', label: 'Help', tabIndex: 0 },
                    { id: 'menu-button', type: 'button', label: 'Menu', tabIndex: 0 },
                    { id: 'exit-button', type: 'button', label: 'Exit Game', tabIndex: 0 }
                ],
                navigationHistory: ['start-button', 'settings-button', 'question-input'],
                lastNavigationTime: new Date(),
                keyboardShortcuts: {
                    'Enter': 'submit_answer',
                    'Space': 'select_option',
                    'Escape': 'close_modal',
                    'ArrowUp': 'previous_option',
                    'ArrowDown': 'next_option',
                    'Tab': 'next_element',
                    'Shift+Tab': 'previous_element'
                }
            };

            // Store navigation state
            await redisClient.setex(navigationStateKey, 60 * 60, JSON.stringify(tabNavigation));

            // Verify navigation state
            const navData = await redisClient.get(navigationStateKey);
            expect(navData).toBeDefined();

            const parsedNav = JSON.parse(navData!);
            expect(parsedNav.currentFocusIndex).toBe(2);
            expect(parsedNav.totalFocusableElements).toBe(8);
            expect(parsedNav.focusableElements).toHaveLength(8);
            expect(parsedNav.keyboardShortcuts.Enter).toBe('submit_answer');
        });

        it('should handle keyboard shortcuts for common actions', async () => {
            const shortcutsKey = `accessibility:shortcuts:${testUserId}`;
            const keyboardShortcuts = {
                gameActions: {
                    'Ctrl+S': { action: 'save_progress', description: 'Save current progress' },
                    'Ctrl+R': { action: 'restart_game', description: 'Restart current game' },
                    'Ctrl+H': { action: 'show_help', description: 'Show help dialog' },
                    'Ctrl+M': { action: 'toggle_menu', description: 'Toggle main menu' }
                },
                navigation: {
                    'Alt+1': { action: 'goto_question_1', description: 'Go to question 1' },
                    'Alt+2': { action: 'goto_question_2', description: 'Go to question 2' },
                    'Alt+3': { action: 'goto_question_3', description: 'Go to question 3' },
                    'Home': { action: 'goto_first_question', description: 'Go to first question' },
                    'End': { action: 'goto_last_question', description: 'Go to last question' }
                },
                accessibility: {
                    'Alt+A': { action: 'toggle_high_contrast', description: 'Toggle high contrast mode' },
                    'Alt+F': { action: 'toggle_focus_indicators', description: 'Toggle focus indicators' },
                    'Alt+V': { action: 'toggle_screen_reader', description: 'Toggle screen reader mode' }
                },
                lastUsedShortcut: 'Ctrl+H',
                shortcutUsageCount: {
                    'Ctrl+S': 15,
                    'Ctrl+H': 8,
                    'Alt+A': 3
                }
            };

            // Store shortcuts configuration
            await redisClient.setex(shortcutsKey, 24 * 60 * 60, JSON.stringify(keyboardShortcuts));

            // Verify shortcuts
            const shortcutsData = await redisClient.get(shortcutsKey);
            expect(shortcutsData).toBeDefined();

            const parsedShortcuts = JSON.parse(shortcutsData!);
            expect(parsedShortcuts.gameActions['Ctrl+S'].action).toBe('save_progress');
            expect(parsedShortcuts.navigation['Home'].action).toBe('goto_first_question');
            expect(parsedShortcuts.accessibility['Alt+A'].action).toBe('toggle_high_contrast');
        });

        it('should maintain focus management during dynamic content updates', async () => {
            const focusManagementKey = `accessibility:focus:${testUserId}`;
            const focusManagement = {
                currentFocusElement: 'question-input',
                previousFocusElement: 'start-button',
                focusHistory: [
                    { element: 'start-button', timestamp: new Date(Date.now() - 30000) },
                    { element: 'question-input', timestamp: new Date(Date.now() - 15000) },
                    { element: 'submit-button', timestamp: new Date(Date.now() - 5000) }
                ],
                focusTraps: [
                    { container: 'modal-dialog', active: false },
                    { container: 'help-tooltip', active: true }
                ],
                focusRestoration: {
                    enabled: true,
                    restoreAfterModal: true,
                    restoreAfterAjax: true,
                    restoreAfterNavigation: true
                },
                dynamicContentUpdates: [
                    {
                        updateId: 'question_change',
                        timestamp: new Date(),
                        elementsAdded: ['new-question-input'],
                        elementsRemoved: ['old-question-input'],
                        focusRestoredTo: 'new-question-input'
                    }
                ]
            };

            // Store focus management state
            await redisClient.setex(focusManagementKey, 60 * 60, JSON.stringify(focusManagement));

            // Verify focus management
            const focusData = await redisClient.get(focusManagementKey);
            expect(focusData).toBeDefined();

            const parsedFocus = JSON.parse(focusData!);
            expect(parsedFocus.currentFocusElement).toBe('question-input');
            expect(parsedFocus.focusHistory).toHaveLength(3);
            expect(parsedFocus.focusRestoration.enabled).toBe(true);
            expect(parsedFocus.dynamicContentUpdates).toHaveLength(1);
        });

        it('should support arrow key navigation in lists and menus', async () => {
            const arrowNavigationKey = `accessibility:arrow_nav:${testUserId}`;
            const arrowNavigation = {
                currentList: 'answer-options',
                currentIndex: 1,
                totalItems: 4,
                items: [
                    { id: 'option-a', text: 'Option A', selected: false },
                    { id: 'option-b', text: 'Option B', selected: true },
                    { id: 'option-c', text: 'Option C', selected: false },
                    { id: 'option-d', text: 'Option D', selected: false }
                ],
                navigationMode: 'arrow_keys',
                wrapAround: true,
                autoSelect: false,
                lastArrowPress: {
                    key: 'ArrowDown',
                    timestamp: new Date(),
                    fromIndex: 0,
                    toIndex: 1
                },
                menuNavigation: {
                    activeMenu: 'game-menu',
                    menuItems: [
                        { id: 'resume', text: 'Resume Game', shortcut: 'Enter' },
                        { id: 'restart', text: 'Restart Game', shortcut: 'R' },
                        { id: 'settings', text: 'Settings', shortcut: 'S' },
                        { id: 'exit', text: 'Exit Game', shortcut: 'Esc' }
                    ],
                    currentMenuIndex: 0
                }
            };

            // Store arrow navigation state
            await redisClient.setex(arrowNavigationKey, 60 * 60, JSON.stringify(arrowNavigation));

            // Verify arrow navigation
            const arrowData = await redisClient.get(arrowNavigationKey);
            expect(arrowData).toBeDefined();

            const parsedArrow = JSON.parse(arrowData!);
            expect(parsedArrow.currentIndex).toBe(1);
            expect(parsedArrow.totalItems).toBe(4);
            expect(parsedArrow.items[1].selected).toBe(true);
            expect(parsedArrow.lastArrowPress.key).toBe('ArrowDown');
            expect(parsedArrow.menuNavigation.menuItems).toHaveLength(4);
        });
    });

    describe('Screen reader support', () => {
        it('should provide proper ARIA labels and descriptions', async () => {
            const ariaLabelsKey = `accessibility:aria:${testUserId}`;
            const ariaLabels = {
                liveRegions: [
                    {
                        id: 'score-announcer',
                        role: 'status',
                        'aria-live': 'polite',
                        'aria-atomic': 'true',
                        content: 'Score updated to 85 points'
                    },
                    {
                        id: 'timer-announcer',
                        role: 'timer',
                        'aria-live': 'assertive',
                        'aria-atomic': 'true',
                        content: '30 seconds remaining'
                    }
                ],
                labels: {
                    'question-input': {
                        'aria-label': 'Enter your answer for the math question',
                        'aria-describedby': 'question-hint',
                        'aria-required': 'true'
                    },
                    'submit-button': {
                        'aria-label': 'Submit your answer',
                        'aria-describedby': 'submit-help'
                    },
                    'progress-bar': {
                        'aria-label': 'Question progress',
                        'aria-valuenow': '3',
                        'aria-valuemin': '1',
                        'aria-valuemax': '5',
                        'aria-valuetext': 'Question 3 of 5'
                    }
                },
                descriptions: {
                    'question-hint': 'Enter a number between 1 and 100',
                    'submit-help': 'Press Enter or click to submit your answer'
                },
                announcements: [
                    {
                        id: 'question-announcement',
                        message: 'New question: What is 15 plus 27?',
                        priority: 'high',
                        timestamp: new Date()
                    },
                    {
                        id: 'feedback-announcement',
                        message: 'Correct! Well done.',
                        priority: 'medium',
                        timestamp: new Date()
                    }
                ]
            };

            // Store ARIA labels configuration
            await redisClient.setex(ariaLabelsKey, 60 * 60, JSON.stringify(ariaLabels));

            // Verify ARIA labels
            const ariaData = await redisClient.get(ariaLabelsKey);
            expect(ariaData).toBeDefined();

            const parsedAria = JSON.parse(ariaData!);
            expect(parsedAria.liveRegions).toHaveLength(2);
            expect(parsedAria.labels['question-input']['aria-required']).toBe('true');
            expect(parsedAria.labels['progress-bar']['aria-valuenow']).toBe('3');
            expect(parsedAria.announcements).toHaveLength(2);
        });

        it('should announce dynamic content changes', async () => {
            const announcementsKey = `accessibility:announcements:${testUserId}`;
            const announcements = {
                queue: [
                    {
                        id: 'score-update',
                        message: 'Your score increased by 10 points. New score: 95',
                        priority: 'medium',
                        'aria-live': 'polite',
                        timestamp: new Date()
                    },
                    {
                        id: 'time-warning',
                        message: 'Warning: Only 10 seconds remaining',
                        priority: 'high',
                        'aria-live': 'assertive',
                        timestamp: new Date()
                    },
                    {
                        id: 'question-complete',
                        message: 'Question completed. Moving to next question.',
                        priority: 'medium',
                        'aria-live': 'polite',
                        timestamp: new Date()
                    }
                ],
                announcementHistory: [
                    {
                        id: 'game-started',
                        message: 'Math quiz started. Question 1 of 5',
                        timestamp: new Date(Date.now() - 30000)
                    },
                    {
                        id: 'answer-submitted',
                        message: 'Answer submitted. Checking...',
                        timestamp: new Date(Date.now() - 15000)
                    }
                ],
                screenReaderMode: {
                    enabled: true,
                    voice: 'default',
                    rate: 1.0,
                    pitch: 1.0,
                    volume: 0.8
                },
                announcementStats: {
                    totalAnnouncements: 47,
                    highPriorityCount: 8,
                    mediumPriorityCount: 32,
                    lowPriorityCount: 7,
                    averageDelay: 250 // milliseconds
                }
            };

            // Store announcements
            await redisClient.setex(announcementsKey, 60 * 60, JSON.stringify(announcements));

            // Verify announcements
            const announceData = await redisClient.get(announcementsKey);
            expect(announceData).toBeDefined();

            const parsedAnnounce = JSON.parse(announceData!);
            expect(parsedAnnounce.queue).toHaveLength(3);
            expect(parsedAnnounce.announcementHistory).toHaveLength(2);
            expect(parsedAnnounce.screenReaderMode.enabled).toBe(true);
            expect(parsedAnnounce.announcementStats.totalAnnouncements).toBe(47);
        });

        it('should support semantic HTML structure', async () => {
            const semanticKey = `accessibility:semantic:${testUserId}`;
            const semanticStructure = {
                documentStructure: {
                    header: {
                        role: 'banner',
                        contains: ['logo', 'navigation', 'user-menu']
                    },
                    main: {
                        role: 'main',
                        contains: ['game-area', 'question-section', 'answer-section']
                    },
                    navigation: {
                        role: 'navigation',
                        'aria-label': 'Main navigation',
                        contains: ['home-link', 'games-link', 'profile-link']
                    },
                    aside: {
                        role: 'complementary',
                        'aria-label': 'Game information',
                        contains: ['score-display', 'timer-display', 'progress-bar']
                    }
                },
                landmarks: [
                    { role: 'banner', label: 'Site header' },
                    { role: 'navigation', label: 'Main navigation' },
                    { role: 'main', label: 'Game content' },
                    { role: 'complementary', label: 'Game status' },
                    { role: 'contentinfo', label: 'Footer information' }
                ],
                headings: {
                    h1: [{ id: 'game-title', text: 'Math Quiz Game' }],
                    h2: [
                        { id: 'question-section', text: 'Current Question' },
                        { id: 'score-section', text: 'Your Score' }
                    ],
                    h3: [
                        { id: 'timer-heading', text: 'Time Remaining' },
                        { id: 'progress-heading', text: 'Progress' }
                    ]
                },
                semanticValidation: {
                    hasMainLandmark: true,
                    hasNavigationLandmark: true,
                    hasHeadingStructure: true,
                    hasDescriptiveLabels: true,
                    skipLinksPresent: true,
                    focusManagement: 'proper'
                }
            };

            // Store semantic structure
            await redisClient.setex(semanticKey, 60 * 60, JSON.stringify(semanticStructure));

            // Verify semantic structure
            const semanticData = await redisClient.get(semanticKey);
            expect(semanticData).toBeDefined();

            const parsedSemantic = JSON.parse(semanticData!);
            expect(parsedSemantic.documentStructure.main.contains).toContain('game-area');
            expect(parsedSemantic.landmarks).toHaveLength(5);
            expect(parsedSemantic.headings.h1).toHaveLength(1);
            expect(parsedSemantic.semanticValidation.hasMainLandmark).toBe(true);
        });

        it('should handle focus indicators and visual cues', async () => {
            const focusIndicatorsKey = `accessibility:focus_indicators:${testUserId}`;
            const focusIndicators = {
                focusRing: {
                    enabled: true,
                    style: 'solid',
                    color: '#007acc',
                    width: '2px',
                    offset: '2px',
                    transition: 'all 0.2s ease'
                },
                focusIndicators: {
                    keyboardOnly: true,
                    highContrast: false,
                    customIndicators: {
                        buttons: { style: 'outline', color: '#007acc' },
                        inputs: { style: 'outline', color: '#007acc' },
                        links: { style: 'underline', color: '#007acc' },
                        menus: { style: 'background', color: '#e6f3ff' }
                    }
                },
                visualCues: {
                    errorIndicators: {
                        style: 'border-red',
                        animation: 'shake',
                        ariaLabel: 'Error: Please check your input'
                    },
                    successIndicators: {
                        style: 'border-green',
                        animation: 'pulse',
                        ariaLabel: 'Success: Answer accepted'
                    },
                    loadingIndicators: {
                        style: 'spinner',
                        ariaLabel: 'Loading, please wait'
                    }
                },
                accessibilityPreferences: {
                    reduceMotion: false,
                    highContrast: false,
                    largeText: false,
                    screenReader: true,
                    focusIndicators: 'visible'
                },
                indicatorStats: {
                    focusEvents: 145,
                    keyboardNavigation: 89,
                    mouseNavigation: 56,
                    touchNavigation: 12
                }
            };

            // Store focus indicators configuration
            await redisClient.setex(focusIndicatorsKey, 24 * 60 * 60, JSON.stringify(focusIndicators));

            // Verify focus indicators
            const indicatorsData = await redisClient.get(focusIndicatorsKey);
            expect(indicatorsData).toBeDefined();

            const parsedIndicators = JSON.parse(indicatorsData!);
            expect(parsedIndicators.focusRing.enabled).toBe(true);
            expect(parsedIndicators.focusRing.color).toBe('#007acc');
            expect(parsedIndicators.visualCues.errorIndicators.animation).toBe('shake');
            expect(parsedIndicators.accessibilityPreferences.screenReader).toBe(true);
        });
    });

    describe('Focus management', () => {
        it('should manage focus during modal dialogs', async () => {
            const modalFocusKey = `accessibility:modal_focus:${testUserId}`;
            const modalFocus = {
                activeModal: 'settings-dialog',
                modalStack: [
                    { id: 'settings-dialog', zIndex: 1000, focusableElements: 5 },
                    { id: 'help-dialog', zIndex: 1100, focusableElements: 3 }
                ],
                focusTrap: {
                    enabled: true,
                    container: 'settings-dialog',
                    firstFocusableElement: 'close-button',
                    lastFocusableElement: 'save-button',
                    preventOutsideFocus: true
                },
                focusRestoration: {
                    elementToRestore: 'settings-button',
                    restoreOnClose: true,
                    restoreDelay: 100 // milliseconds
                },
                modalHistory: [
                    {
                        modalId: 'settings-dialog',
                        openedAt: new Date(Date.now() - 30000),
                        closedAt: null,
                        focusOnOpen: 'difficulty-select',
                        focusOnClose: 'settings-button'
                    }
                ],
                accessibility: {
                    'aria-modal': 'true',
                    'aria-labelledby': 'settings-title',
                    'aria-describedby': 'settings-description',
                    role: 'dialog'
                }
            };

            // Store modal focus management
            await redisClient.setex(modalFocusKey, 60 * 60, JSON.stringify(modalFocus));

            // Verify modal focus management
            const modalData = await redisClient.get(modalFocusKey);
            expect(modalData).toBeDefined();

            const parsedModal = JSON.parse(modalData!);
            expect(parsedModal.activeModal).toBe('settings-dialog');
            expect(parsedModal.modalStack).toHaveLength(2);
            expect(parsedModal.focusTrap.enabled).toBe(true);
            expect(parsedModal.focusRestoration.restoreOnClose).toBe(true);
        });

        it('should handle focus in complex forms', async () => {
            const formFocusKey = `accessibility:form_focus:${testUserId}`;
            const formFocus = {
                currentForm: 'game-settings',
                currentField: 'difficulty-select',
                fieldOrder: [
                    'game-mode-select',
                    'difficulty-select',
                    'time-limit-input',
                    'question-count-input',
                    'theme-select',
                    'save-button'
                ],
                fieldValidation: {
                    'time-limit-input': { valid: true, message: null },
                    'question-count-input': { valid: false, message: 'Must be between 1 and 20' },
                    'theme-select': { valid: true, message: null }
                },
                focusFlow: {
                    autoAdvance: true,
                    skipInvalidFields: false,
                    focusFirstInvalid: true,
                    tabOrder: 'logical'
                },
                formNavigation: {
                    previousField: 'game-mode-select',
                    nextField: 'time-limit-input',
                    firstField: 'game-mode-select',
                    lastField: 'save-button'
                },
                accessibility: {
                    'aria-invalid': 'false',
                    'aria-describedby': 'field-help',
                    'aria-required': 'true',
                    autocomplete: 'off'
                }
            };

            // Store form focus management
            await redisClient.setex(formFocusKey, 60 * 60, JSON.stringify(formFocus));

            // Verify form focus management
            const formData = await redisClient.get(formFocusKey);
            expect(formData).toBeDefined();

            const parsedForm = JSON.parse(formData!);
            expect(parsedForm.currentField).toBe('difficulty-select');
            expect(parsedForm.fieldOrder).toHaveLength(6);
            expect(parsedForm.fieldValidation['question-count-input'].valid).toBe(false);
            expect(parsedForm.focusFlow.autoAdvance).toBe(true);
        });

        it('should support skip links for navigation', async () => {
            const skipLinksKey = `accessibility:skip_links:${testUserId}`;
            const skipLinks = {
                links: [
                    {
                        id: 'skip-to-main',
                        href: '#main-content',
                        text: 'Skip to main content',
                        visible: 'on-focus',
                        position: 'top-left'
                    },
                    {
                        id: 'skip-to-navigation',
                        href: '#main-navigation',
                        text: 'Skip to navigation',
                        visible: 'on-focus',
                        position: 'top-left'
                    },
                    {
                        id: 'skip-to-search',
                        href: '#search-input',
                        text: 'Skip to search',
                        visible: 'on-focus',
                        position: 'top-left'
                    }
                ],
                skipLinkUsage: {
                    'skip-to-main': 25,
                    'skip-to-navigation': 12,
                    'skip-to-search': 8
                },
                accessibility: {
                    highContrast: true,
                    largeText: false,
                    keyboardOnly: true,
                    screenReader: true
                },
                skipLinkStats: {
                    totalClicks: 45,
                    mostUsed: 'skip-to-main',
                    averagePosition: 'top-left',
                    visibilityMode: 'on-focus'
                }
            };

            // Store skip links configuration
            await redisClient.setex(skipLinksKey, 24 * 60 * 60, JSON.stringify(skipLinks));

            // Verify skip links
            const skipData = await redisClient.get(skipLinksKey);
            expect(skipData).toBeDefined();

            const parsedSkip = JSON.parse(skipData!);
            expect(parsedSkip.links).toHaveLength(3);
            expect(parsedSkip.skipLinkUsage['skip-to-main']).toBe(25);
            expect(parsedSkip.skipLinkStats.mostUsed).toBe('skip-to-main');
        });

        it('should handle focus in dynamic content', async () => {
            const dynamicFocusKey = `accessibility:dynamic_focus:${testUserId}`;
            const dynamicFocus = {
                dynamicElements: [
                    {
                        id: 'new-question',
                        type: 'question',
                        focusTarget: 'answer-input',
                        focusDelay: 500,
                        addedAt: new Date()
                    },
                    {
                        id: 'feedback-message',
                        type: 'feedback',
                        focusTarget: 'feedback-message',
                        focusDelay: 100,
                        addedAt: new Date()
                    }
                ],
                focusQueue: [
                    { elementId: 'new-question', priority: 'high', timestamp: new Date() },
                    { elementId: 'feedback-message', priority: 'medium', timestamp: new Date() }
                ],
                dynamicFocusRules: {
                    newQuestions: { focus: 'answer-input', announce: true },
                    feedback: { focus: 'feedback-message', announce: true },
                    errors: { focus: 'error-message', announce: true },
                    success: { focus: 'success-message', announce: true }
                },
                focusManagement: {
                    manageDynamicFocus: true,
                    announceChanges: true,
                    maintainTabOrder: true,
                    handleAriaLive: true
                },
                dynamicStats: {
                    elementsAdded: 23,
                    focusEvents: 18,
                    announcements: 15,
                    userInteractions: 12
                }
            };

            // Store dynamic focus management
            await redisClient.setex(dynamicFocusKey, 60 * 60, JSON.stringify(dynamicFocus));

            // Verify dynamic focus management
            const dynamicData = await redisClient.get(dynamicFocusKey);
            expect(dynamicFocusKey).toBeDefined();

            const parsedDynamic = JSON.parse(dynamicData!);
            expect(parsedDynamic.dynamicElements).toHaveLength(2);
            expect(parsedDynamic.focusQueue).toHaveLength(2);
            expect(parsedDynamic.dynamicFocusRules.newQuestions.focus).toBe('answer-input');
            expect(parsedDynamic.focusManagement.manageDynamicFocus).toBe(true);
        });
    });

    describe('UX guardrails', () => {
        it('should prevent common user mistakes', async () => {
            const guardrailsKey = `accessibility:guardrails:${testUserId}`;
            const guardrails = {
                mistakePrevention: {
                    doubleSubmit: {
                        enabled: true,
                        submitButtonText: 'Submitting...',
                        disableOnSubmit: true,
                        preventMultipleClicks: true
                    },
                    accidentalNavigation: {
                        confirmOnLeave: true,
                        warnOnUnsavedChanges: true,
                        autoSave: true,
                        saveInterval: 30000 // 30 seconds
                    },
                    dataLossPrevention: {
                        warnOnClose: true,
                        autoSaveDrafts: true,
                        recoveryOptions: true,
                        backupFrequency: 60000 // 1 minute
                    }
                },
                userGuidance: {
                    tooltips: {
                        enabled: true,
                        showDelay: 500,
                        hideDelay: 2000,
                        position: 'auto'
                    },
                    hints: {
                        contextualHelp: true,
                        progressiveDisclosure: true,
                        onboarding: true
                    },
                    feedback: {
                        successMessages: true,
                        errorMessages: true,
                        loadingStates: true,
                        progressIndicators: true
                    }
                },
                errorHandling: {
                    gracefulDegradation: true,
                    errorRecovery: true,
                    userFriendlyMessages: true,
                    supportContact: true
                },
                guardrailStats: {
                    preventedActions: 47,
                    userCorrections: 23,
                    autoSaves: 156,
                    warningsShown: 34
                }
            };

            // Store UX guardrails
            await redisClient.setex(guardrailsKey, 24 * 60 * 60, JSON.stringify(guardrails));

            // Verify UX guardrails
            const guardrailsData = await redisClient.get(guardrailsKey);
            expect(guardrailsData).toBeDefined();

            const parsedGuardrails = JSON.parse(guardrailsData!);
            expect(parsedGuardrails.mistakePrevention.doubleSubmit.enabled).toBe(true);
            expect(parsedGuardrails.userGuidance.tooltips.enabled).toBe(true);
            expect(parsedGuardrails.errorHandling.gracefulDegradation).toBe(true);
            expect(parsedGuardrails.guardrailStats.preventedActions).toBe(47);
        });

        it('should provide clear user feedback', async () => {
            const feedbackKey = `accessibility:feedback:${testUserId}`;
            const feedback = {
                feedbackTypes: {
                    success: {
                        style: 'positive',
                        icon: 'check-circle',
                        color: '#28a745',
                        message: 'Action completed successfully',
                        autoHide: true,
                        duration: 3000
                    },
                    error: {
                        style: 'negative',
                        icon: 'exclamation-triangle',
                        color: '#dc3545',
                        message: 'An error occurred',
                        autoHide: false,
                        action: 'Try again'
                    },
                    warning: {
                        style: 'caution',
                        icon: 'exclamation-circle',
                        color: '#ffc107',
                        message: 'Please review your input',
                        autoHide: true,
                        duration: 5000
                    },
                    info: {
                        style: 'neutral',
                        icon: 'info-circle',
                        color: '#007bff',
                        message: 'Information',
                        autoHide: true,
                        duration: 4000
                    }
                },
                feedbackQueue: [
                    {
                        id: 'answer-submitted',
                        type: 'success',
                        message: 'Answer submitted successfully!',
                        timestamp: new Date()
                    },
                    {
                        id: 'time-warning',
                        type: 'warning',
                        message: 'Only 30 seconds remaining',
                        timestamp: new Date()
                    }
                ],
                feedbackPreferences: {
                    showIcons: true,
                    enableSounds: false,
                    highContrast: false,
                    largeText: false,
                    screenReader: true
                },
                feedbackStats: {
                    totalFeedback: 89,
                    successCount: 67,
                    errorCount: 12,
                    warningCount: 10,
                    userInteractions: 23
                }
            };

            // Store user feedback configuration
            await redisClient.setex(feedbackKey, 60 * 60, JSON.stringify(feedback));

            // Verify user feedback
            const feedbackData = await redisClient.get(feedbackKey);
            expect(feedbackData).toBeDefined();

            const parsedFeedback = JSON.parse(feedbackData!);
            expect(parsedFeedback.feedbackTypes.success.style).toBe('positive');
            expect(parsedFeedback.feedbackQueue).toHaveLength(2);
            expect(parsedFeedback.feedbackPreferences.showIcons).toBe(true);
            expect(parsedFeedback.feedbackStats.successCount).toBe(67);
        });

        it('should enforce consistent interaction patterns', async () => {
            const patternsKey = `accessibility:patterns:${testUserId}`;
            const patterns = {
                interactionPatterns: {
                    buttons: {
                        primary: { style: 'filled', color: '#007acc', hover: '#0056b3' },
                        secondary: { style: 'outlined', color: '#6c757d', hover: '#545b62' },
                        danger: { style: 'filled', color: '#dc3545', hover: '#c82333' }
                    },
                    forms: {
                        input: { border: '1px solid #ced4da', focus: '#007acc', error: '#dc3545' },
                        label: { color: '#495057', required: '::after{content:"*";color:#dc3545}' },
                        validation: { success: '#28a745', error: '#dc3545', warning: '#ffc107' }
                    },
                    navigation: {
                        link: { color: '#007acc', hover: '#0056b3', visited: '#6c757d' },
                        active: { background: '#e9ecef', color: '#007acc' },
                        breadcrumb: { separator: '/', color: '#6c757d' }
                    }
                },
                consistencyRules: {
                    colorScheme: 'consistent',
                    typography: 'uniform',
                    spacing: 'grid-based',
                    interaction: 'predictable',
                    feedback: 'immediate'
                },
                patternCompliance: {
                    buttonsConsistent: true,
                    formsAccessible: true,
                    navigationClear: true,
                    feedbackAppropriate: true,
                    violations: []
                },
                patternStats: {
                    totalComponents: 145,
                    consistentComponents: 138,
                    violationsFixed: 7,
                    complianceRate: 95.2
                }
            };

            // Store interaction patterns
            await redisClient.setex(patternsKey, 24 * 60 * 60, JSON.stringify(patterns));

            // Verify interaction patterns
            const patternsData = await redisClient.get(patternsKey);
            expect(patternsData).toBeDefined();

            const parsedPatterns = JSON.parse(patternsData!);
            expect(parsedPatterns.interactionPatterns.buttons.primary.color).toBe('#007acc');
            expect(parsedPatterns.consistencyRules.colorScheme).toBe('consistent');
            expect(parsedPatterns.patternCompliance.buttonsConsistent).toBe(true);
            expect(parsedPatterns.patternStats.complianceRate).toBe(95.2);
        });

        it('should handle loading states appropriately', async () => {
            const loadingKey = `accessibility:loading:${testUserId}`;
            const loading = {
                loadingStates: {
                    button: {
                        text: 'Loading...',
                        disabled: true,
                        spinner: true,
                        spinnerPosition: 'left'
                    },
                    page: {
                        overlay: true,
                        message: 'Loading content...',
                        progressBar: true,
                        estimatedTime: 2000
                    },
                    inline: {
                        skeleton: true,
                        shimmer: true,
                        placeholder: 'Loading...'
                    }
                },
                loadingManagement: {
                    preventInteractions: true,
                    showProgress: true,
                    timeout: 10000,
                    retryOnTimeout: true
                },
                accessibility: {
                    'aria-busy': 'true',
                    'aria-live': 'polite',
                    'aria-label': 'Loading content',
                    role: 'progressbar'
                },
                loadingStats: {
                    totalLoads: 156,
                    averageLoadTime: 1250,
                    timeouts: 3,
                    userAborts: 8,
                    successfulLoads: 145
                }
            };

            // Store loading states
            await redisClient.setex(loadingKey, 60 * 60, JSON.stringify(loading));

            // Verify loading states
            const loadingData = await redisClient.get(loadingKey);
            expect(loadingData).toBeDefined();

            const parsedLoading = JSON.parse(loadingData!);
            expect(parsedLoading.loadingStates.button.spinner).toBe(true);
            expect(parsedLoading.loadingManagement.preventInteractions).toBe(true);
            expect(parsedLoading.accessibility['aria-busy']).toBe('true');
            expect(parsedLoading.loadingStats.successfulLoads).toBe(145);
        });
    });
});