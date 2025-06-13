# Socket Optimization Integration Guide

This guide explains how to integrate the new socket connection pool and optimization features into existing hooks and components.

## Features Overview

### 🔄 Connection Pool Management
- **Automatic connection reuse**: Prevents multiple connections to the same endpoint
- **Resource cleanup**: Automatic cleanup when connections are no longer needed
- **Configurable limits**: Set maximum number of concurrent connections

### ⚡ Performance Optimizations
- **Event debouncing**: Reduces spam from high-frequency events (mouse movements, timer updates)
- **Latency monitoring**: Track connection performance and response times
- **Reconnection strategies**: Intelligent reconnection with exponential backoff

### 🛡️ Error Handling
- **Error boundaries**: Comprehensive React error boundary system
- **Socket-specific errors**: Specialized handling for connection issues
- **Graceful fallbacks**: User-friendly error messages and recovery options

## Quick Integration

### 1. Basic Connection Pool Usage

Replace direct socket.io usage with the optimized connection pool:

```typescript
// ❌ Old way - direct socket creation
import { io } from 'socket.io-client';
const socket = io(SERVER_URL);

// ✅ New way - using connection pool
import { socketPool } from '@/utils/socketConnectionPool';
const optimizedSocket = socketPool.getConnection(SERVER_URL, {
    // socket.io options
}, 'unique-pool-key');
```

### 2. Event Debouncing

For high-frequency events (timer updates, mouse movements):

```typescript
// ✅ Enable debouncing for timer updates
optimizedSocket.emit('timer_update', timerData, { debounce: true });

// ✅ Regular emit for critical events
optimizedSocket.emit('game_answer', answerData); // No debouncing for answers
```

### 3. Enhanced Event Listeners

Use the optimized event listeners with automatic cleanup:

```typescript
useEffect(() => {
    // ✅ Enhanced listener with automatic cleanup
    const unsubscribe = optimizedSocket.on('timer_update', (data) => {
        setTimerData(data);
    });

    return unsubscribe; // Automatic cleanup
}, [optimizedSocket]);
```

### 4. Error Boundary Integration

Wrap socket-dependent components with error boundaries:

```typescript
import { SocketErrorBoundary, ErrorBoundary } from '@/components/ErrorBoundary';

// ✅ For socket-specific components
function GameComponent() {
    return (
        <SocketErrorBoundary>
            <StudentGameSocket />
        </SocketErrorBoundary>
    );
}

// ✅ For general components
function App() {
    return (
        <ErrorBoundary>
            <GameComponent />
        </ErrorBoundary>
    );
}
```

## Migration Guide

### Step 1: Update Socket Hook Creation

```typescript
// Before
function useGameSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    
    useEffect(() => {
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);
        
        return () => newSocket.disconnect();
    }, []);
}

// After
import { socketPool } from '@/utils/socketConnectionPool';

function useGameSocket() {
    const [optimizedSocket, setOptimizedSocket] = useState<OptimizedSocket | null>(null);
    
    useEffect(() => {
        const socket = socketPool.getConnection(SERVER_URL, {}, 'game-socket');
        setOptimizedSocket(socket);
        
        return () => {
            // Connection pool handles cleanup automatically
        };
    }, []);
}
```

### Step 2: Update Event Handlers

```typescript
// Before
useEffect(() => {
    if (!socket) return;
    
    const handleTimerUpdate = (data: TimerData) => {
        setTimerData(data);
    };
    
    socket.on('timer_update', handleTimerUpdate);
    
    return () => {
        socket.off('timer_update', handleTimerUpdate);
    };
}, [socket]);

// After
useEffect(() => {
    if (!optimizedSocket) return;
    
    // Enhanced listener with automatic cleanup and performance monitoring
    const unsubscribe = optimizedSocket.on('timer_update', (data: TimerData) => {
        setTimerData(data);
    });
    
    return unsubscribe;
}, [optimizedSocket]);
```

### Step 3: Update Event Emissions

```typescript
// Before
socket.emit('game_answer', answerData);

// After - with optional debouncing
optimizedSocket.emit('game_answer', answerData); // Critical events - no debouncing

// For high-frequency events
optimizedSocket.emit('mouse_movement', position, { debounce: true });
```

## Performance Monitoring

### Getting Metrics

```typescript
// Get metrics for a specific connection
const metrics = optimizedSocket.getMetrics();
console.log('Connection metrics:', metrics);

// Get global pool metrics
const globalMetrics = socketPool.getGlobalMetrics();
console.log('Pool metrics:', globalMetrics);
```

### Metrics Available

```typescript
interface PerformanceMetrics {
    connectionsCreated: number;      // Total connections created
    connectionsReused: number;       // Times connections were reused
    totalEvents: number;             // Total events processed
    debouncedEvents: number;         // Events that were debounced
    averageLatency: number;          // Average latency in ms
    reconnectionAttempts: number;    // Failed connection attempts
}
```

## Configuration Options

### Pool Configuration

```typescript
import { SocketConnectionPool } from '@/utils/socketConnectionPool';

const customPool = new SocketConnectionPool({
    maxConnections: 10,           // Max concurrent connections
    reconnectAttempts: 3,         // Max reconnection attempts
    reconnectDelay: 1000,         // Initial reconnection delay (ms)
    maxReconnectDelay: 10000,     // Max reconnection delay (ms)
    enableDebouncing: true,       // Enable event debouncing
    debounceInterval: 100,        // Debounce interval (ms)
    enablePerformanceMonitoring: true // Enable metrics tracking
});
```

## Best Practices

### ✅ Do's

1. **Use connection pool for all socket connections**
2. **Enable debouncing for high-frequency events** (timer updates, mouse movements)
3. **Wrap socket components with SocketErrorBoundary**
4. **Monitor performance metrics in development**
5. **Use automatic cleanup listeners**

### ❌ Don'ts

1. **Don't create direct socket.io connections** - use the pool
2. **Don't debounce critical events** (answers, game state changes)
3. **Don't forget error boundaries** for socket components
4. **Don't ignore performance metrics** - they help identify issues
5. **Don't manually manage socket cleanup** - let the pool handle it

## Error Handling Best Practices

### Socket-Specific Error Boundaries

```typescript
// ✅ Specialized error boundary for socket components
<SocketErrorBoundary>
    <GameSocketComponent />
</SocketErrorBoundary>

// ✅ Custom error handling
<ErrorBoundary 
    onError={(error, errorInfo) => {
        // Custom error reporting
        console.error('Socket error:', error);
    }}
    fallback={<CustomErrorUI />}
>
    <SocketComponent />
</ErrorBoundary>
```

### Connection Recovery

The socket pool automatically handles:
- Connection drops with exponential backoff
- Failed connection attempts
- Network instability
- Resource cleanup on errors

## Debugging

### Development Tools

```typescript
// Enable debug logging
localStorage.setItem('debug', 'socket:*');

// Check connection status
console.log('Active connections:', socketPool.getGlobalMetrics().activeConnections);

// Monitor specific connection
const socket = socketPool.getConnection(URL, {}, 'debug-key');
console.log('Socket metrics:', socket.getMetrics());
```

### Common Issues

1. **High reconnection attempts**: Check network stability
2. **Low connection reuse**: Ensure consistent pool keys
3. **High average latency**: Consider server performance
4. **Many debounced events**: Good - means optimization is working

## Integration Checklist

- [ ] Replace direct socket.io usage with connection pool
- [ ] Add error boundaries around socket components
- [ ] Enable debouncing for high-frequency events
- [ ] Update event listeners to use automatic cleanup
- [ ] Monitor performance metrics during development
- [ ] Test reconnection behavior with network interruptions
- [ ] Verify error handling with invalid connection attempts

This optimization system provides production-ready socket management with improved performance, reliability, and error handling.
