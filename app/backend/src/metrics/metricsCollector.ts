/**
 * Phase 5: Observability - Metrics Collection System
 * 
 * Simple in-memory metrics tracker for detecting abnormal patterns:
 * - Tracks events per minute (join_game, game_question, submit_answer)
 * - Provides alerts when thresholds are exceeded
 * - Gated by ENABLE_METRICS environment variable
 * - Dev/staging only - not intended for production load
 */

import createLogger from '@/utils/logger';

const logger = createLogger('MetricsCollector');

// Configuration
const METRICS_ENABLED = process.env.ENABLE_METRICS === 'true';
const WINDOW_SIZE_MS = 60000; // 1 minute rolling window
const MAX_BUCKETS = 10; // Keep last 10 minutes of data

// Alert thresholds (per minute)
const THRESHOLDS = {
    joinGame: 100,        // Alert if >100 joins/min
    gameQuestion: 200,    // Alert if >200 questions/min
    submitAnswer: 500,    // Alert if >500 answers/min
};

interface MetricBucket {
    timestamp: number;
    counts: {
        joinGame: number;
        gameQuestion: number;
        submitAnswer: number;
    };
}

interface MetricsSnapshot {
    enabled: boolean;
    currentMinute: {
        joinGame: number;
        gameQuestion: number;
        submitAnswer: number;
    };
    rates: {
        joinGamePerMin: number;
        gameQuestionPerMin: number;
        submitAnswerPerMin: number;
    };
    alerts: Array<{
        metric: string;
        rate: number;
        threshold: number;
        severity: 'warning' | 'critical';
    }>;
    timestamp: number;
}

class MetricsCollector {
    private buckets: MetricBucket[] = [];
    private currentBucket: MetricBucket;

    constructor() {
        this.currentBucket = this.createBucket();

        if (METRICS_ENABLED) {
            logger.info('Metrics collection enabled - starting 1-minute bucket rotation');
            // Rotate buckets every minute
            setInterval(() => this.rotateBucket(), WINDOW_SIZE_MS);
        } else {
            logger.debug('Metrics collection disabled - set ENABLE_METRICS=true to enable');
        }
    }

    private createBucket(): MetricBucket {
        return {
            timestamp: Date.now(),
            counts: {
                joinGame: 0,
                gameQuestion: 0,
                submitAnswer: 0,
            }
        };
    }

    private rotateBucket(): void {
        // Push current bucket to history
        this.buckets.push(this.currentBucket);

        // Keep only last MAX_BUCKETS
        if (this.buckets.length > MAX_BUCKETS) {
            this.buckets.shift();
        }

        // Create new bucket
        this.currentBucket = this.createBucket();

        logger.debug('Rotated metrics bucket', {
            bucketsInMemory: this.buckets.length,
            currentRates: this.getCurrentRates()
        });
    }

    /**
     * Record a join_game event
     */
    public recordJoinGame(): void {
        if (!METRICS_ENABLED) return;
        this.currentBucket.counts.joinGame++;
    }

    /**
     * Record a game_question event
     */
    public recordGameQuestion(): void {
        if (!METRICS_ENABLED) return;
        this.currentBucket.counts.gameQuestion++;
    }

    /**
     * Record a submit_answer event
     */
    public recordSubmitAnswer(): void {
        if (!METRICS_ENABLED) return;
        this.currentBucket.counts.submitAnswer++;
    }

    /**
     * Get current rates (events per minute)
     */
    private getCurrentRates(): { joinGamePerMin: number; gameQuestionPerMin: number; submitAnswerPerMin: number } {
        if (!METRICS_ENABLED || this.buckets.length === 0) {
            return {
                joinGamePerMin: this.currentBucket.counts.joinGame,
                gameQuestionPerMin: this.currentBucket.counts.gameQuestion,
                submitAnswerPerMin: this.currentBucket.counts.submitAnswer,
            };
        }

        // Average over last N buckets
        const recentBuckets = this.buckets.slice(-3); // Last 3 minutes
        const totalJoins = recentBuckets.reduce((sum, b) => sum + b.counts.joinGame, 0);
        const totalQuestions = recentBuckets.reduce((sum, b) => sum + b.counts.gameQuestion, 0);
        const totalAnswers = recentBuckets.reduce((sum, b) => sum + b.counts.submitAnswer, 0);

        return {
            joinGamePerMin: Math.round(totalJoins / recentBuckets.length),
            gameQuestionPerMin: Math.round(totalQuestions / recentBuckets.length),
            submitAnswerPerMin: Math.round(totalAnswers / recentBuckets.length),
        };
    }

    /**
     * Get current alerts based on thresholds
     */
    private getAlerts(): MetricsSnapshot['alerts'] {
        if (!METRICS_ENABLED) return [];

        const rates = this.getCurrentRates();
        const alerts: MetricsSnapshot['alerts'] = [];

        // Check join_game threshold
        if (rates.joinGamePerMin > THRESHOLDS.joinGame) {
            alerts.push({
                metric: 'join_game',
                rate: rates.joinGamePerMin,
                threshold: THRESHOLDS.joinGame,
                severity: rates.joinGamePerMin > THRESHOLDS.joinGame * 2 ? 'critical' : 'warning'
            });
        }

        // Check game_question threshold
        if (rates.gameQuestionPerMin > THRESHOLDS.gameQuestion) {
            alerts.push({
                metric: 'game_question',
                rate: rates.gameQuestionPerMin,
                threshold: THRESHOLDS.gameQuestion,
                severity: rates.gameQuestionPerMin > THRESHOLDS.gameQuestion * 2 ? 'critical' : 'warning'
            });
        }

        // Check submit_answer threshold
        if (rates.submitAnswerPerMin > THRESHOLDS.submitAnswer) {
            alerts.push({
                metric: 'submit_answer',
                rate: rates.submitAnswerPerMin,
                threshold: THRESHOLDS.submitAnswer,
                severity: rates.submitAnswerPerMin > THRESHOLDS.submitAnswer * 2 ? 'critical' : 'warning'
            });
        }

        return alerts;
    }

    /**
     * Get complete metrics snapshot for /metrics endpoint
     */
    public getSnapshot(): MetricsSnapshot {
        const rates = this.getCurrentRates();
        const alerts = this.getAlerts();

        return {
            enabled: METRICS_ENABLED,
            currentMinute: {
                joinGame: this.currentBucket.counts.joinGame,
                gameQuestion: this.currentBucket.counts.gameQuestion,
                submitAnswer: this.currentBucket.counts.submitAnswer,
            },
            rates,
            alerts,
            timestamp: Date.now()
        };
    }

    /**
     * Get historical data for the last N minutes
     */
    public getHistory(minutes: number = 10): MetricBucket[] {
        if (!METRICS_ENABLED) return [];

        const limit = Math.min(minutes, MAX_BUCKETS);
        return this.buckets.slice(-limit);
    }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

// Export types for use in metrics endpoint
export type { MetricsSnapshot, MetricBucket };
