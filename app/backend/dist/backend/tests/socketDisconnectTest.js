"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const socket_io_client_1 = require("socket.io-client");
const zod_1 = require("zod");
// Zod schema for test_event payload
const testEventSchema = zod_1.z.string();
// Create a basic server
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer);
// Event tracking
const events = {
    connects: 0,
    disconnects: 0,
    messages: [],
};
// Setup server-side
io.on('connection', (socket) => {
    console.log('Server: client connected', socket.id);
    events.connects++;
    // Log all events
    socket.onAny((event, ...args) => {
        console.log(`Server: onAny event='${event}' args=`, args);
    });
    socket.on('disconnect', (reason) => {
        console.log('Server: client disconnected', socket.id, reason);
        events.disconnects++;
    });
    socket.on('test_event', (data) => {
        // Zod validation
        const result = testEventSchema.safeParse(data);
        if (!result.success) {
            console.error('Server: Invalid test_event payload', result.error);
            socket.emit('test_error', { message: 'Invalid payload', details: result.error.format() });
            return;
        }
        console.log('Server: received test_event', data);
        events.messages.push(data);
        socket.emit('test_response', `Received: ${data}`);
    });
});
// Start the server
const PORT = 3030;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    runTest();
});
// Test function
async function runTest() {
    try {
        // Create client
        const client = (0, socket_io_client_1.io)(`http://localhost:${PORT}`);
        // Log all events
        client.onAny((event, ...args) => {
            console.log(`Client: onAny event='${event}' args=`, args);
        });
        // Wait for connection
        await new Promise(resolve => {
            client.on('connect', () => {
                console.log('Client: connected to server');
                resolve();
            });
        });
        // Send a test event
        console.log('Client: sending test_event');
        client.emit('test_event', 'Hello, server!');
        // Wait for response
        const response = await new Promise(resolve => {
            client.on('test_response', (data) => {
                console.log('Client: received test_response', data);
                resolve(data);
            });
        });
        console.log('Test result:', response);
        // Wait a moment to see what happens with the connection
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Print final stats
        console.log('Final stats:', {
            connects: events.connects,
            disconnects: events.disconnects,
            messages: events.messages,
        });
        // Clean up
        client.disconnect();
        httpServer.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}
