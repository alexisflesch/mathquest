import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePracticeSession } from '../../hooks/usePracticeSession';

// Minimal settings shape for the hook
const settings: any = {
    discipline: 'Mathématiques',
    gradeLevel: 'L2',
    themes: ['Intégrales généralisées'],
    questionCount: 5,
    showImmediateFeedback: true,
    allowRetry: true,
    randomizeQuestions: false,
};

// Mock socket.io-client to control connect/emit
const emitMock = jest.fn();
const onHandlers: Record<string, Function[]> = {};
const onceHandlers: Record<string, Function[]> = {};

jest.mock('socket.io-client', () => ({
    io: jest.fn(() => ({
        connected: false,
        on: (event: string, cb: Function) => {
            onHandlers[event] = onHandlers[event] || [];
            onHandlers[event].push(cb);
        },
        once: (event: string, cb: Function) => {
            onceHandlers[event] = onceHandlers[event] || [];
            onceHandlers[event].push(cb);
        },
        emit: emitMock,
        disconnect: jest.fn(),
    })),
}));

function trigger(event: string, ...args: any[]) {
    (onHandlers[event] || []).forEach((cb) => cb(...args));
    (onceHandlers[event] || []).splice(0).forEach((cb) => cb(...args));
}

function TestHarness({ userId, autoStart = true }: { userId: string; autoStart?: boolean }) {
    usePracticeSession({ userId, settings, autoStart });
    return <div />;
}

describe('usePracticeSession – session recovery blocks auto-start', () => {
    beforeEach(() => {
        emitMock.mockClear();
        for (const k of Object.keys(onHandlers)) delete onHandlers[k];
        for (const k of Object.keys(onceHandlers)) delete onceHandlers[k];
        localStorage.clear();
    });

    it('does not emit START_PRACTICE_SESSION when a stored sessionId exists; emits GET_PRACTICE_SESSION_STATE instead', async () => {
        const userId = 'practice-user-1';
        const sessionStorageKey = `practice_session_${userId}`;
        localStorage.setItem(sessionStorageKey, 'sess-123');

        render(<TestHarness userId={userId} autoStart={true} />);

        await act(async () => {
            // Simulate socket connection
            trigger('connect');
        });

        // Expect recovery emit, not start
        const emits = emitMock.mock.calls.map(([event]) => event);
        expect(emits).toContain('GET_PRACTICE_SESSION_STATE');
        expect(emits).not.toContain('START_PRACTICE_SESSION');
    });
});
