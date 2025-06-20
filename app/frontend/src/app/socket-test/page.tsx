'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_CONFIG } from '@/config';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

/**
 * SocketTest - A simple component to test Socket.IO connections
 * 
 * This page allows testing the socket connection between the frontend and backend.
 */

// Define proper types for our responses
interface PingResponseData {
    timestamp: number;
    serverTime?: number;
    echo?: unknown;
}

interface ServerStats {
    connections: number;
    uptime: number;
    memory?: {
        used: number;
        free: number;
    };
    [key: string]: unknown;
}

export default function SocketTest() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [pingResponse, setPingResponse] = useState<PingResponseData | null>(null);

    // Log function
    const log = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 23)} - ${message}`]);
    };

    // Connect to socket
    const connect = () => {
        try {
            log(`Connecting to ${SOCKET_CONFIG.url}...`);
            const newSocket = io(SOCKET_CONFIG.url, SOCKET_CONFIG);

            newSocket.on('connect', () => {
                setConnected(true);
                setSocketId(newSocket.id || null);
                log(`Connected! Socket ID: ${newSocket.id || 'unknown'}`);
            });

            newSocket.on('disconnect', (reason) => {
                setConnected(false);
                setSocketId(null);
                log(`Disconnected: ${reason}`);
            });

            newSocket.on('connect_error', (error) => {
                log(`Connection error: ${error.message}`);
            });

            newSocket.on('pong', (data) => {
                setPingResponse(data);
                log(`Received pong: ${JSON.stringify(data)}`);
            });

            setSocket(newSocket);
        } catch (err) {
            log(`Error creating socket: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // Disconnect socket
    const disconnect = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            log('Disconnected by user');
        }
    };

    // Send ping
    const sendPing = () => {
        if (socket && connected) {
            const pingData = { timestamp: Date.now() };
            socket.emit('ping', pingData);
            log(`Sent ping: ${JSON.stringify(pingData)}`);
        } else {
            log('Cannot send ping - not connected');
        }
    };

    // Fetch stats from API
    const fetchStats = async () => {
        try {
            log('Fetching stats from API...');
            const response = await fetch(`${SOCKET_CONFIG.url}/api/stats`);
            const data = await response.json();
            setStats(data as ServerStats);
            log(`Stats received: ${JSON.stringify(data)}`);
        } catch (err) {
            log(`Error fetching stats: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    // Add cleanup effect to disconnect socket when component unmounts
    useEffect(() => {
        // Cleanup function to disconnect socket and remove listeners
        return () => {
            if (socket) {
                socket.disconnect();
                socket.removeAllListeners();
                log('Socket disconnected due to component unmount');
            }
        };
    }, [socket]);

    return (
        <main className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Socket.IO Connection Test</h1>

            <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
                <div className="mb-2">
                    <span className="font-medium">Status:</span>{' '}
                    <span className={connected ? 'text-green-600' : 'text-red-600'}>
                        {connected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
                {socketId && (
                    <div className="mb-2">
                        <span className="font-medium">Socket ID:</span> {socketId}
                    </div>
                )}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={connect}
                        disabled={connected}
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-blue-300"
                    >
                        Connect
                    </button>
                    <button
                        onClick={disconnect}
                        disabled={!connected}
                        className="px-3 py-1 bg-red-600 text-white rounded disabled:bg-red-300"
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Actions</h2>
                <div className="flex gap-2">
                    <button
                        onClick={sendPing}
                        disabled={!connected}
                        className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-green-300"
                    >
                        Send Ping
                    </button>
                    <button
                        onClick={fetchStats}
                        className="px-3 py-1 bg-purple-600 text-white rounded"
                    >
                        Fetch Stats
                    </button>
                </div>
            </div>

            {pingResponse && (
                <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-2">Last Ping Response</h2>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
                        {JSON.stringify(pingResponse, null, 2)}
                    </pre>
                </div>
            )}

            {stats && (
                <div className="mb-6 p-4 border rounded shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-2">Server Stats</h2>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
                        {JSON.stringify(stats, null, 2)}
                    </pre>
                </div>
            )}

            <div className="p-4 border rounded shadow-sm bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Log</h2>
                <div className="bg-gray-900 text-gray-100 p-3 rounded h-60 overflow-y-auto font-mono text-sm">
                    {logs.length === 0 ? (
                        <p className="text-gray-400">No logs yet...</p>
                    ) : (
                        logs.map((log, i) => <div key={i}>{log}</div>)
                    )}
                </div>
            </div>

            <div className="mt-6 p-4 border rounded shadow-sm bg-gray-50">
                <h2 className="text-lg font-semibold mb-2">Socket.IO Configuration</h2>
                <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
                    {JSON.stringify(SOCKET_CONFIG, null, 2)}
                </pre>
            </div>
        </main>
    );
}
