/**
 * Timer Debug Logger Utility
 * 
 * Comprehensive logging utility for debugging timer issues
 */
import { createLogger } from '@/clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('TimerDebug');

export function logTimerEvent(event: string, data: any) {
    logger.info(`[TIMER_DEBUG] ${event}`, {
        timestamp: Date.now(),
        event,
        data,
        dataKeys: data ? Object.keys(data) : null
    });
}

export function logTimerState(context: string, state: any) {
    logger.info(`[TIMER_STATE_DEBUG] ${context}`, {
        timestamp: Date.now(),
        context,
        state,
        stateType: typeof state,
        isNull: state === null,
        isUndefined: state === undefined
    });
}

export function logTimerCalculation(context: string, calculation: any) {
    logger.info(`[TIMER_CALC_DEBUG] ${context}`, {
        timestamp: Date.now(),
        context,
        calculation
    });
}

export function logTimerError(context: string, error: any, data?: any) {
    logger.error(`[TIMER_ERROR_DEBUG] ${context}`, {
        timestamp: Date.now(),
        context,
        error,
        data
    });
}
