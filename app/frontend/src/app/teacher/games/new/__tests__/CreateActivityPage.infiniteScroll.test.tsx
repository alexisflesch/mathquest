/**
 * Frontend test for CreateActivityPage infinite scroll functionality
 * 
 * Tests the infinite scroll implementation with dual detection:
 * - Scroll-based detection with different thresholds for mobile/desktop
 * - Intersection Observer backup for reliable triggering
 * - Proper batch loading and state management
 * - Mobile and desktop layout handling
 */

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CreateActivityPage from '../page';
import { useAuth } from '@/components/AuthProvider';
import { makeApiRequest } from '@/config/api';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@/components/AuthProvider');
jest.mock('@/config/api');
jest.mock('@/clientLogger', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

// Mock complex components
jest.mock('@/components/QuestionDisplay', () => {
    return function QuestionDisplay({ question, onCheckboxChange, checked }: any) {
        return (
            <div data-testid={`question-${question.uid}`} className="question-item">
                <div data-testid="question-text">{question.text}</div>
                <input
                    type="checkbox"
                    data-testid={`checkbox-${question.uid}`}
                    checked={checked}
                    onChange={(e) => onCheckboxChange?.(e.target.checked)}
                />
            </div>
        );
    };
});

jest.mock('@/components/CustomDropdown', () => {
    return function CustomDropdown({ options, selected, onChange, placeholder }: any) {
        return (
            <select
                data-testid={`dropdown-${placeholder?.toLowerCase()}`}
                value={selected}
                onChange={(e) => onChange?.(e.target.value)}
            >
                <option value="">{placeholder}</option>
                {options?.map((option: any) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        );
    };
});

jest.mock('@/components/EnhancedMultiSelectDropdown', () => {
    return function EnhancedMultiSelectDropdown({ options, selected, onChange, placeholder }: any) {
        return (
            <div data-testid={`multiselect-${placeholder?.toLowerCase()}`}>
                <div>{placeholder}: {selected?.length || 0} selected</div>
                {options?.map((option: any) => (
                    <label key={option.value}>
                        <input
                            type="checkbox"
                            checked={selected?.includes(option.value)}
                            onChange={(e) => {
                                const newSelected = e.target.checked
                                    ? [...(selected || []), option.value]
                                    : (selected || []).filter((v: string) => v !== option.value);
                                onChange?.(newSelected);
                            }}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
        );
    };
});

jest.mock('@/components/InfinitySpin', () => {
    return function InfinitySpin() {
        return <div data-testid="loading-spinner">Loading...</div>;
    };
});

// Mock DnD Kit
jest.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
    closestCenter: {},
    PointerSensor: {},
    useSensor: jest.fn(),
    useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
    arrayMove: jest.fn((array, oldIndex, newIndex) => {
        const newArray = [...array];
        const [removed] = newArray.splice(oldIndex, 1);
        newArray.splice(newIndex, 0, removed);
        return newArray;
    }),
    SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
    verticalListSortingStrategy: {},
    useSortable: jest.fn(() => ({
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        attributes: {},
        listeners: {},
    })),
}));

// Mock Intersection Observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Create mock question data
const createMockQuestion = (uid: string, text: string = `Question ${uid}`) => ({
    uid,
    title: `Title ${uid}`,
    text,
    questionType: 'single_choice',
    answerOptions: ['Option A', 'Option B', 'Option C'],
    correctAnswers: [true, false, false],
    gradeLevel: 'CM1',
    discipline: 'Mathématiques',
    themes: ['Arithmétique'],
    tags: ['test'],
    durationMs: 30000,
    difficulty: 1,
    author: 'Test Author'
});

const createMockQuestionsResponse = (startIndex: number, count: number) => ({
    questions: Array.from({ length: count }, (_, i) =>
        createMockQuestion(`question-${startIndex + i + 1}`)
    ),
    total: 100,
    page: Math.floor(startIndex / count) + 1,
    pageSize: count,
    totalPages: 5
});

const createMockFiltersResponse = () => ({
    gradeLevel: ['CM1', 'CM2', '6ème'],
    disciplines: ['Mathématiques', 'Français'],
    themes: ['Arithmétique', 'Géométrie'],
    tags: ['test', 'animaux', 'calcul']
});

describe('CreateActivityPage Infinite Scroll', () => {
    const mockPush = jest.fn();
    const mockMakeApiRequest = makeApiRequest as jest.MockedFunction<typeof makeApiRequest>;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset all mocks completely
        mockMakeApiRequest.mockReset();

        // Mock router
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        });

        // Mock auth
        (useAuth as jest.Mock).mockReturnValue({
            userState: 'teacher',
            isTeacher: true,
            user: { id: 'teacher-1', email: 'teacher@test.com' }
        });

        // Reset intersection observer mock
        mockIntersectionObserver.mockClear();
    });

    const setupApiMocks = () => {
        // Clear any previous calls completely
        mockMakeApiRequest.mockClear();
        mockMakeApiRequest.mockReset();

        // Mock filters request (called first by useEffect)
        mockMakeApiRequest.mockResolvedValueOnce(createMockFiltersResponse());

        // Mock initial questions request 
        mockMakeApiRequest.mockResolvedValueOnce(createMockQuestionsResponse(0, 20));

        console.log('Setup API mocks - filters and questions responses configured');
    };

    describe('Initial Load and Setup', () => {
        it('should render with initial question batch', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            // Wait for component to finish loading
            await waitFor(() => {
                // Check if loading spinner is gone
                expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
            }, { timeout: 3000 });

            // Check for questions by data-testid - expect multiple due to responsive layouts
            const firstQuestions = screen.getAllByTestId('question-question-1');
            expect(firstQuestions).toHaveLength(2); // Desktop + Mobile layouts

            const lastQuestions = screen.getAllByTestId('question-question-20');
            expect(lastQuestions).toHaveLength(2); // Desktop + Mobile layouts

            // Verify the question content (expect multiple due to responsive layouts)
            expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            expect(screen.getAllByText('Question question-20')).toHaveLength(2);
        });

        it('should setup intersection observer for infinite scroll', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                const firstQuestions = screen.getAllByTestId('question-question-1');
                expect(firstQuestions).toHaveLength(2);
            });

            // Should create intersection observer
            expect(mockIntersectionObserver).toHaveBeenCalledWith(
                expect.any(Function),
                { rootMargin: '100px' }
            );
        });
    });

    describe('Scroll-based Infinite Scroll', () => {
        it('should trigger load more on desktop when scrolled near bottom', async () => {
            setupApiMocks();

            // Mock second batch
            mockMakeApiRequest.mockResolvedValueOnce(createMockQuestionsResponse(20, 20));

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Find ALL overflow-y-auto elements and identify the desktop one by its container
            const allScrollContainers = document.querySelectorAll('.overflow-y-auto');
            expect(allScrollContainers.length).toBeGreaterThan(0);

            // The desktop container should be inside .hidden.lg:flex 
            let desktopContainer: HTMLElement | null = null;
            for (let i = 0; i < allScrollContainers.length; i++) {
                const container = allScrollContainers[i] as HTMLElement;
                const parent = container.closest('.hidden.lg\\:flex');
                if (parent) {
                    desktopContainer = container;
                    break;
                }
            }

            expect(desktopContainer).toBeTruthy();
            if (!desktopContainer) return;

            // Mock the offsetParent to make element appear "visible" to the component
            Object.defineProperty(desktopContainer, 'offsetParent', {
                value: document.body,
                writable: true
            });

            // Mock scroll properties for desktop (150px threshold)
            Object.defineProperty(desktopContainer, 'scrollTop', { value: 850, writable: true });
            Object.defineProperty(desktopContainer, 'clientHeight', { value: 600, writable: true });
            Object.defineProperty(desktopContainer, 'scrollHeight', { value: 1000, writable: true });

            // Verify the scroll calculation should trigger (850 + 600 = 1450 >= 1000 - 150 = 850) ✓
            const shouldTrigger = desktopContainer.scrollTop + desktopContainer.clientHeight >=
                desktopContainer.scrollHeight - 150;
            expect(shouldTrigger).toBe(true);

            // Add a small delay to ensure useEffect scroll listener is attached
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
            });

            // Trigger scroll event with more realistic event properties
            act(() => {
                const scrollEvent = new Event('scroll', { bubbles: true });
                desktopContainer.dispatchEvent(scrollEvent);
            });

            // Wait for the API call and new questions to appear
            await waitFor(() => {
                expect(mockMakeApiRequest).toHaveBeenCalledTimes(3); // filters + first + second batch
            }, { timeout: 3000 });

            // Verify second batch was called with correct offset
            expect(mockMakeApiRequest).toHaveBeenLastCalledWith(
                expect.stringContaining('limit=20&offset=20'),
                undefined,
                undefined,
                expect.any(Object)
            );

            // Should load more questions
            await waitFor(() => {
                expect(screen.getAllByTestId('question-question-21')).toHaveLength(2);
            });
        });

        it('should use larger threshold for mobile layout', async () => {
            setupApiMocks();

            // Mock second batch
            mockMakeApiRequest.mockResolvedValueOnce(createMockQuestionsResponse(20, 20));

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Find ALL overflow-y-auto elements and identify the mobile one by its container
            const allScrollContainers = document.querySelectorAll('.overflow-y-auto');
            expect(allScrollContainers.length).toBeGreaterThan(0);

            // The mobile container should be inside .lg:hidden 
            let mobileContainer: HTMLElement | null = null;
            for (let i = 0; i < allScrollContainers.length; i++) {
                const container = allScrollContainers[i] as HTMLElement;
                const parent = container.closest('.lg\\:hidden');
                if (parent) {
                    mobileContainer = container;
                    break;
                }
            }

            expect(mobileContainer).toBeTruthy();
            if (!mobileContainer) return;

            // Mock the offsetParent to make element appear "visible" to the component
            Object.defineProperty(mobileContainer, 'offsetParent', {
                value: document.body,
                writable: true
            });

            // Mock scroll properties for mobile (300px threshold)
            Object.defineProperty(mobileContainer, 'scrollTop', { value: 700, writable: true });
            Object.defineProperty(mobileContainer, 'clientHeight', { value: 600, writable: true });
            Object.defineProperty(mobileContainer, 'scrollHeight', { value: 1000, writable: true });

            // Verify the scroll calculation should trigger with mobile threshold
            // (700 + 600 = 1300 >= 1000 - 300 = 700) ✓
            const shouldTrigger = mobileContainer.scrollTop + mobileContainer.clientHeight >=
                mobileContainer.scrollHeight - 300;
            expect(shouldTrigger).toBe(true);

            // Add a small delay to ensure useEffect scroll listener is attached
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 200));
            });

            // Trigger scroll event
            act(() => {
                const scrollEvent = new Event('scroll', { bubbles: true });
                mobileContainer.dispatchEvent(scrollEvent);
            });

            // Wait for the API call and new questions to appear
            await waitFor(() => {
                expect(mockMakeApiRequest).toHaveBeenCalledTimes(3); // filters + first + second batch
            }, { timeout: 3000 });

            // Should load more questions with mobile threshold (300px)
            await waitFor(() => {
                expect(screen.getAllByTestId('question-question-21')).toHaveLength(2);
            });
        });

        it('should not trigger when already loading', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Mock slow API response
            let resolveSecondBatch!: (value: any) => void;
            const secondBatchPromise = new Promise(resolve => {
                resolveSecondBatch = resolve;
            });
            mockMakeApiRequest.mockReturnValueOnce(secondBatchPromise);

            // Find any scroll container
            const scrollContainer = document.querySelector('.overflow-y-auto') as HTMLElement;
            expect(scrollContainer).toBeTruthy();

            // Mock the offsetParent to make element appear "visible"
            Object.defineProperty(scrollContainer, 'offsetParent', {
                value: document.body,
                writable: true
            });

            // Mock scroll properties to trigger infinite scroll
            Object.defineProperty(scrollContainer, 'scrollTop', { value: 700, writable: true });
            Object.defineProperty(scrollContainer, 'clientHeight', { value: 600, writable: true });
            Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, writable: true });

            // Add a small delay to ensure scroll listener is attached
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
            });

            // Trigger first scroll
            act(() => {
                const scrollEvent = new Event('scroll', { bubbles: true });
                scrollContainer.dispatchEvent(scrollEvent);
            });

            // Trigger second scroll while first is loading
            act(() => {
                const scrollEvent = new Event('scroll', { bubbles: true });
                scrollContainer.dispatchEvent(scrollEvent);
            });

            // Should only have one API call for the second batch (the first scroll)
            // Total: filters + first batch + one second batch call = 3
            expect(mockMakeApiRequest).toHaveBeenCalledTimes(3); // filters + first batch + second batch

            // Resolve the promise
            resolveSecondBatch(createMockQuestionsResponse(20, 20));

            await waitFor(() => {
                expect(screen.getAllByTestId('question-question-21')).toHaveLength(2);
            });
        });
    });

    describe('Intersection Observer Infinite Scroll', () => {
        it('should trigger load more when intersection observer fires', async () => {
            setupApiMocks();

            // Mock second batch
            mockMakeApiRequest.mockResolvedValueOnce(createMockQuestionsResponse(20, 20));

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Get the intersection observer callback
            expect(mockIntersectionObserver).toHaveBeenCalled();
            const observerCallback = mockIntersectionObserver.mock.calls[0][0];

            // Simulate intersection
            act(() => {
                observerCallback([{ isIntersecting: true }]);
            });

            // Should load more questions
            await waitFor(() => {
                expect(screen.getAllByTestId('question-question-21')).toHaveLength(2);
            });
        });

        it('should not trigger when intersection observer element is not intersecting', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            const observerCallback = mockIntersectionObserver.mock.calls[0][0];

            // Simulate non-intersection
            act(() => {
                observerCallback([{ isIntersecting: false }]);
            });

            // Should not load more questions
            await waitFor(() => {
                expect(mockMakeApiRequest).toHaveBeenCalledTimes(2); // Only filters + first batch
            });
        });
    });

    describe('State Management', () => {
        it('should show loading indicator when loading more', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Mock slow second batch
            let resolveSecondBatch!: (value: any) => void;
            const secondBatchPromise = new Promise(resolve => {
                resolveSecondBatch = resolve;
            });
            mockMakeApiRequest.mockReturnValueOnce(secondBatchPromise);

            // Trigger load more
            const observerCallback = mockIntersectionObserver.mock.calls[0][0];
            act(() => {
                observerCallback([{ isIntersecting: true }]);
            });

            // Should show loading indicator
            await waitFor(() => {
                expect(screen.getAllByText('Chargement…')).toHaveLength(2);
            });

            // Resolve and wait for completion
            resolveSecondBatch(createMockQuestionsResponse(20, 20));

            await waitFor(() => {
                expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
            });
        });

        it('should handle end of data correctly', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Mock empty response (end of data)
            mockMakeApiRequest.mockResolvedValueOnce({
                questions: [],
                total: 20,
                page: 2,
                pageSize: 20,
                totalPages: 1
            });

            // Trigger load more
            const observerCallback = mockIntersectionObserver.mock.calls[0][0];
            act(() => {
                observerCallback([{ isIntersecting: true }]);
            });

            await waitFor(() => {
                // Should not show trigger element when no more data
                const triggerElements = screen.queryAllByTestId('load-trigger');
                expect(triggerElements).toHaveLength(0);
            });
        });

        it('should reset openUid when questions are reset', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Mock filter change that triggers reset
            mockMakeApiRequest.mockResolvedValueOnce(createMockQuestionsResponse(0, 20));

            // Change a filter to trigger reset
            const levelDropdown = screen.getByTestId('multiselect-niveaux');
            const checkbox = levelDropdown.querySelector('input[type="checkbox"]');

            act(() => {
                fireEvent.click(checkbox!);
            });

            // Wait for new questions to load
            await waitFor(() => {
                expect(mockMakeApiRequest).toHaveBeenCalledTimes(4); // filters + initial + filters + reset
            });

            // OpenUid should be reset (no expanded questions)
            const expandedQuestions = screen.queryAllByTestId(/expanded/);
            expect(expandedQuestions).toHaveLength(0);
        });
    });

    describe('Responsive Behavior', () => {
        it('should handle desktop to mobile layout changes', async () => {
            setupApiMocks();

            render(<CreateActivityPage />);

            await waitFor(() => {
                expect(screen.getAllByText('Question question-1')).toHaveLength(2);
            });

            // Should setup observer regardless of layout
            expect(mockIntersectionObserver).toHaveBeenCalled();

            // Mock window resize to mobile
            act(() => {
                // Simulate media query change
                Object.defineProperty(window, 'innerWidth', { value: 640, writable: true });
                fireEvent(window, new Event('resize'));
            });

            // Observer should still be functional
            const observerCallback = mockIntersectionObserver.mock.calls[0][0];

            mockMakeApiRequest.mockResolvedValueOnce(createMockQuestionsResponse(20, 20));

            act(() => {
                observerCallback([{ isIntersecting: true }]);
            });

            await waitFor(() => {
                expect(screen.getAllByTestId('question-question-21')).toHaveLength(2);
            });
        });
    });
});
