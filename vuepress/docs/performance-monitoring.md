---
title: Performance & Monitoring
description: Performance optimization strategies, monitoring endpoints, and caching mechanisms for MathQuest
---

# Performance & Monitoring Documentation

This document covers the performance optimization strategies, monitoring capabilities, and caching mechanisms implemented in MathQuest.

## Memory Optimization

### VPS Memory Constraints

MathQuest is optimized to run efficiently on low-cost VPS environments with limited memory:

```javascript
// PM2 ecosystem configuration for memory management
{
    name: "mathquest-backend",
    script: "npm",
    args: "run start:memory-limited",
    max_memory_restart: "400M",
    log_file: "./logs/pm2-backend.log"
},
{
    name: "mathquest-frontend",
    script: "npm",
    args: "run start:minimal",
    max_memory_restart: "300M",
    log_file: "./logs/pm2-frontend.log"
}
```

**Memory Limits:**
- **Backend**: 400MB maximum before automatic restart
- **Frontend**: 300MB maximum before automatic restart
- **Build Process**: 1GB limit for compilation
- **PWA Cache**: 2MB per file size limit

### Node.js Memory Configuration

```json
// Backend memory optimization scripts
{
  "start:memory-limited": "node --max-old-space-size=256 --max-semi-space-size=64 --max-new-space-size=32 -r dotenv/config dist/backend/src/server.js",
  "start:ultra-limited": "node --max-old-space-size=128 --max-semi-space-size=32 --max-new-space-size=16 -r dotenv/config dist/backend/src/server.js"
}

// Frontend memory optimization
{
  "start:minimal": "NODE_OPTIONS='--max-old-space-size=256 --max-semi-space-size=64' NEXT_TELEMETRY_DISABLED=1 next start -p 3008 --quiet",
  "start:quiet": "NODE_OPTIONS='--max-old-space-size=512 --max-semi-space-size=128' NEXT_TELEMETRY_DISABLED=1 next start -p 3008 --quiet"
}
```

## Redis Caching Strategy

### Connection Configuration

MathQuest uses Redis for high-performance caching and session management:

```typescript
// Redis client configuration
const redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null, // Keep trying to reconnect
    enableReadyCheck: false
});

// Connection event handling
redisClient.on('connect', () => {
    logger.info('Successfully connected to Redis.');
});

redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
});
```

### Caching Use Cases

**Session Management:**
```typescript
// User session storage in Redis
const sessionKey = `session:${userId}:${sessionId}`;
await redisClient.setex(sessionKey, 3600, JSON.stringify(sessionData));
```

**Game State Caching:**
```typescript
// Game timer state caching
const timerKey = `game:${gameId}:timer`;
await redisClient.setex(timerKey, 3600, JSON.stringify(timerState));

// Leaderboard caching
const leaderboardKey = `game:${gameId}:leaderboard`;
await redisClient.setex(leaderboardKey, 300, JSON.stringify(leaderboard));
```

**Real-time Data:**
- **Timer States**: Cached for 1 hour with automatic expiration
- **Participant Scores**: Cached for 5 minutes during active games
- **Game Metadata**: Cached for 30 minutes
- **User Sessions**: Cached for 1 hour with sliding expiration

### Socket.IO Redis Adapter

For horizontal scaling and real-time performance:

```typescript
// Redis adapter for Socket.IO clustering
const subClient = redisClient.duplicate();
io.adapter(createAdapter(redisClient, subClient));
```

**Benefits:**
- **Horizontal Scaling**: Support for multiple server instances
- **Message Broadcasting**: Efficient cross-server communication
- **Session Persistence**: Real-time state synchronization
- **Load Distribution**: Automatic connection distribution

## Performance Monitoring

### Health Check Endpoints

MathQuest provides comprehensive health monitoring:

```typescript
// Basic health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// Detailed memory monitoring
app.get('/health/memory', (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.status(200).json({
        status: 'OK',
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024), // MB
            rss: Math.round(memUsage.rss / 1024 / 1024) // MB
        },
        uptime: Math.round(uptime), // seconds
        timestamp: new Date().toISOString()
    });
});
```

**Monitoring Data:**
- **Heap Usage**: JavaScript heap memory consumption
- **External Memory**: C++ objects bound to JavaScript objects
- **RSS**: Resident Set Size (total memory allocated)
- **Uptime**: Server uptime in seconds
- **Timestamp**: Current server time

### PM2 Process Monitoring

```javascript
// PM2 ecosystem configuration with monitoring
{
    name: "mathquest-backend",
    max_memory_restart: "400M",
    log_file: "./logs/pm2-backend.log",
    out_file: "./logs/pm2-backend-out.log",
    error_file: "./logs/pm2-backend-error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    autorestart: true,
    watch: false
}
```

**Monitoring Features:**
- **Automatic Restart**: Memory threshold-based restarts
- **Log Management**: Structured logging with timestamps
- **Process Stats**: CPU, memory, and uptime tracking
- **Cluster Mode**: Multiple process instances for load balancing

### Application Logging

Comprehensive logging for performance monitoring:

```typescript
// Performance logging
logger.info('Game started', {
    gameId: game.id,
    participantCount: participants.length,
    timestamp: new Date().toISOString()
});

// Memory usage logging
setInterval(() => {
    const memUsage = process.memoryUsage();
    logger.info('Memory usage', {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        timestamp: new Date().toISOString()
    });
}, 300000); // Every 5 minutes
```

## Database Performance

### Prisma Query Optimization

MathQuest uses Prisma ORM with optimized query patterns:

```typescript
// Optimized user lookup with select
const user = await prisma.user.findUnique({
    where: { email: email },
    select: {
        id: true,
        email: true,
        password: true,
        role: true
    }
});

// Efficient game queries with relations
const game = await prisma.gameInstance.findFirst({
    where: {
        gameCode: gameCode,
        status: 'ACTIVE'
    },
    include: {
        participants: {
            select: {
                id: true,
                name: true,
                score: true
            }
        }
    }
});
```

**Optimization Techniques:**
- **Selective Queries**: Only fetch required fields
- **Relation Loading**: Efficient eager loading of related data
- **Connection Pooling**: Automatic connection management
- **Query Caching**: Database-level query result caching

### Connection Pooling

```typescript
// Prisma connection configuration
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn']
        : ['warn', 'error']
});
```

## Scoring Performance

### Optimized Scoring Algorithm

The scoring service implements performance-optimized calculations:

```typescript
// Efficient scoring calculation
export async function calculateAnswerScore(
    question: any,
    answer: any,
    serverTimeSpent: number,
    totalPresentationTime: number,
    accessCode?: string
): Promise<{ score: number, timePenalty: number }> {
    // Fast correctness check
    const isCorrect = checkAnswerCorrectness(question, answer);

    if (!isCorrect) return { score: 0, timePenalty: 0 };

    // Optimized time penalty calculation
    const timePenalty = calculateTimePenalty(serverTimeSpent, question.timeLimit);

    // Base score calculation
    const baseScore = question.points || 10;
    const finalScore = Math.max(0, baseScore - timePenalty);

    return { score: finalScore, timePenalty };
}
```

**Performance Features:**
- **Early Returns**: Fast rejection of incorrect answers
- **Cached Calculations**: Time penalty pre-computation
- **Memory Efficient**: Minimal object creation
- **Async Optimization**: Non-blocking database operations

## Real-time Performance

### Socket.IO Optimization

```typescript
// Optimized Socket.IO configuration
const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true
    },
    path: '/api/socket.io',
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,    // 30 seconds
    pingInterval: 25000    // 25 seconds
});
```

**Performance Optimizations:**
- **WebSocket Priority**: Preferred transport for lower latency
- **Connection Pooling**: Efficient connection management
- **Heartbeat Optimization**: Balanced ping/pong intervals
- **Room-based Isolation**: Targeted message delivery

### Event Handling Optimization

```typescript
// Efficient event broadcasting
io.to(gameRoom).emit('leaderboardUpdate', {
    leaderboard: cachedLeaderboard,
    timestamp: Date.now()
});

// Targeted participant updates
socket.to(participantId).emit('scoreUpdate', {
    score: newScore,
    totalScore: totalScore
});
```

## Build Performance

### Memory-Constrained Build Process

```bash
# Low-memory build configuration
NODE_OPTIONS="--max-old-space-size=1024 --max-semi-space-size=256" npm run build

# Parallel build optimization
npm run build:backend & npm run build:frontend & wait
```

**Build Optimizations:**
- **Memory Limits**: Controlled memory usage during compilation
- **Parallel Processing**: Concurrent backend and frontend builds
- **Dependency Optimization**: Minimal bundle sizes
- **Tree Shaking**: Removal of unused code

## Monitoring Dashboard

### Key Metrics to Monitor

**System Metrics:**
- **Memory Usage**: Heap, external, and RSS monitoring
- **CPU Usage**: Process and system CPU consumption
- **Disk I/O**: Database and log file operations
- **Network I/O**: Socket connections and API requests

**Application Metrics:**
- **Active Games**: Current number of running games
- **Connected Users**: Real-time user connections
- **Response Times**: API endpoint performance
- **Error Rates**: Application error frequency

**Database Metrics:**
- **Connection Pool**: Active and idle connections
- **Query Performance**: Slow query identification
- **Cache Hit Rates**: Redis cache effectiveness
- **Transaction Rates**: Database operation frequency

### Alert Configuration

**Memory Alerts:**
```javascript
// PM2 memory threshold alerts
max_memory_restart: "400M"  // Restart at 400MB usage
```

**Performance Alerts:**
- Response time > 2 seconds
- Error rate > 5%
- Memory usage > 80%
- Database connection pool exhausted

## Performance Testing

### Load Testing Strategy

```typescript
// Socket connection load test
describe('Socket.IO Performance', () => {
    it('should handle 1000 concurrent connections', async () => {
        // Load testing implementation
    });

    it('should maintain <100ms response time under load', async () => {
        // Performance benchmarking
    });
});
```

**Test Scenarios:**
- **Connection Scaling**: Maximum concurrent users
- **Message Broadcasting**: High-frequency event handling
- **Database Load**: Concurrent read/write operations
- **Memory Leak Detection**: Long-running stability tests

## Optimization Checklist

### Pre-Deployment Performance Review

- [ ] Memory limits configured for target environment
- [ ] Redis caching enabled and optimized
- [ ] Database connection pooling configured
- [ ] Socket.IO adapter properly configured
- [ ] PM2 monitoring and auto-restart enabled
- [ ] Build process optimized for memory constraints
- [ ] Logging configured for performance monitoring
- [ ] Health check endpoints accessible

### Ongoing Performance Maintenance

- [ ] Regular memory usage monitoring
- [ ] Database query performance analysis
- [ ] Cache hit rate optimization
- [ ] Socket connection monitoring
- [ ] Build time optimization
- [ ] Dependency updates for performance improvements
- [ ] Load testing after significant changes

## Troubleshooting Performance Issues

### Common Performance Problems

**Memory Issues:**
```bash
# Check memory usage
curl http://localhost:3007/health/memory

# Monitor PM2 processes
pm2 monit
```

**Database Performance:**
```sql
-- Identify slow queries
SELECT * FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '1 second';
```

**Redis Performance:**
```bash
# Check Redis memory usage
redis-cli info memory

# Monitor Redis operations
redis-cli monitor
```

**Socket.IO Performance:**
```javascript
// Monitor connection counts
io.engine.clientsCount

// Check room membership
io.sockets.adapter.rooms
```

This performance documentation should be regularly updated as new optimizations are implemented and monitoring capabilities are enhanced.</content>
<parameter name="filePath">/home/aflesch/mathquest/vuepress/docs/performance-monitoring.md