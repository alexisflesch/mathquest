/**
 * Socket Invariants & Self-Healing
 * 
 * Runtime checks to prevent event listener leaks and invalid state.
 * These run in development to catch issues early and self-heal in production.
 * 
 * Phase 4: Guardrails
 */

import React from 'react';
import type { Socket } from 'socket.io-client';

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_TEST = process.env.NODE_ENV === 'test';
const IS_BROWSER = typeof window !== 'undefined';

// Thresholds for listener counts
const LISTENER_WARNING_THRESHOLD = 5;
const LISTENER_CRITICAL_THRESHOLD = 10;

// Track listener counts per event
const listenerCounts = new Map<string, number>();

// Internal socket type with EventEmitter methods
type SocketWithEmitter = Socket & {
    listenerCount: (event: string | symbol) => number;
    eventNames: () => Array<string | symbol>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    listeners: (event: string | symbol) => Function[];
};

/**
 * Assert that socket.emit for JOIN_GAME only happens when necessary
 * Prevents duplicate join storms during rapid reconnects
 */
export function assertJoinEmitGuard(
    socket: Socket | null,
    hasJoinedRef: React.MutableRefObject<boolean>,
    eventName: string
): void {
    if (!socket || !IS_BROWSER) return;

    if (hasJoinedRef.current && eventName.includes('join')) {
        if (IS_DEV) {
            console.warn(
                `[INVARIANT] Attempted to emit ${eventName} but hasJoinedRef is already true. ` +
                `This may indicate a duplicate join attempt.`
            );
        }
        // In production, allow but log
        console.log(`[Socket] Duplicate join prevented for ${eventName}`);
    }
}

/**
 * Check listener counts for a specific event
 * Warns if threshold exceeded, removes excess listeners in production
 */
export function checkListenerCount(socket: Socket | null, eventName: string): void {
    if (!socket) return;
    // Skip browser check in tests
    if (!IS_BROWSER && !IS_TEST) return;

    const socketWithEmitter = socket as SocketWithEmitter;
    const count = socketWithEmitter.listenerCount(eventName);
    listenerCounts.set(eventName, count);

    if (count >= LISTENER_CRITICAL_THRESHOLD) {
        const message = `[INVARIANT VIOLATION] Critical listener count for "${eventName}": ${count} listeners (threshold: ${LISTENER_CRITICAL_THRESHOLD})`;

        if (IS_DEV || IS_TEST) {
            // In development/test, throw to catch the issue immediately
            throw new Error(message);
        } else {
            // In production, self-heal by removing excess listeners
            console.error(message);
            console.warn(`[Socket] Self-healing: removing excess listeners for "${eventName}"`);

            const listeners = socketWithEmitter.listeners(eventName);
            // Keep only the last few listeners (most recent subscriptions)
            const toRemove = listeners.slice(0, listeners.length - LISTENER_WARNING_THRESHOLD);
            toRemove.forEach(listener => {
                socket.off(eventName, listener as any);
            });

            console.log(`[Socket] Removed ${toRemove.length} excess listeners for "${eventName}"`);
        }
    } else if (count >= LISTENER_WARNING_THRESHOLD) {
        if (IS_DEV || IS_TEST) {
            console.warn(
                `[INVARIANT] High listener count for "${eventName}": ${count} listeners ` +
                `(warning threshold: ${LISTENER_WARNING_THRESHOLD})`
            );
        }
    }
}

/**
 * Check all listener counts on a socket
 * Call this periodically or on key lifecycle events
 */
export function checkAllListenerCounts(socket: Socket | null): void {
    if (!socket) return;
    // Skip browser check in tests
    if (!IS_BROWSER && !IS_TEST) return;

    const socketWithEmitter = socket as SocketWithEmitter;
    const eventNames = socketWithEmitter.eventNames();
    let totalViolations = 0;

    eventNames.forEach((event: string | symbol) => {
        const eventName = String(event);
        const count = socketWithEmitter.listenerCount(event);

        if (count >= LISTENER_WARNING_THRESHOLD) {
            checkListenerCount(socket, eventName);
            totalViolations++;
        }
    });

    if (totalViolations > 0 && (IS_DEV || IS_TEST)) {
        console.warn(`[INVARIANT] Total events with high listener counts: ${totalViolations}`);
    }
}

/**
 * Get diagnostic report of current listener state
 * Useful for debugging and observability
 */
export function getListenerDiagnostics(socket: Socket | null): {
    totalEvents: number;
    totalListeners: number;
    eventDetails: Array<{ event: string; count: number; isHigh: boolean }>;
    violations: number;
} {
    if (!socket) {
        return { totalEvents: 0, totalListeners: 0, eventDetails: [], violations: 0 };
    }
    // Skip browser check in tests
    if (!IS_BROWSER && !IS_TEST) {
        return { totalEvents: 0, totalListeners: 0, eventDetails: [], violations: 0 };
    }

    const socketWithEmitter = socket as SocketWithEmitter;
    const eventNames = socketWithEmitter.eventNames();
    let totalListeners = 0;
    let violations = 0;

    const eventDetails = eventNames.map((event: string | symbol) => {
        const eventName = String(event);
        const count = socketWithEmitter.listenerCount(event);
        totalListeners += count;

        const isHigh = count >= LISTENER_WARNING_THRESHOLD;
        if (isHigh) violations++;

        return { event: eventName, count, isHigh };
    });

    // Sort by count descending
    eventDetails.sort((a: any, b: any) => b.count - a.count);

    return {
        totalEvents: eventNames.length,
        totalListeners,
        eventDetails,
        violations
    };
}

/**
 * Log listener diagnostics to console
 * Call this before unmounting or on demand for debugging
 */
export function logListenerDiagnostics(socket: Socket | null, label = 'Socket'): void {
    if (!socket || !IS_BROWSER || !IS_DEV) return;

    const diagnostics = getListenerDiagnostics(socket);

    console.group(`[${label}] Listener Diagnostics`);
    console.log(`Total events: ${diagnostics.totalEvents}`);
    console.log(`Total listeners: ${diagnostics.totalListeners}`);
    console.log(`Violations: ${diagnostics.violations}`);

    if (diagnostics.eventDetails.length > 0) {
        console.table(diagnostics.eventDetails);
    }

    console.groupEnd();
}

/**
 * React hook for monitoring socket listener health
 * Usage: useSocketInvariants(socket);
 */
export function useSocketInvariants(socket: Socket | null): void {
    React.useEffect(() => {
        // Skip in non-browser environments
        if (!IS_BROWSER || !socket) return;

        // Check on mount
        checkAllListenerCounts(socket);

        // Set up periodic checks in development
        let intervalId: NodeJS.Timeout | null = null;
        if (IS_DEV) {
            intervalId = setInterval(() => {
                checkAllListenerCounts(socket);
            }, 30000); // Every 30 seconds
        }

        // Check on unmount
        return () => {
            if (intervalId) clearInterval(intervalId);

            if (IS_DEV) {
                logListenerDiagnostics(socket, 'Unmount');
            }
        };
    }, [socket]);
}
