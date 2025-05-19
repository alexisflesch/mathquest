# Socket.IO Lobby Example

This example demonstrates how to connect to the lobby system in MathQuest and interact with other players.

```javascript
// Import Socket.IO client
import { io } from 'socket.io-client';

// Connect to Socket.IO server
const socket = io('http://your-server/api/socket.io', {
  transports: ['websocket'],
  query: {
    token: 'player-token-123',  // Player identification token
    role: 'player'              // Role (player or teacher)
  }
});

// Track connection status
socket.on('connect', () => {
  console.log('Connected to server with ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

// Join a lobby when user enters an access code
function joinLobby(accessCode, username, userId, avatarUrl = null) {
  socket.emit('join_lobby', {
    accessCode,
    username,
    userId,
    avatarUrl
  });
}

// Leave a lobby
function leaveLobby(accessCode) {
  socket.emit('leave_lobby', { accessCode });
}

// Get current participants in a lobby
function getParticipants(accessCode) {
  socket.emit('get_participants', { accessCode });
}

// Listen for lobby events
socket.on('participants_list', (data) => {
  console.log('Game name:', data.gameName);
  console.log('Current participants:', data.participants);
  
  // Update UI with participants
  updateParticipantsUI(data.participants);
});

socket.on('participant_joined', (data) => {
  console.log(`${data.username} joined the lobby`);
  // Maybe play a sound or show a notification
});

socket.on('participant_left', (data) => {
  console.log(`Player with ID ${data.id} left the lobby`);
  // Update UI accordingly
});

socket.on('room_left', (data) => {
  console.log(`You left the lobby for game ${data.accessCode}`);
  // Maybe navigate back to the main menu
});

socket.on('redirect_to_game', (data) => {
  console.log(`Game is starting! Redirecting to game ${data.accessCode}`);
  // Navigate to the game page
  navigateToGame(data.accessCode, data.gameUrl);
});

// Example usage
document.getElementById('join-button').addEventListener('click', () => {
  const accessCode = document.getElementById('access-code-input').value;
  const username = document.getElementById('username-input').value;
  // Assuming userId is stored in localStorage from previous registration
  const userId = localStorage.getItem('userId');
  
  joinLobby(accessCode, username, userId);
});

document.getElementById('leave-button').addEventListener('click', () => {
  const accessCode = document.getElementById('access-code-input').value;
  leaveLobby(accessCode);
});

// Helper functions
function updateParticipantsUI(participants) {
  const participantsList = document.getElementById('participants-list');
  participantsList.innerHTML = '';
  
  participants.forEach(participant => {
    const listItem = document.createElement('li');
    
    // Create avatar if available
    if (participant.avatarUrl) {
      const avatar = document.createElement('img');
      avatar.src = participant.avatarUrl;
      avatar.classList.add('avatar');
      listItem.appendChild(avatar);
    }
    
    // Add username
    const usernameSpan = document.createElement('span');
    usernameSpan.textContent = participant.username;
    listItem.appendChild(usernameSpan);
    
    participantsList.appendChild(listItem);
  });
}

function navigateToGame(accessCode, gameUrl) {
  // If gameUrl is provided, use it, otherwise construct one
  const url = gameUrl || `/game/${accessCode}`;
  window.location.href = url;
}
```

This example shows how to:
1. Connect to the Socket.IO server with authentication
2. Join and leave lobbies
3. Handle participant updates
4. Respond to game start events
5. Update the UI based on real-time events

Remember to adapt this code to your specific frontend framework (React, Vue, etc.) as needed.
