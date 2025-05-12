// socket-test.js - A simple test client for Socket.IO
const { io } = require('socket.io-client');

// Configuration for Socket.IO client
// Note: We separate the URL from the options
const SOCKET_URL = 'http://localhost:3007';
const SOCKET_OPTIONS = {
    path: '/api/socket/io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 30000,
    forceNew: true,
    autoConnect: true
};

console.log('Creating Socket.IO client with:');
console.log('URL:', SOCKET_URL);
console.log('Options:', SOCKET_OPTIONS);

// Connect to the socket server with URL as first param, options as second
const socket = io(SOCKET_URL, SOCKET_OPTIONS);

// Listen for common events
socket.on('connect', () => {
    console.log('Socket connected!', socket.id);
    console.log('Connected: ', socket.connected);

    // Test getting stats
    fetch('http://localhost:3007/api/stats')
        .then(res => res.json())
        .then(stats => {
            console.log('API Stats:', stats);
        })
        .catch(err => {
            console.error('Error fetching stats:', err);
        });
});

socket.on('connect_error', (err) => {
    console.error('Connection error:', err.message);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});

// Add a basic ping to verify two-way communication
setTimeout(() => {
    if (socket.connected) {
        console.log('Sending ping event to server...');
        socket.emit('ping', { timestamp: Date.now() });
    } else {
        console.log('Socket not connected yet, can\'t send ping');
    }
}, 2000);

// Listen for a pong response (even though the server may not have this handler)
socket.on('pong', (data) => {
    console.log('Received pong from server:', data);
});

// Keep the process running for a bit longer to test connection stability
setTimeout(() => {
    console.log('Connection state before disconnecting:');
    console.log('- Connected:', socket.connected);
    console.log('- ID:', socket.id);
    console.log('- Disconnecting socket...');
    socket.disconnect();
    process.exit(0);
}, 8000);
