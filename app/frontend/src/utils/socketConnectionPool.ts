/**
 * Socket Connection Pool and Optimization
 * 
 * Provides centralized socket connection management with:
 * - Connection pooling and reuse
 * - Automatic reconnection with exponential backoff
 * - Event debouncing for high-frequency events
 * - Performance monitoring
 */

import { io, Socket, ManagerOptions, SocketOptions } from 'socket.io-client';
import { createLogger } from '@/clientLogger';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

const logger = createLogger('SocketConnectionPool');

// Connection pool configuration
interface PoolConfig {
    maxConnections: number;
    reconnectAttempts: number;
    reconnectDelay: number;
    maxReconnectDelay: number;
    enableDebouncing: boolean;
    debounceInterval: number;
    enablePerformanceMonitoring: boolean;
}

// Default configuration
const DEFAULT_CONFIG: PoolConfig = {
    maxConnections: 5,
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    enableDebouncing: true,
    debounceInterval: 100,
    enablePerformanceMonitoring: true
};

// Performance metrics
interface PerformanceMetrics {
    connectionsCreated: number;
    connectionsReused: number;
    totalEvents: number;
    debouncedEvents: number;
    averageLatency: number;
    reconnectionAttempts: number;
}

// Debounced event tracker
interface DebouncedEvent {
    timeout: NodeJS.Timeout;
    lastData: any;
    count: number;
}

/**
 * Enhanced Socket Connection with optimization features
 */
export class OptimizedSocket {
    private socket: Socket;
    private config: PoolConfig;
    private debouncedEvents = new Map<string, DebouncedEvent>();
    private performanceMetrics: PerformanceMetrics = {
        connectionsCreated: 0,
        connectionsReused: 0,
        totalEvents: 0,
        debouncedEvents: 0,
        averageLatency: 0,
        reconnectionAttempts: 0
    };
    private latencyMeasurements: number[] = [];

    constructor(
        socket: Socket,
        config: Partial<PoolConfig> = {}
    ) {
        this.socket = socket;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.setupPerformanceMonitoring();
        this.setupReconnectionLogic();
    }

    /**
     * Enhanced emit with debouncing and performance monitoring
     */
    emit(eventName: string, data: any, options: { debounce?: boolean } = {}) {
        const startTime = performance.now();
        this.performanceMetrics.totalEvents++;

        if (options.debounce && this.config.enableDebouncing) {
            this.debouncedEmit(eventName, data);
        } else {
            this.socket.emit(eventName, data, () => {
                const latency = performance.now() - startTime;
                this.recordLatency(latency);
            });
        }
    }

    /**
     * Debounced emit to reduce high-frequency event spam
     */
    private debouncedEmit(eventName: string, data: any) {
        const existing = this.debouncedEvents.get(eventName);

        if (existing) {
            clearTimeout(existing.timeout);
            existing.lastData = data;
            existing.count++;
        } else {
            this.debouncedEvents.set(eventName, {
                timeout: setTimeout(() => {
                    const event = this.debouncedEvents.get(eventName);
                    if (event) {
                        this.socket.emit(eventName, event.lastData);
                        this.performanceMetrics.debouncedEvents += event.count;
                        this.debouncedEvents.delete(eventName);
                        logger.debug(`Debounced ${event.count} ${eventName} events`);
                    }
                }, this.config.debounceInterval),
                lastData: data,
                count: 1
            });
        }
    }

    /**
     * Enhanced on listener with automatic cleanup
     */
    on(eventName: string, handler: (...args: any[]) => void) {
        const wrappedHandler = (...args: any[]) => {
            const startTime = performance.now();
            handler(...args);
            const processingTime = performance.now() - startTime;
            this.recordLatency(processingTime);
        };

        this.socket.on(eventName, wrappedHandler);
        return () => this.socket.off(eventName, wrappedHandler);
    }

    /**
     * Get underlying socket instance
     */
    getSocket(): Socket {
        return this.socket;
    }

    /**
     * Get performance metrics
     */
    getMetrics(): PerformanceMetrics {
        return { ...this.performanceMetrics };
    }

    /**
     * Setup performance monitoring
     */
    private setupPerformanceMonitoring() {
        if (!this.config.enablePerformanceMonitoring) return;

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            logger.info('Socket connected', { id: this.socket.id });
        });

        this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            logger.warn('Socket disconnected', { reason, id: this.socket.id });
        });

        this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
            logger.error('Socket connection error', { error: error.message });
        });
    }

    /**
     * Setup reconnection logic with exponential backoff
     */
    private setupReconnectionLogic() {
        let reconnectAttempts = 0;
        let reconnectDelay = this.config.reconnectDelay;

        this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            if (reconnectAttempts < this.config.reconnectAttempts) {
                setTimeout(() => {
                    reconnectAttempts++;
                    this.performanceMetrics.reconnectionAttempts++;
                    logger.info(`Reconnection attempt ${reconnectAttempts}/${this.config.reconnectAttempts}`);

                    this.socket.connect();

                    // Exponential backoff
                    reconnectDelay = Math.min(reconnectDelay * 2, this.config.maxReconnectDelay);
                }, reconnectDelay);
            } else {
                logger.error('Max reconnection attempts reached');
            }
        });

        this.socket.on(SOCKET_EVENTS.CONNECT, () => {
            // Reset reconnection state on successful connection
            reconnectAttempts = 0;
            reconnectDelay = this.config.reconnectDelay;
        });
    }

    /**
     * Record latency measurement
     */
    private recordLatency(latency: number) {
        this.latencyMeasurements.push(latency);

        // Keep only last 100 measurements for averaging
        if (this.latencyMeasurements.length > 100) {
            this.latencyMeasurements.shift();
        }

        // Update average latency
        this.performanceMetrics.averageLatency =
            this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Clear all debounced events
        for (const [eventName, event] of this.debouncedEvents) {
            clearTimeout(event.timeout);
        }
        this.debouncedEvents.clear();

        // Disconnect socket
        this.socket.disconnect();

        logger.debug('Socket cleanup completed', this.performanceMetrics);
    }
}

/**
 * Socket Connection Pool Manager
 */
export class SocketConnectionPool {
    private connections = new Map<string, OptimizedSocket>();
    private config: PoolConfig;
    private globalMetrics: PerformanceMetrics = {
        connectionsCreated: 0,
        connectionsReused: 0,
        totalEvents: 0,
        debouncedEvents: 0,
        averageLatency: 0,
        reconnectionAttempts: 0
    };

    constructor(config: Partial<PoolConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Get or create optimized socket connection
     */
    getConnection(
        url: string,
        options: Partial<ManagerOptions & SocketOptions> = {},
        poolKey?: string
    ): OptimizedSocket {
        const key = poolKey || url;

        // Check if connection exists and is still connected
        const existing = this.connections.get(key);
        if (existing && existing.getSocket().connected) {
            this.globalMetrics.connectionsReused++;
            logger.debug(`Reusing socket connection for ${key}`);
            return existing;
        }

        // Create new connection
        if (this.connections.size >= this.config.maxConnections) {
            logger.warn(`Max connections (${this.config.maxConnections}) reached, cleaning up oldest`);
            this.cleanupOldestConnection();
        }

        const socket = io(url, {
            autoConnect: true,
            reconnection: false, // We handle reconnection ourselves
            ...options
        });

        const optimizedSocket = new OptimizedSocket(socket, this.config);
        this.connections.set(key, optimizedSocket);
        this.globalMetrics.connectionsCreated++;

        logger.info(`Created new socket connection for ${key}`, {
            totalConnections: this.connections.size,
            maxConnections: this.config.maxConnections
        });

        return optimizedSocket;
    }

    /**
     * Remove connection from pool
     */
    removeConnection(key: string) {
        const connection = this.connections.get(key);
        if (connection) {
            connection.cleanup();
            this.connections.delete(key);
            logger.debug(`Removed connection ${key} from pool`);
        }
    }

    /**
     * Get aggregated performance metrics
     */
    getGlobalMetrics(): PerformanceMetrics & { activeConnections: number } {
        // Aggregate metrics from all connections
        const aggregated = { ...this.globalMetrics };
        let totalLatency = 0;
        let connectionCount = 0;

        for (const connection of this.connections.values()) {
            const metrics = connection.getMetrics();
            aggregated.totalEvents += metrics.totalEvents;
            aggregated.debouncedEvents += metrics.debouncedEvents;
            aggregated.reconnectionAttempts += metrics.reconnectionAttempts;

            if (metrics.averageLatency > 0) {
                totalLatency += metrics.averageLatency;
                connectionCount++;
            }
        }

        // Calculate global average latency
        aggregated.averageLatency = connectionCount > 0 ? totalLatency / connectionCount : 0;

        return {
            ...aggregated,
            activeConnections: this.connections.size
        };
    }

    /**
     * Cleanup oldest connection when pool is full
     */
    private cleanupOldestConnection() {
        const [oldestKey] = this.connections.keys();
        if (oldestKey) {
            this.removeConnection(oldestKey);
        }
    }

    /**
     * Cleanup all connections
     */
    cleanup() {
        for (const [key, connection] of this.connections) {
            connection.cleanup();
        }
        this.connections.clear();
        logger.info('Socket connection pool cleanup completed');
    }
}

// Global socket pool instance
export const socketPool = new SocketConnectionPool();

// Cleanup on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        socketPool.cleanup();
    });
}
