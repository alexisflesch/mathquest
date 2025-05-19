// Example client code to connect to the MathQuest Socket.IO lobby system

import { io } from "socket.io-client";

/**
 * Create a connection to the MathQuest Socket.IO server
 * @param baseUrl - The base URL of the server (e.g., "http://localhost:3000")
 * @param token - Authentication token (for teachers) or null for player-only auth
 * @param userId - Player ID (required for player connections)
 */
export function createMathQuestSocketConnection(baseUrl, token = null, userId = null) {
    const socket = io(`${baseUrl}`, {
        path: "/api/socket.io",
        autoConnect: false,
        transports: ["websocket", "polling"],
        // Set auth data for authentication middleware
        auth: {
            token,
            userId
        }
    });

    // Handle connection events
    socket.on("connect", () => {
        console.log("Connected to MathQuest server:", socket.id);
    });

    socket.on("connect_error", (error) => {
        console.error("Connection error:", error.message);
    });

    socket.on("connection_established", (data) => {
        console.log("Connection established:", data);
    });

    socket.on("disconnect", (reason) => {
        console.log("Disconnected:", reason);
    });

    return socket;
}

/**
 * Join a game lobby
 * @param socket - Socket.IO connection
 * @param accessCode - Game access code
 * @param userId - Player ID
 * @param username - Player display name
 * @param avatarUrl - URL to player's avatar image (optional)
 */
export function joinGameLobby(socket, accessCode, userId, username, avatarUrl = null) {
    return new Promise((resolve, reject) => {
        // Set a timeout to reject the promise if no response within 5 seconds
        const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for lobby join response"));
        }, 5000);

        // Handle successful lobby join
        const handleSuccess = (data) => {
            clearTimeout(timeout);
            socket.off("lobby_error", handleError);
            resolve(data);
        };

        // Handle error during lobby join
        const handleError = (error) => {
            clearTimeout(timeout);
            socket.off("participants_list", handleSuccess);
            reject(error);
        };

        // Listen for responses
        socket.once("participants_list", handleSuccess);
        socket.once("lobby_error", handleError);

        // Emit join lobby event
        socket.emit("join_lobby", {
            accessCode,
            userId,
            username,
            avatarUrl
        });

        // Also listen for game started events
        socket.on("redirect_to_game", (data) => {
            console.log("Game started! Redirecting to game:", data);
        });

        // Listen for participants joining
        socket.on("participant_joined", (participant) => {
            console.log("Participant joined:", participant);
        });

        // Listen for participants leaving
        socket.on("participant_left", (data) => {
            console.log("Participant left:", data);
        });
    });
}

/**
 * Leave a game lobby
 * @param socket - Socket.IO connection
 * @param accessCode - Game access code
 */
export function leaveGameLobby(socket, accessCode) {
    socket.emit("leave_lobby", { accessCode });
}

/**
 * Get current participants in a lobby
 * @param socket - Socket.IO connection
 * @param accessCode - Game access code
 * @returns Promise that resolves with participants list
 */
export function getLobbyParticipants(socket, accessCode) {
    return new Promise((resolve, reject) => {
        // Set a timeout to reject the promise if no response within 3 seconds
        const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for participants list"));
        }, 3000);

        // Handle response
        socket.once("participants_list", (data) => {
            clearTimeout(timeout);
            resolve(data);
        });

        // Emit get participants event
        socket.emit("get_participants", { accessCode });
    });
}

/**
 * Usage example:
 * 
 * // Create socket connection as a player
 * const socket = createMathQuestSocketConnection("http://localhost:3000", null, "player-123");
 * socket.connect();
 * 
 * // Join a game lobby
 * joinGameLobby(socket, "ABC123", "player-123", "John Doe", "https://example.com/avatar.jpg")
 *   .then(response => {
 *     console.log("Joined lobby successfully:", response);
 *   })
 *   .catch(error => {
 *     console.error("Failed to join lobby:", error);
 *   });
 * 
 * // Later, leave the lobby
 * leaveGameLobby(socket, "ABC123");
 * 
 * // Or disconnect entirely
 * socket.disconnect();
 */
