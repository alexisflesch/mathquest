# Observability Runbooks

Phase 5 observability features provide tools for tracing requests and monitoring system health.

## Correlation ID Tracing

### Overview

Every client request generates a unique **correlation ID** that flows through the entire system, enabling end-to-end tracing.

**Format:** `{prefix}-{timestamp}-{random}`
- Example: `client-1730000000000-a1b2c3d4`
- Prefix: `client` (frontend) or `server` (backend)
- Timestamp: 13-digit Unix timestamp (milliseconds)
- Random: 8-character lowercase alphanumeric

### How to Trace a Session

#### 1. Find the Correlation ID

**In browser console logs:**
```
[10:23:45] [INFO] [useGameSocket] [CID:a1b2c3d4] Emitting join_game
```

**In backend logs:**
```
2025-10-27 10:23:45.123 info [JoinGameHandler] [CID:a1b2c3d4] Received join_game payload
```

The `[CID:xxxxxxxx]` marker shows the last 8 characters of the correlation ID.

#### 2. Search Logs for the Full Flow

```bash
# Search backend logs for a specific correlation ID
grep "a1b2c3d4" /path/to/backend/logs/combined.log

# Search frontend browser console
# Open DevTools → Console → Filter: "a1b2c3d4"
```

#### 3. Typical Flow Pattern

A complete join→question→answer flow will show:

```
[Frontend] [CID:a1b2c3d4] Emitting join_game
[Backend]  [CID:a1b2c3d4] Received join_game payload
[Backend]  [CID:a1b2c3d4] Looking up gameInstance
[Backend]  [CID:a1b2c3d4] Emitting game_joined
[Frontend] [CID:a1b2c3d4] Received game_joined
```

### Common Scenarios

#### Trace a Specific User's Issue

1. Ask user to open browser console
2. Have them perform the action (e.g., join game)
3. Look for `[CID:xxxxxxxx]` in their console logs
4. Search backend logs for matching correlation ID
5. Trace full request flow to find where it broke

#### Investigate "Stuck" Join Requests

```bash
# Find all join_game events in last hour
grep "join_game" logs/combined.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')"

# Look for correlation IDs without corresponding "game_joined"
# These indicate failed or stuck requests
```

## Metrics Monitoring

### Enable Metrics Collection

Set environment variable:
```bash
ENABLE_METRICS=true
```

**Note:** Only enable in dev/staging environments. Not intended for production load.

### Access Metrics Endpoint

**Current snapshot:**
```bash
curl http://localhost:3000/api/v1/metrics
```

**Response:**
```json
{
  "enabled": true,
  "currentMinute": {
    "joinGame": 45,
    "gameQuestion": 120,
    "submitAnswer": 380
  },
  "rates": {
    "joinGamePerMin": 42,
    "gameQuestionPerMin": 115,
    "submitAnswerPerMin": 365
  },
  "alerts": [
    {
      "metric": "submit_answer",
      "rate": 530,
      "threshold": 500,
      "severity": "warning"
    }
  ],
  "timestamp": 1730000000000
}
```

**Historical data:**
```bash
curl http://localhost:3000/api/v1/metrics/history?minutes=10
```

### Alert Thresholds

| Metric | Threshold (per minute) | Interpretation |
|--------|----------------------|----------------|
| `join_game` | 100 | >100 joins/min indicates potential spam or load test |
| `game_question` | 200 | >200 questions/min indicates rapid teacher question switching |
| `submit_answer` | 500 | >500 answers/min indicates high concurrent gameplay or storm |

**Severity Levels:**
- `warning`: Rate > threshold
- `critical`: Rate > threshold × 2

### Investigating Storm Events

A "storm" occurs when many users submit answers simultaneously, overwhelming the system.

#### 1. Check Metrics for Spikes

```bash
curl http://localhost:3000/api/v1/metrics | jq '.alerts'
```

If `submit_answer` shows critical alert, investigate:

#### 2. Find Affected Game

```bash
# Search for submit_answer events in last 5 minutes
grep "submit_answer" logs/combined.log | tail -100

# Look for accessCode patterns
grep -oP 'accessCode":"\\K[^"]+' logs/combined.log | sort | uniq -c | sort -nr
```

#### 3. Check Redis Queue Depth

```bash
# Connect to Redis
redis-cli

# Check pending answer queue (if implemented)
LLEN mathquest:queue:answers

# Check game participant counts
HLEN mathquest:game:participants:GAME123
```

#### 4. Correlate with Timer Events

Storm events often occur at timer expiration. Check:

```bash
# Find timer_expired events near storm timestamp
grep "timer_expired" logs/combined.log | grep "2025-10-27 10:23"
```

## Troubleshooting Guide

### Symptom: User Reports "Stuck on Loading"

**Steps:**
1. Get correlation ID from user's browser console
2. Search backend logs for that ID
3. Look for error responses or missing `game_joined` event
4. Common causes:
   - Invalid access code (check `game_error` emission)
   - Database timeout (check `gameInstance lookup` timing)
   - WebSocket disconnect (check connection handlers)

### Symptom: Leaderboard Not Updating

**Steps:**
1. Check if correlation IDs flow through `submit_answer`
2. Verify Redis score updates: `ZSCORE mathquest:game:leaderboard:GAME123 userId`
3. Check for idempotency guard blocks (duplicate submissions)
4. Verify `leaderboard_update` emission after score change

### Symptom: High Alert Rate on Metrics

**Steps:**
1. Check `/api/v1/metrics` for alert severity
2. If warning: Monitor, may be legitimate load
3. If critical: Investigate immediately
   - Check for infinite loops (same correlation ID repeating)
   - Check for spam/bot activity (rapid joins from same IP)
   - Check for teacher rapidly clicking buttons

## Best Practices

### For Developers

1. **Always include correlation IDs** in new socket event payloads
2. **Log correlation IDs** at key decision points (validation, database queries, emissions)
3. **Use structured logging** with metadata objects (not string concatenation)
4. **Preserve correlation IDs** across async boundaries

### For Operators

1. **Enable metrics in staging** to establish baseline rates
2. **Monitor alerts** for unusual patterns
3. **Keep logs** for at least 7 days for post-incident analysis
4. **Document incidents** with correlation ID examples for future reference

## Architecture Notes

### Correlation ID Lifecycle

```
┌─────────────┐
│   Client    │ Generates: client-timestamp-random
│  (Browser)  │
└──────┬──────┘
       │ WebSocket (join_game payload)
       ▼
┌─────────────┐
│   Backend   │ Extracts from payload
│  (Socket)   │ Logs with [CID:xxxxxxxx]
└──────┬──────┘
       │ Responses flow back with same ID
       ▼
┌─────────────┐
│   Client    │ Logs received events with [CID:xxxxxxxx]
│  (Browser)  │
└─────────────┘
```

### Metrics Collection

- **In-memory only** (no database writes)
- **1-minute buckets** (rolling window)
- **10-minute history** (last 10 buckets kept)
- **Automatic rotation** every 60 seconds
- **Gated by env var** (disabled by default)

### Why Not Production?

Current metrics implementation:
- ❌ No persistence (lost on restart)
- ❌ No aggregation across instances
- ❌ No historical analysis
- ❌ Limited alert capabilities

For production observability, integrate:
- Prometheus for metrics
- Grafana for visualization
- ELK/Loki for log aggregation
- Distributed tracing (Jaeger/Zipkin)
