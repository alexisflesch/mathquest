# Backend Event Handler Audit Report
Generated: 2025-06-16T20:53:19.120356

## [2025-06-23] DRY Refactor: Answer Handler Receives Timer/Session Context
- Architectural improvement: The answer handler (`gameAnswerHandler`) no longer contains any logic to select between live/global or deferred/per-user timers.
- The handler now receives the timer, game state, participant, and gameInstance as arguments (context object).
- All timer/session selection logic is performed at the call site (socket event registration or wrapper), ensuring single-responsibility and DRY code.
- This eliminates all mode/status-based branching from the answer handler, enforcing canonical timer usage and modern best practices.
- See `plan.md` for updated checklist and testing steps.

## [2025-06-23] Enforce Timer/Session Logic by Game Status in gameAnswerHandler
- Root Cause: Timer/session selection was ambiguous when both LIVE and DEFERRED sessions existed for a user. The handler could use the wrong timer/session, causing 'timer expired' errors in deferred mode after live play.
- Solution: At the timer/session selection point, always check `gameState.status`. If 'active', use live/global session/timer. If not, use deferred/per-user session/timer. This guarantees correct logic for all users and modes.
- Logging: Added explicit logs to confirm which logic path is used for each answer submission.
- See `plan.md` for updated checklist and testing steps.

## [2025-06-23] Deferred Tournament Timer Modernization
- Replaced all direct Redis timer set/get in `runDeferredQuestionSequence` (deferredTournamentFlow.ts) with CanonicalTimerService.
- All timer operations now use canonical key format for deferred tournaments.
- Removed custom timer key logic and related logs.
- Updated logs to reflect canonical service usage.
- See `plan.md` for checklist and testing steps.

## [2025-06-23] Deferred Tournament Timer Modernization (cont'd)
- Fixed bug where per-user timer was not reset between questions/attempts in deferred mode, causing time to accumulate and excessive penalties.
- Now explicitly resets the timer before starting it for each question in deferredTournamentFlow.ts.
- See plan.md for updated checklist and testing steps.

## [2025-06-23] Defensive Participant Row Creation in Answer Submission
- Problem: Submitting an answer via live/[code] or deferred mode could fail if the participant row was not created (e.g., user never joined via join endpoint).
- Solution: In the GAME_ANSWER handler, if the participant row is missing, the system now calls the modular join service to create it before proceeding. This guarantees that a participant row always exists for answer submissions in all modes.
- Impact: No more 'Participant not found' errors on answer submission. All join and answer flows are robust and DRY.
- See `plan.md` for updated checklist and testing steps.

## 📊 Summary
- Total handler registrations found: 151
- Unique events: 91
- **Duplicate registrations: 22**

## 🚨 CRITICAL: Duplicate Event Handler Registrations

### Event: `request_participants` (2 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/sharedLiveHandler.ts`
- Line: 483
- Function: `async (payload: any`
- Context:
```typescript
    };

    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = requestParticipantsPayloadSchema.safeParse(payload);
```

**Handler 2:**
- File: `backend/src/sockets/handlers/game/index.ts`
- Line: 20
- Function: `requestParticipantsHandler(io, socket`
- Context:
```typescript
    socket.on(GAME_EVENTS.JOIN_GAME, joinGameHandler(io, socket));
    socket.on(GAME_EVENTS.GAME_ANSWER, gameAnswerHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, requestParticipantsHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_NEXT_QUESTION, requestNextQuestionHandler(io, socket));
    socket.on('disconnect', disconnectHandler(io, socket));
```

### Event: `join_game` (3 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/sharedLiveHandler.ts`
- Line: 509
- Function: `(payload: any`
- Context:
```typescript
    });

    socket.on(GAME_EVENTS.JOIN_GAME, (payload: any) => joinHandler(payload));
    socket.on(TOURNAMENT_EVENTS.JOIN_TOURNAMENT, (payload: any) => joinHandler({ ...payload, playMode: 'tournament' }));

```

**Handler 2:**
- File: `backend/src/sockets/handlers/game/index.ts`
- Line: 18
- Function: `joinGameHandler(io, socket`
- Context:
```typescript

    // Register direct handlers on socket instance using shared constants
    socket.on(GAME_EVENTS.JOIN_GAME, joinGameHandler(io, socket));
    socket.on(GAME_EVENTS.GAME_ANSWER, gameAnswerHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, requestParticipantsHandler(io, socket));
```

**Handler 3:**
- File: `backend-backup/sockets/gameEvents.ts`
- Line: 46
- Function: `(payload: JoinGamePayload`
- Context:
```typescript
    });

    socket.on("join_game", (payload: JoinGamePayload) => {
        logger.debug(`[join_game] Received from socket ${socket.id}`);
        handleJoinGame(io, socket, payload);
```

### Event: `game_answer` (5 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/sharedLiveHandler.ts`
- Line: 514
- Function: `...`
- Context:
```typescript
    // NOTE: game_answer is now handled exclusively by gameAnswer.ts (registered in game/index.ts)
    // This eliminates the dual handler registration issue that was causing inconsistent validation
    // socket.on(GAME_EVENTS.GAME_ANSWER, ...) - REMOVED to prevent duplicate processing

    socket.on(TOURNAMENT_EVENTS.TOURNAMENT_ANSWER, (payload: any) => answerHandler({ ...payload, playMode: 'tournament' }));
```

**Handler 2:**
- File: `backend/src/sockets/handlers/game/gameAnswer.ts`
- Line: 366
- Function: `handler`
- Context:
```typescript
    // Handle the next_question event for practice mode
    // Add the handler to the socket
    socket.on('game_answer', handler);

    return handler;
```

**Handler 3:**
- File: `backend/src/sockets/handlers/game/index.ts`
- Line: 19
- Function: `gameAnswerHandler(io, socket`
- Context:
```typescript
    // Register direct handlers on socket instance using shared constants
    socket.on(GAME_EVENTS.JOIN_GAME, joinGameHandler(io, socket));
    socket.on(GAME_EVENTS.GAME_ANSWER, gameAnswerHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, requestParticipantsHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_NEXT_QUESTION, requestNextQuestionHandler(io, socket));
```

**Handler 4:**
- File: `backend/tests/integration/socketEventTest.ts`
- Line: 41
- Function: `(data`
- Context:
```typescript

            // Handler for game_answer event for direct testing
            socket.on('game_answer', (data) => {
                console.log('Server received game_answer event with data:', data);
                socket.emit('answer_received', {
```

**Handler 5:**
- File: `backend-backup/sockets/gameEvents.ts`
- Line: 51
- Function: `(payload: GameAnswerPayload`
- Context:
```typescript
    });

    socket.on("game_answer", (payload: GameAnswerPayload) => {
        logger.debug(`[game_answer] Received from socket ${socket.id}`);
        handleGameAnswer(io, socket, payload);
```

### Event: `join_lobby` (3 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/lobbyHandler.ts`
- Line: 112
- Function: `async (payload: any`
- Context:
```typescript
export function registerLobbyHandlers(io: SocketIOServer, socket: Socket): void {
    // Join a game lobby
    socket.on(LOBBY_EVENTS.JOIN_LOBBY, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = joinLobbyPayloadSchema.safeParse(payload);
```

**Handler 2:**
- File: `backend/tests/integration/lobbyBasic.test.ts`
- Line: 44
- Function: `(payload`
- Context:
```typescript

            // Join lobby handler
            socket.on('join_lobby', (payload) => {
                const { accessCode, userId, username } = payload;
                console.log(`Player ${username} joining lobby ${accessCode}`);
```

**Handler 3:**
- File: `backend-backup/sockets/lobbyHandler.ts`
- Line: 54
- Function: `async ({ code, username, avatar, cookie_id }: JoinLobbyPayload`
- Context:
```typescript
 */
function registerLobbyHandlers(io: Server, socket: Socket): void {
    socket.on("join_lobby", async ({ code, username, avatar, cookie_id }: JoinLobbyPayload) => {
        logger.info(`join_lobby received: code=${code}, username=${username}, cookie_id=${cookie_id || 'none'}, socket.id=${socket.id}`);
        logger.debug(`Avatar for ${username}: ${avatar}`);
```

### Event: `leave_lobby` (3 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/lobbyHandler.ts`
- Line: 327
- Function: `async (payload: any`
- Context:
```typescript

    // Leave a game lobby
    socket.on(LOBBY_EVENTS.LEAVE_LOBBY, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = leaveLobbyPayloadSchema.safeParse(payload);
```

**Handler 2:**
- File: `backend/tests/integration/lobbyBasic.test.ts`
- Line: 60
- Function: `(payload`
- Context:
```typescript

            // Leave lobby handler
            socket.on('leave_lobby', (payload) => {
                const { accessCode } = payload;
                console.log(`Player leaving lobby ${accessCode}`);
```

**Handler 3:**
- File: `backend-backup/sockets/lobbyHandler.ts`
- Line: 236
- Function: `async ({ code }: LeaveLobbyPayload`
- Context:
```typescript
    });

    socket.on("leave_lobby", async ({ code }: LeaveLobbyPayload) => {
        logger.info(`leave_lobby: code=${code}, socket.id=${socket.id}`);

```

### Event: `get_participants` (2 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/lobbyHandler.ts`
- Line: 409
- Function: `async (payload: any`
- Context:
```typescript

    // Request current participants list
    socket.on(LOBBY_EVENTS.GET_PARTICIPANTS, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = getParticipantsPayloadSchema.safeParse(payload);
```

**Handler 2:**
- File: `backend-backup/sockets/lobbyHandler.ts`
- Line: 259
- Function: `async ({ code }: GetParticipantsPayload`
- Context:
```typescript
    });

    socket.on("get_participants", async ({ code }: GetParticipantsPayload) => {
        logger.debug(`get_participants: code=${code}, socket.id=${socket.id}`);
        logger.debug(`lobbyParticipants[${code}] on get_participants:`, lobbyParticipants[code]);
```

### Event: `disconnecting` (5 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/lobbyHandler.ts`
- Line: 499
- Function: `async (`
- Context:
```typescript

    // Handle disconnects
    socket.on('disconnecting', async () => {
        try {
            // Store the socket ID before disconnection
```

**Handler 2:**
- File: `backend-backup/server.ts`
- Line: 116
- Function: `(`
- Context:
```typescript
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach((room) => {
            if (room !== socket.id) {
```

**Handler 3:**
- File: `backend-backup/sockets/gameEvents.ts`
- Line: 66
- Function: `(`
- Context:
```typescript
    });

    socket.on("disconnecting", () => {
        logger.debug(`[disconnecting] Socket ${socket.id} disconnecting`);
        handleDisconnecting(io, socket);
```

**Handler 4:**
- File: `backend-backup/sockets/lobbyHandler.ts`
- Line: 281
- Function: `async (`
- Context:
```typescript

    // Handle disconnect within the lobby context as well
    socket.on("disconnecting", async () => {
        for (const room of socket.rooms) {
            // Check if this is a lobby room (starts with "lobby_")
```

**Handler 5:**
- File: `backend-backup/sockets/quizEvents.ts`
- Line: 262
- Function: `(`
- Context:
```typescript
    // Handle disconnections
    // handleDisconnecting might need to iterate through quizState using quizTemplateId
    socket.on("disconnecting", () => handleDisconnecting(io, socket, prisma));

    // Get quiz template dashboard state
```

### Event: `disconnect` (13 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/projectorHandler.ts`
- Line: 101
- Function: `(`
- Context:
```typescript

    // Handle disconnects gracefully (optional: clean up if needed)
    socket.on('disconnect', () => {
        // No-op for now; projector is read-only
    });
```

**Handler 2:**
- File: `backend/src/sockets/handlers/connectionHandlers.ts`
- Line: 23
- Function: `(reason`
- Context:
```typescript

        // Create custom disconnect handler that includes practice session cleanup
        socket.on('disconnect', (reason) => {
            // Handle practice session cleanup first
            handlePracticeSessionDisconnect(io, socket);
```

**Handler 3:**
- File: `backend/src/sockets/handlers/connectionHandlers.ts`
- Line: 80
- Function: `(reason`
- Context:
```typescript
 */
// function handleDisconnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): void {
//     socket.on('disconnect', (reason) => {
//         const user = socket.data || { role: 'anonymous' };
//         logger.info({
```

**Handler 4:**
- File: `backend/src/sockets/handlers/teacherControl/index.ts`
- Line: 55
- Function: `disconnectHandler(io, socket`
- Context:
```typescript
    // Handle disconnect
    logger.info('Registering disconnect handler');
    socket.on('disconnect', disconnectHandler(io, socket));
}

```

**Handler 5:**
- File: `backend/src/sockets/handlers/game/index.ts`
- Line: 22
- Function: `disconnectHandler(io, socket`
- Context:
```typescript
    socket.on(GAME_EVENTS.REQUEST_PARTICIPANTS, requestParticipantsHandler(io, socket));
    socket.on(GAME_EVENTS.REQUEST_NEXT_QUESTION, requestNextQuestionHandler(io, socket));
    socket.on('disconnect', disconnectHandler(io, socket));

    // Direct handler for start_game in practice mode
```

**Handler 6:**
- File: `backend/tests/socketDisconnectTest.ts`
- Line: 32
- Function: `(reason`
- Context:
```typescript
    });

    socket.on('disconnect', (reason) => {
        console.log('Server: client disconnected', socket.id, reason);
        events.disconnects++;
```

**Handler 7:**
- File: `backend/tests/integration/socketEventTest.ts`
- Line: 85
- Function: `(reason`
- Context:
```typescript
        });

        socket.on('disconnect', (reason) => {
            console.log('Client socket disconnected, reason:', reason);
        });
```

**Handler 8:**
- File: `backend-backup/server.ts`
- Line: 112
- Function: `(`
- Context:
```typescript
    registerQuizTemplateDashboardHandlers(io, socket, prisma);

    socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: socket.id=${socket.id}`);
    });
```

**Handler 9:**
- File: `backend-backup/sockets/lobbyHandler.ts`
- Line: 225
- Function: `(`
- Context:
```typescript

            // Clear interval when socket disconnects
            socket.on('disconnect', () => {
                clearInterval(checkInterval);
            });
```

**Handler 10:**
- File: `backend-backup/sockets/quizEventHandlers/joinQuizHandler.ts`
- Line: 190
- Function: `(`
- Context:
```typescript
    logger.info(`Emitted quiz_template_dashboard_state for ${quizTemplateId} to socket ${socket.id}`);

    socket.on('disconnect', () => {
        if (quizState[quizTemplateId] && quizState[quizTemplateId].connectedSockets) {
            quizState[quizTemplateId].connectedSockets.delete(socket.id);
```

**Handler 11:**
- File: `frontend/src/utils/socketConnectionPool.ts`
- Line: 165
- Function: `(reason`
- Context:
```typescript
        });

        this.socket.on('disconnect', (reason) => {
            logger.warn('Socket disconnected', { reason, id: this.socket.id });
        });
```

**Handler 12:**
- File: `frontend/src/utils/socketConnectionPool.ts`
- Line: 181
- Function: `(`
- Context:
```typescript
        let reconnectDelay = this.config.reconnectDelay;

        this.socket.on('disconnect', () => {
            if (reconnectAttempts < this.config.reconnectAttempts) {
                setTimeout(() => {
```

**Handler 13:**
- File: `frontend/src/hooks/usePracticeSession.ts`
- Line: 273
- Function: `(reason`
- Context:
```typescript
            });

            socket.on('disconnect', (reason) => {
                logger.info('Practice session socket disconnected', { reason });
                updateState({ connected: false });
```

### Event: `start_game` (2 handlers)

**Handler 1:**
- File: `backend/src/sockets/handlers/game/index.ts`
- Line: 25
- Function: `async (payload: any`
- Context:
```typescript

    // Direct handler for start_game in practice mode
    socket.on(GAME_EVENTS.START_GAME, async (payload: any) => {
        // Runtime validation with Zod
        const parseResult = startGamePayloadSchema.safeParse(payload);
```

**Handler 2:**
- File: `backend-backup/sockets/gameEvents.ts`
- Line: 41
- Function: `(payload: StartGamePayload`
- Context:
```typescript

    // Register event handlers with their respective payloads
    socket.on("start_game", (payload: StartGamePayload) => {
        logger.debug(`[start_game] Received from socket ${socket.id}`);
        handleStartGame(io, socket, payload);
```

### Event: `join-room` (2 handlers)

**Handler 1:**
- File: `backend/src/tests/unit/participantCount.test.ts`
- Line: 52
- Function: `(roomName`
- Context:
```typescript
        // Set up server-side join handler
        io.on('connection', (socket) => {
            socket.on('join-room', (roomName) => {
                socket.join(roomName);
            });
```

**Handler 2:**
- File: `backend/tests/integration/participantCount.test.ts`
- Line: 56
- Function: `(roomName: string`
- Context:
```typescript
        // Set up server-side join handler
        const setupJoinHandler = (socket: any) => {
            socket.on('join-room', (roomName: string) => {
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room: ${roomName}`);
```

### Event: `eventName` (9 handlers)

**Handler 1:**
- File: `backend/tests/integration/tournament.test.ts`
- Line: 26
- Function: `handler`
- Context:
```typescript
            resolve(data);
        };
        socket.on(eventName, handler);
        setTimeout(() => {
            socket.off(eventName, handler);
```

**Handler 2:**
- File: `backend/tests/integration/tournament2.test.ts`
- Line: 26
- Function: `handler`
- Context:
```typescript
            resolve(data);
        };
        socket.on(eventName, handler);
        setTimeout(() => {
            socket.off(eventName, handler);
```

**Handler 3:**
- File: `frontend/src/utils/socketRetrofit.ts`
- Line: 73
- Function: `interceptor`
- Context:
```typescript
                }
            );
            socket.on(eventName, interceptor);
        } else {
            logger.warn(`No validation schema found for event: ${eventName}`);
```

**Handler 4:**
- File: `frontend/src/utils/socketRetrofit.ts`
- Line: 76
- Function: `handler`
- Context:
```typescript
        } else {
            logger.warn(`No validation schema found for event: ${eventName}`);
            socket.on(eventName, handler);
        }
    };
```

**Handler 5:**
- File: `frontend/src/utils/socketRetrofit.ts`
- Line: 234
- Function: `handler`
- Context:
```typescript
            validatedOn(eventName, handler, schemaKey);
        } else {
            socket.on(eventName, handler);
            logger.warn(`No validation schema available for event: ${eventName}`);
        }
```

**Handler 6:**
- File: `frontend/src/utils/socketMiddleware.ts`
- Line: 93
- Function: `validatedHandler`
- Context:
```typescript
            );

            this.socket.on(eventName, validatedHandler);
        } else {
            // No validation, use original handler
```

**Handler 7:**
- File: `frontend/src/utils/socketMiddleware.ts`
- Line: 96
- Function: `handler`
- Context:
```typescript
        } else {
            // No validation, use original handler
            this.socket.on(eventName, handler);

            if (this.config.enableLogging) {
```

**Handler 8:**
- File: `frontend/src/utils/socketConnectionPool.ts`
- Line: 137
- Function: `wrappedHandler`
- Context:
```typescript
        };

        this.socket.on(eventName, wrappedHandler);
        return () => this.socket.off(eventName, wrappedHandler);
    }
```

**Handler 9:**
- File: `frontend/src/hooks/useSimpleTimer.ts`
- Line: 143
- Function: `handleTimerUpdate`
- Context:
```typescript
                : GAME_EVENTS.GAME_TIMER_UPDATED;       // Backend sends this for students

        socket.on(eventName, handleTimerUpdate);

        // For students, also listen to the alternative timer_update event
```

### Event: `error` (2 handlers)

**Handler 1:**
- File: `backend/tests/integration/gameHandler.test.ts`
- Line: 299
- Function: `(err: any`
- Context:
```typescript
        });
        // Add error event logging
        socket.on('error', (err: any) => {
            // eslint-disable-next-line no-console
            console.error('Socket error:', err);
```

**Handler 2:**
- File: `backend/tests/integration/socketEventTest.ts`
- Line: 89
- Function: `(err: any`
- Context:
```typescript
        });

        socket.on('error', (err: any) => {
            console.error('Socket error:', err);
        });
```

### Event: `connect_error` (6 handlers)

**Handler 1:**
- File: `backend/tests/integration/gameHandler.test.ts`
- Line: 303
- Function: `(err: any`
- Context:
```typescript
            console.error('Socket error:', err);
        });
        socket.on('connect_error', (err: any) => {
            // eslint-disable-next-line no-console
            console.error('Socket connect_error:', err);
```

**Handler 2:**
- File: `backend/tests/integration/lobbyDebug.test.ts`
- Line: 237
- Function: `(err`
- Context:
```typescript
                    resolve();
                });
                socket.on('connect_error', (err) => {
                    console.error('❌ Socket connection error:', err);
                    clearTimeout(connectionTimeoutId); // Clear timeout on connection error
```

**Handler 3:**
- File: `backend/tests/integration/socketEventTest.ts`
- Line: 93
- Function: `(err: any`
- Context:
```typescript
        });

        socket.on('connect_error', (err: any) => {
            console.error('Socket connect_error:', err);
        });
```

**Handler 4:**
- File: `backend/tests/integration/practiceMode.test.ts`
- Line: 151
- Function: `(err`
- Context:
```typescript
            console.error('[SOCKET GAME_ERROR]', err);
        });
        socket.on('connect_error', (err) => {
            console.error('[SOCKET CONNECT_ERROR]', err);
        });
```

**Handler 5:**
- File: `frontend/src/utils/socketConnectionPool.ts`
- Line: 169
- Function: `(error`
- Context:
```typescript
        });

        this.socket.on('connect_error', (error) => {
            logger.error('Socket connection error', { error: error.message });
        });
```

**Handler 6:**
- File: `frontend/src/hooks/usePracticeSession.ts`
- Line: 278
- Function: `(error`
- Context:
```typescript
            });

            socket.on('connect_error', (error) => {
                logger.error('Practice session socket connection error', error);

```

### Event: `connect` (6 handlers)

**Handler 1:**
- File: `backend/tests/integration/lobbyDebug.test.ts`
- Line: 232
- Function: `(`
- Context:
```typescript
            await new Promise<void>((resolve, reject) => {
                let connectionTimeoutId: NodeJS.Timeout; // Declare timeoutId
                socket.on('connect', () => {
                    console.log('✅ Socket connected');
                    clearTimeout(connectionTimeoutId); // Clear timeout on successful connection
```

**Handler 2:**
- File: `backend/tests/integration/socketEventTest.ts`
- Line: 81
- Function: `(`
- Context:
```typescript

        // Add debugging
        socket.on('connect', () => {
            console.log('Client socket connected');
        });
```

**Handler 3:**
- File: `backend/tests/integration/practiceMode.test.ts`
- Line: 160
- Function: `(`
- Context:
```typescript
        });
        // Wait for socket connection
        await new Promise<void>(res => socket.on('connect', () => res()));

        // Add additional debug
```

**Handler 4:**
- File: `frontend/src/utils/socketConnectionPool.ts`
- Line: 161
- Function: `(`
- Context:
```typescript
        if (!this.config.enablePerformanceMonitoring) return;

        this.socket.on('connect', () => {
            logger.info('Socket connected', { id: this.socket.id });
        });
```

**Handler 5:**
- File: `frontend/src/utils/socketConnectionPool.ts`
- Line: 198
- Function: `(`
- Context:
```typescript
        });

        this.socket.on('connect', () => {
            // Reset reconnection state on successful connection
            reconnectAttempts = 0;
```

**Handler 6:**
- File: `frontend/src/hooks/usePracticeSession.ts`
- Line: 268
- Function: `(`
- Context:
```typescript

            // Connection events
            socket.on('connect', () => {
                logger.info('Practice session socket connected');
                updateState({ connected: true, connecting: false });
```

### Event: `game_error` (3 handlers)

**Handler 1:**
- File: `backend/tests/integration/practiceMode.test.ts`
- Line: 148
- Function: `(err`
- Context:
```typescript
            console.log('[SOCKET EVENT]', event, args);
        });
        socket.on('game_error', (err) => {
            console.error('[SOCKET GAME_ERROR]', err);
        });
```

**Handler 2:**
- File: `frontend/src/hooks/useStudentGameSocket.ts`
- Line: 364
- Function: `createSafeEventHandler<ErrorPayload>((error`
- Context:
```typescript
        }, 'feedback'));

        socket.on('game_error', createSafeEventHandler<ErrorPayload>((error) => {
            setError(error.message || 'Unknown game error');
        }, isErrorPayload, 'game_error'));
```

**Handler 3:**
- File: `frontend/src/hooks/useEnhancedStudentGameSocket.ts`
- Line: 264
- Function: `(payload: ErrorPayload`
- Context:
```typescript
        });

        socket.on('game_error', (payload: ErrorPayload) => {
            logger.error('Standard game_error event', payload);
            setError(payload.message || 'Unknown game error');
```

### Event: `game_question` (3 handlers)

**Handler 1:**
- File: `backend/tests/integration/practiceMode.test.ts`
- Line: 156
- Function: `(data`
- Context:
```typescript

        // Explicitly listen for game_question for debugging
        socket.on('game_question', (data) => {
            console.log('[DIRECT LISTENER] game_question event received:', data);
        });
```

**Handler 2:**
- File: `frontend/src/hooks/useStudentGameSocket.ts`
- Line: 230
- Function: `createSafeEventHandler<LiveQuestionPayload>((payload`
- Context:
```typescript
            }));
        }, isGameJoinedPayload, 'game_joined'));
        socket.on('game_question', createSafeEventHandler<LiveQuestionPayload>((payload) => {
            logger.info('Received game_question', payload);

```

**Handler 3:**
- File: `frontend/src/hooks/useEnhancedStudentGameSocket.ts`
- Line: 252
- Function: `(payload: QuestionData`
- Context:
```typescript
        });

        socket.on('game_question', (payload: QuestionData) => {
            logger.info('Standard game_question event', payload);
            setGameState(prev => ({
```

### Event: `game_ended` (2 handlers)

**Handler 1:**
- File: `backend/tests/integration/practiceMode.test.ts`
- Line: 216
- Function: `(data`
- Context:
```typescript
        // Add specific listener for game_ended to debug
        let gameEndedReceived = false;
        socket.on('game_ended', (data) => {
            console.log('👀 DIRECT LISTENER: game_ended event received:', data);
            gameEndedReceived = true;
```

**Handler 2:**
- File: `frontend/src/hooks/useStudentGameSocket.ts`
- Line: 372
- Function: `createSafeEventHandler<{ accessCode: string; endedAt?: string; score?: number; totalQuestions?: number; correct?: number; total?: number }>((payload`
- Context:
```typescript

        // Listen for backend game end signal - this should control navigation
        socket.on('game_ended', createSafeEventHandler<{ accessCode: string; endedAt?: string; score?: number; totalQuestions?: number; correct?: number; total?: number }>((payload) => {
            logger.info('=== GAME ENDED ===', payload);
            // Use window.location for more reliable navigation
```

### Event: `SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents` (2 handlers)

**Handler 1:**
- File: `frontend/src/hooks/useUnifiedGameManager.ts`
- Line: 304
- Function: `(state: any`
- Context:
```typescript

    // Game control state updates
    socket.socket.on(
        SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents,
        (state: any) => {
```

**Handler 2:**
- File: `frontend/src/hooks/useTeacherQuizSocket.ts`
- Line: 100
- Function: `gameControlStateHandler`
- Context:
```typescript
        };

        socket.socket.on(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents, gameControlStateHandler);
        cleanupFunctions.push(() => {
            socket.socket?.off(SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents, gameControlStateHandler);
```

### Event: `game_joined` (3 handlers)

**Handler 1:**
- File: `frontend/src/hooks/useStudentGameSocket.ts`
- Line: 223
- Function: `createSafeEventHandler<GameJoinedPayload>((payload`
- Context:
```typescript
    useEffect(() => {
        if (!socket) return;
        socket.on('game_joined', createSafeEventHandler<GameJoinedPayload>((payload) => {
            setGameState(prev => ({
                ...prev,
```

**Handler 2:**
- File: `frontend/src/hooks/useEnhancedStudentGameSocket.ts`
- Line: 243
- Function: `(payload: GameJoinedPayload`
- Context:
```typescript
        logger.warn('Using standard event handlers without validation');

        socket.on('game_joined', (payload: GameJoinedPayload) => {
            logger.info('Standard game_joined event', payload);
            setGameState(prev => ({
```

**Handler 3:**
- File: `frontend/src/hooks/useGameSocket.ts`
- Line: 280
- Function: `handler`
- Context:
```typescript
            return () => { };
        }
        socket.on('game_joined', handler);
        return () => {
            socket.off('game_joined', handler);
```

### Event: `correct_answers` (2 handlers)

**Handler 1:**
- File: `frontend/src/hooks/useStudentGameSocket.ts`
- Line: 325
- Function: `createSafeEventHandler<CorrectAnswersPayload>((payload`
- Context:
```typescript

        // Add missing event listeners that backend emits
        socket.on('correct_answers', createSafeEventHandler<CorrectAnswersPayload>((payload) => {
            logger.info('=== CORRECT ANSWERS EVENT ===', payload);

```

**Handler 2:**
- File: `frontend/src/hooks/usePracticeSession.ts`
- Line: 307
- Function: `(payload: { questionUid: string; correctAnswers?: boolean[] }`
- Context:
```typescript

            // Canonical tournament-style events (emitted by backend for practice sessions)
            socket.on('correct_answers', (payload: { questionUid: string; correctAnswers?: boolean[] }) => {
                logger.debug('Received canonical correct_answers event', payload);
                if (payload.correctAnswers) {
```

### Event: `feedback` (2 handlers)

**Handler 1:**
- File: `frontend/src/hooks/useStudentGameSocket.ts`
- Line: 342
- Function: `createSafeEventHandler<{
            questionUid: string;
            feedbackRemaining: number;
            [key: string]: any; // Allows explanation and other fields
        }>((payload`
- Context:
```typescript
        }, isCorrectAnswersPayload, 'correct_answers'));

        socket.on('feedback', createSafeEventHandler<{
            questionUid: string;
            feedbackRemaining: number;
```

**Handler 2:**
- File: `frontend/src/hooks/usePracticeSession.ts`
- Line: 331
- Function: `(payload: { questionUid: string; feedbackRemaining: number;[key: string]: any }`
- Context:
```typescript
            });

            socket.on('feedback', (payload: { questionUid: string; feedbackRemaining: number;[key: string]: any }) => {
                logger.debug('Received canonical feedback event', payload);
                const explanation = payload.explanation as string | undefined;
```

### Event: `timer_update` (2 handlers)

**Handler 1:**
- File: `frontend/src/hooks/useSimpleTimer.ts`
- Line: 147
- Function: `handleTimerUpdate`
- Context:
```typescript
        // For students, also listen to the alternative timer_update event
        if (role === 'student') {
            socket.on(GAME_EVENTS.T
- Line: 315
- Function: `handler as any`
- Context:
```typescript
        // Only listen to allowed timer update events for teacher
        if (role === 'teacher') {
            socket.on('timer_update', handler as any);
            return () => {
                socket.off('timer_update', handler as any);
```

## 📋 All Handler Registrations

### ✅ `//     SOCKET_EVENTS.GAME.ANSWER_RECEIVED as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:371` → `//     (result: any`

### ✅ `PRACTICE_ANSWER_FEEDBACK` (1 handler)
- `frontend/src/hooks/usePracticeSession.ts:301` → `handleAnswerFeedback`

### ✅ `PRACTICE_QUESTION_READY` (1 handler)
- `frontend/src/hooks/usePracticeSession.ts:300` → `handleQuestionReady`

### ✅ `PRACTICE_SESSION_COMPLETED` (1 handler)
- `frontend/src/hooks/usePracticeSession.ts:302` → `handleSessionCompleted`

### ✅ `PRACTICE_SESSION_CREATED` (1 handler)
- `frontend/src/hooks/usePracticeSession.ts:299` → `handleSessionCreated`

### ✅ `PRACTICE_SESSION_ERROR` (1 handler)
- `frontend/src/hooks/usePracticeSession.ts:303` → `handleSessionError`

### ✅ `PRACTICE_SESSION_STATE` (1 handler)
- `frontend/src/hooks/usePracticeSession.ts:304` → `handleSessionState`

### ✅ `SOCKET_EVENTS.GAME.GAME_ENDED as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:383` → `(results: any`

### ✅ `SOCKET_EVENTS.GAME.GAME_QUESTION as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:344` → `(payload: LiveQuestionPayload`

### ✅ `SOCKET_EVENTS.PROJECTOR.PROJECTOR_STATE as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:404` → `(state: any`

### ✅ `SOCKET_EVENTS.TEACHER.CONNECTED_COUNT as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:237` → `(payload: any`

### ✅ `SOCKET_EVENTS.TEACHER.DASHBOARD_QUESTION_CHANGED as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:321` → `(payload: any`

### 🚨 `SOCKET_EVENTS.TEACHER.GAME_CONTROL_STATE as keyof ServerToClientEvents` (2 handlers)
- `frontend/src/hooks/useUnifiedGameManager.ts:304` → `(state: any`
- `frontend/src/hooks/useTeacherQuizSocket.ts:100` → `gameControlStateHandler`

### ✅ `SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_QUESTION as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:446` → `(data: any`

### ✅ `SOCKET_EVENTS.TOURNAMENT.TOURNAMENT_STATE_UPDATE as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useUnifiedGameManager.ts:431` → `(state: any`

### ✅ `answer_received` (1 handler)
- `frontend/src/hooks/useStudentGameSocket.ts:280` → `createSafeEventHandler<{
            questionUid: string;
            timeSpent: number;
            correct?: boolean;
            correctAnswers?: boolean[];
            explanation?: string;
        }>((payload`

### ✅ `answers_locked' as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useTeacherQuizSocket.ts:123` → `answersLockedHandler`

### 🚨 `connect` (6 handlers)
- `backend/tests/integration/lobbyDebug.test.ts:232` → `(`
- `backend/tests/integration/socketEventTest.ts:81` → `(`
- `backend/tests/integration/practiceMode.test.ts:160` → `(`
- `frontend/src/utils/socketConnectionPool.ts:161` → `(`
- `frontend/src/utils/socketConnectionPool.ts:198` → `(`
- `frontend/src/hooks/usePracticeSession.ts:268` → `(`

### 🚨 `connect_error` (6 handlers)
- `backend/tests/integration/gameHandler.test.ts:303` → `(err: any`
- `backend/tests/integration/lobbyDebug.test.ts:237` → `(err`
- `backend/tests/integration/socketEventTest.ts:93` → `(err: any`
- `backend/tests/integration/practiceMode.test.ts:151` → `(err`
- `frontend/src/utils/socketConnectionPool.ts:169` → `(error`
- `frontend/src/hooks/usePracticeSession.ts:278` → `(error`

### ✅ `connected_count' as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useTeacherQuizSocket.ts:134` → `connectedCountHandler`

### 🚨 `correct_answers` (2 handlers)
- `frontend/src/hooks/useStudentGameSocket.ts:325` → `createSafeEventHandler<CorrectAnswersPayload>((payload`
- `frontend/src/hooks/usePracticeSession.ts:307` → `(payload: { questionUid: string; correctAnswers?: boolean[] }`

### 🚨 `disconnect` (13 handlers)
- `backend/src/sockets/handlers/projectorHandler.ts:101` → `(`
- `backend/src/sockets/handlers/connectionHandlers.ts:23` → `(reason`
- `backend/src/sockets/handlers/connectionHandlers.ts:80` → `(reason`
- `backend/src/sockets/handlers/teacherControl/index.ts:55` → `disconnectHandler(io, socket`
- `backend/src/sockets/handlers/game/index.ts:22` → `disconnectHandler(io, socket`
- `backend/tests/socketDisconnectTest.ts:32` → `(reason`
- `backend/tests/integration/socketEventTest.ts:85` → `(reason`
- `backend-backup/server.ts:112` → `(`
- `backend-backup/sockets/lobbyHandler.ts:225` → `(`
- `backend-backup/sockets/quizEventHandlers/joinQuizHandler.ts:190` → `(`
- `frontend/src/utils/socketConnectionPool.ts:165` → `(reason`
- `frontend/src/utils/socketConnectionPool.ts:181` → `(`
- `frontend/src/hooks/usePracticeSession.ts:273` → `(reason`

### 🚨 `disconnecting` (5 handlers)
- `backend/src/sockets/handlers/lobbyHandler.ts:499` → `async (`
- `backend-backup/server.ts:116` → `(`
- `backend-backup/sockets/gameEvents.ts:66` → `(`
- `backend-backup/sockets/lobbyHandler.ts:281` → `async (`
- `backend-backup/sockets/quizEvents.ts:262` → `(`

### ✅ `echo` (1 handler)
- `backend/tests/integration/socketEventTest.ts:35` → `(data`

### ✅ `end_game` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:43` → `endGameHandler(io, socket`

### ✅ `end_practice_session` (1 handler)
- `backend/src/sockets/handlers/practiceSessionHandler.ts:334` → `async (payload: EndPracticeSessionPayload`

### 🚨 `error` (2 handlers)
- `backend/tests/integration/gameHandler.test.ts:299` → `(err: any`
- `backend/tests/integration/socketEventTest.ts:89` → `(err: any`

### ✅ `event` (1 handler)
- `frontend/src/hooks/useGameTimer.ts:534` → `handler`

### 🚨 `eventName` (9 handlers)
- `backend/tests/integration/tournament.test.ts:26` → `handler`
- `backend/tests/integration/tournament2.test.ts:26` → `handler`
- `frontend/src/utils/socketRetrofit.ts:73` → `interceptor`
- `frontend/src/utils/socketRetrofit.ts:76` → `handler`
- `frontend/src/utils/socketRetrofit.ts:234` → `handler`
- `frontend/src/utils/socketMiddleware.ts:93` → `validatedHandler`
- `frontend/src/utils/socketMiddleware.ts:96` → `handler`
- `frontend/src/utils/socketConnectionPool.ts:137` → `wrappedHandler`
- `frontend/src/hooks/useSimpleTimer.ts:143` → `handleTimerUpdate`

### 🚨 `feedback` (2 handlers)
- `frontend/src/hooks/useStudentGameSocket.ts:342` → `createSafeEventHandler<{
            questionUid: string;
            feedbackRemaining: number;
            [key: string]: any; // Allows explanation and other fields
        }>((payload`
- `frontend/src/hooks/usePracticeSession.ts:331` → `(payload: { questionUid: string; feedbackRemaining: number;[key: string]: any }`

### ✅ `game_already_played` (1 handler)
- `frontend/src/hooks/useStudentGameSocket.ts:367` → `createSafeEventHandler<GameAlreadyPlayedPayload>((`

### 🚨 `game_answer` (5 handlers)
- `backend/src/sockets/handlers/sharedLiveHandler.ts:514` → `...`
- `backend/src/sockets/handlers/game/gameAnswer.ts:366` → `handler`
- `backend/src/sockets/handlers/game/index.ts:19` → `gameAnswerHandler(io, socket`
- `backend/tests/integration/socketEventTest.ts:41` → `(data`
- `backend-backup/sockets/gameEvents.ts:51` → `(payload: GameAnswerPayload`

### 🚨 `game_ended` (2 handlers)
- `backend/tests/integration/practiceMode.test.ts:216` → `(data`
- `frontend/src/hooks/useStudentGameSocket.ts:372` → `createSafeEventHandler<{ accessCode: string; endedAt?: string; score?: number; totalQuestions?: number; correct?: number; total?: number }>((payload`

### 🚨 `game_error` (3 handlers)
- `backend/tests/integration/practiceMode.test.ts:148` → `(err`
- `frontend/src/hooks/useStudentGameSocket.ts:364` → `createSafeEventHandler<ErrorPayload>((error`
- `frontend/src/hooks/useEnhancedStudentGameSocket.ts:264` → `(payload: ErrorPayload`

### 🚨 `game_joined` (3 handlers)
- `frontend/src/hooks/useStudentGameSocket.ts:223` → `createSafeEventHandler<GameJoinedPayload>((payload`
- `frontend/src/hooks/useEnhancedStudentGameSocket.ts:243` → `(payload: GameJoinedPayload`
- `frontend/src/hooks/useGameSocket.ts:280` → `handler`

### ✅ `game_pause` (1 handler)
- `backend-backup/sockets/gameEvents.ts:56` → `(payload: any`

### 🚨 `game_question` (3 handlers)
- `backend/tests/integration/practiceMode.test.ts:156` → `(data`
- `frontend/src/hooks/useStudentGameSocket.ts:230` → `createSafeEventHandler<LiveQuestionPayload>((payload`
- `frontend/src/hooks/useEnhancedStudentGameSocket.ts:252` → `(payload: QuestionData`

### ✅ `game_resume` (1 handler)
- `backend-backup/sockets/gameEvents.ts:61` → `(payload: any`

### ✅ `game_state_update` (1 handler)
- `frontend/src/hooks/useStudentGameSocket.ts:258` → `createSafeEventHandler<GameStateUpdatePayload>((data`

### ✅ `get_next_practice_question` (1 handler)
- `backend/src/sockets/handlers/practiceSessionHandler.ts:110` → `async (payload: GetNextPracticeQuestionPayload`

### 🚨 `get_participants` (2 handlers)
- `backend/src/sockets/handlers/lobbyHandler.ts:409` → `async (payload: any`
- `backend-backup/sockets/lobbyHandler.ts:259` → `async ({ code }: GetParticipantsPayload`

### ✅ `get_practice_session_state` (1 handler)
- `backend/src/sockets/handlers/practiceSessionHandler.ts:291` → `async (payload: GetPracticeSessionStatePayload`

### ✅ `get_quiz_state` (1 handler)
- `backend-backup/sockets/quizEvents.ts:282` → `async ({ quizId }`

### ✅ `get_quiz_template_dashboard_state` (1 handler)
- `backend-backup/sockets/quizEvents.ts:265` → `async ({ quizTemplateId }`

### 🚨 `join-room` (2 handlers)
- `backend/src/tests/unit/participantCount.test.ts:52` → `(roomName`
- `backend/tests/integration/participantCount.test.ts:56` → `(roomName: string`

### ✅ `join_dashboard` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:27` → `joinDashboardHandler(io, socket`

### 🚨 `join_game` (3 handlers)
- `backend/src/sockets/handlers/sharedLiveHandler.ts:509` → `(payload: any`
- `backend/src/sockets/handlers/game/index.ts:18` → `joinGameHandler(io, socket`
- `backend-backup/sockets/gameEvents.ts:46` → `(payload: JoinGamePayload`

### 🚨 `join_lobby` (3 handlers)
- `backend/src/sockets/handlers/lobbyHandler.ts:112` → `async (payload: any`
- `backend/tests/integration/lobbyBasic.test.ts:44` → `(payload`
- `backend-backup/sockets/lobbyHandler.ts:54` → `async ({ code, username, avatar, cookie_id }: JoinLobbyPayload`

### ✅ `join_projector` (1 handler)
- `backend/src/sockets/handlers/projectorHandler.ts:20` → `async (payload: any`

### ✅ `join_quiz` (1 handler)
- `backend-backup/sockets/quizEvents.ts:153` → `(payload`

### ✅ `join_quiz_template_dashboard` (1 handler)
- `backend-backup/sockets/quizEvents.ts:147` → `(payload`

### ✅ `join_tournament` (1 handler)
- `backend/src/sockets/handlers/sharedLiveHandler.ts:510` → `(payload: any`

### 🚨 `leave_lobby` (3 handlers)
- `backend/src/sockets/handlers/lobbyHandler.ts:327` → `async (payload: any`
- `backend/tests/integration/lobbyBasic.test.ts:60` → `(payload`
- `backend-backup/sockets/lobbyHandler.ts:236` → `async ({ code }: LeaveLobbyPayload`

### ✅ `leave_projector` (1 handler)
- `backend/src/sockets/handlers/projectorHandler.ts:72` → `(payload: any`

### ✅ `lock_answers` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:39` → `lockAnswersHandler(io, socket`

### ✅ `participants_list` (1 handler)
- `backend/tests/integration/lobbyDebug.test.ts:207` → `(data: ParticipantsListResponse`

### ✅ `pause_timer` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:51` → `pauseTimerHandler(io, socket`

### ✅ `ping` (1 handler)
- `backend-backup/server.ts:99` → `(data`

### ✅ `quiz_close_question` (1 handler)
- `backend-backup/sockets/quizEvents.ts:254` → `(payload`

### ✅ `quiz_end` (1 handler)
- `backend-backup/sockets/quizEvents.ts:239` → `(payload`

### ✅ `quiz_lock` (1 handler)
- `backend-backup/sockets/quizEvents.ts:229` → `(payload`

### ✅ `quiz_pause` (1 handler)
- `backend-backup/sockets/quizEvents.ts:244` → `(payload`

### ✅ `quiz_resume` (1 handler)
- `backend-backup/sockets/quizEvents.ts:249` → `(payload`

### ✅ `quiz_set_question` (1 handler)
- `backend-backup/sockets/quizEvents.ts:185` → `(payload`

### ✅ `quiz_set_timer` (1 handler)
- `backend-backup/sockets/quizEvents.ts:224` → `(payload`

### ✅ `quiz_template_dashboard_close_question` (1 handler)
- `backend-backup/sockets/quizEvents.ts:216` → `(payload`

### ✅ `quiz_template_dashboard_end` (1 handler)
- `backend-backup/sockets/quizEvents.ts:213` → `(payload`

### ✅ `quiz_template_dashboard_lock` (1 handler)
- `backend-backup/sockets/quizEvents.ts:211` → `(payload`

### ✅ `quiz_template_dashboard_pause` (1 handler)
- `backend-backup/sockets/quizEvents.ts:214` → `(payload`

### ✅ `quiz_template_dashboard_resume` (1 handler)
- `backend-backup/sockets/quizEvents.ts:215` → `(payload`

### ✅ `quiz_template_dashboard_set_question` (1 handler)
- `backend-backup/sockets/quizEvents.ts:163` → `(payload`

### ✅ `quiz_template_dashboard_set_timer` (1 handler)
- `backend-backup/sockets/quizEvents.ts:210` → `(payload`

### ✅ `quiz_template_dashboard_timer_action` (1 handler)
- `backend-backup/sockets/quizEvents.ts:209` → `(payload`

### ✅ `quiz_template_dashboard_unlock` (1 handler)
- `backend-backup/sockets/quizEvents.ts:212` → `(payload`

### ✅ `quiz_timer_action` (1 handler)
- `backend-backup/sockets/quizEvents.ts:219` → `(payload`

### ✅ `quiz_unlock` (1 handler)
- `backend-backup/sockets/quizEvents.ts:234` → `(payload`

### ✅ `request_next_question` (1 handler)
- `backend/src/sockets/handlers/game/index.ts:21` → `requestNextQuestionHandler(io, socket`

### 🚨 `request_participants` (2 handlers)
- `backend/src/sockets/handlers/sharedLiveHandler.ts:483` → `async (payload: any`
- `backend/src/sockets/handlers/game/index.ts:20` → `requestParticipantsHandler(io, socket`

### ✅ `request_practice_feedback` (1 handler)
- `backend/src/sockets/handlers/practiceSessionHandler.ts:390` → `async (payload: RequestPracticeFeedbackPayload`

### ✅ `room_left` (1 handler)
- `backend/tests/integration/lobbyDebug.test.ts:216` → `(data: RoomLeftResponse`

### ✅ `set_question` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:31` → `setQuestionHandler(io, socket`

### 🚨 `start_game` (2 handlers)
- `backend/src/sockets/handlers/game/index.ts:25` → `async (payload: any`
- `backend-backup/sockets/gameEvents.ts:41` → `(payload: StartGamePayload`

### ✅ `start_practice_session` (1 handler)
- `backend/src/sockets/handlers/practiceSessionHandler.ts:51` → `async (payload: StartPracticeSessionPayload`

### ✅ `start_timer` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:47` → `startTimerHandler(io, socket`

### ✅ `start_tournament` (1 handler)
- `backend/src/sockets/handlers/tournamentHandler.ts:27` → `async (payload: any`

### ✅ `stats_update' as keyof ServerToClientEvents` (1 handler)
- `frontend/src/hooks/useTeacherQuizSocket.ts:111` → `statsUpdateHandler`

### ✅ `submit_practice_answer` (1 handler)
- `backend/src/sockets/handlers/practiceSessionHandler.ts:188` → `async (payload: SubmitPracticeAnswerPayload`

### ✅ `test_event` (1 handler)
- `backend/tests/socketDisconnectTest.ts:37` → `(data`

### ✅ `timer_action` (1 handler)
- `backend/src/sockets/handlers/teacherControl/index.ts:35` → `timerActionHandler(io, socket`

### 🚨 `timer_update` (2 handlers)
- `frontend/src/hooks/useSimpleTimer.ts:147` → `handleTimerUpdate`
- `frontend/src/hooks/useGameSocket.ts:315` → `handler as any`

---

# Handler Audit Report

## [2025-06-23] Deferred Tournament Timer Bug

- Root cause: Answer handler was loading global game state for all modes, not per-user session state for deferred tournaments. This caused timer validation to fail for deferred users if the global game was completed.
- Fix: Updated answer handler to load and check per-user game state (`deferred_session:${accessCode}:${userId}`) for deferred tournaments. Now uses per-user timer for validation.
- Code: See `gameAnswerHandler.ts` for logic change.
- Validation: Pending test of deferred answer submission after global game completion.
- Next: Confirm fix, update plan and audit log with test results.

## [2025-06-23] Live→Deferred Participation Bug
- **Root Cause:** When a user plays live, then deferred, the answer handler still finds the old LIVE participant and does not use the new DEFERRED participant, so it checks the global timer (which is expired) instead of the per-user deferred timer.
- **Solution:** Update answer handler to always select the DEFERRED participant and session/timer for deferred mode, even if a LIVE participant exists for the same user/game.
- **Checklist:** See `plan.md` for new phase and validation steps.
- **Status:** [ ] Pending code update and validation.

## [2025-06-23] Unified Call Sites: Canonical Timer/Session Context Passed to DRY Handler
- All socket event registrations for answer submission (GAME_ANSWER) now resolve the canonical timer/session context (timer, gameState, participant, gameInstance) before invoking the answer handler.
- No legacy or mode-specific logic remains at the handler or call site; all modes (live, deferred, quiz, practice) use the same DRY handler and context resolution.
- Deferred tournament flow relies on the main handler registration, which is now fully modernized.
- Checklist in `plan.md` marked complete. All requirements for timer/session unification and DRY handler are satisfied.
- Next: Validate in all modes and fill in test results in `plan.md` after QA.

## [2025-06-24] Bugfix: Nested gameState Property Access in Answer Handler
- Root Cause: The answer handler was checking `gameState.status`, but the loaded object is nested (`gameState.gameState.status`). This caused the handler to reject valid answer submissions with 'Game is not active' errors, even when the user's session was active.
- Fix: Updated the answer handler to check `gameState.gameState.status` and `gameState.gameState.answersLocked`.
- Documentation: Added a clarifying comment in the handler code about the nested structure of the loaded game state.
- Checklist: See `plan.md` for updated checklist and testing steps.
