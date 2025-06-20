#!/usr/bin/env node
/**
 * Socket Event Names Fixer
 * 
 * This script automatically replaces hardcoded socket event names 
 * with SOCKET_EVENTS constants in frontend files.
 */

const fs = require('fs');
const path = require('path');

// Event mappings from hardcoded strings to SOCKET_EVENTS constants
const eventMappings = {
    // Game events
    'game_joined': 'SOCKET_EVENTS.GAME.GAME_JOINED',
    'game_question': 'SOCKET_EVENTS.GAME.GAME_QUESTION',
    'game_error': 'SOCKET_EVENTS.GAME.GAME_ERROR',
    'game_answer': 'SOCKET_EVENTS.GAME.GAME_ANSWER',
    'join_game': 'SOCKET_EVENTS.GAME.JOIN_GAME',
    'timer_update': 'SOCKET_EVENTS.GAME.TIMER_UPDATE',
    'game_timer_updated': 'SOCKET_EVENTS.GAME.GAME_TIMER_UPDATED',
    'game_state_update': 'SOCKET_EVENTS.GAME.GAME_UPDATE',
    'answer_received': 'SOCKET_EVENTS.GAME.ANSWER_RECEIVED',
    'correct_answers': 'SOCKET_EVENTS.GAME.CORRECT_ANSWERS',
    'feedback': 'SOCKET_EVENTS.GAME.FEEDBACK',
    'game_ended': 'SOCKET_EVENTS.GAME.GAME_ENDED',
    'game_already_played': 'SOCKET_EVENTS.GAME.GAME_ALREADY_PLAYED',
    'request_next_question': 'SOCKET_EVENTS.GAME.REQUEST_NEXT_QUESTION',

    // Teacher events
    'quiz_timer_action': 'SOCKET_EVENTS.TEACHER.TIMER_ACTION',
    'join_dashboard': 'SOCKET_EVENTS.TEACHER.JOIN_DASHBOARD',
    'set_question': 'SOCKET_EVENTS.TEACHER.SET_QUESTION',
    'pause_timer': 'SOCKET_EVENTS.TEACHER.PAUSE_TIMER',
    'start_timer': 'SOCKET_EVENTS.TEACHER.START_TIMER',
    'end_game': 'SOCKET_EVENTS.TEACHER.END_GAME',
    'lock_answers': 'SOCKET_EVENTS.TEACHER.LOCK_ANSWERS',

    // Projector events
    'join_projection': 'SOCKET_EVENTS.PROJECTOR.JOIN_PROJECTION',
    'leave_projection': 'SOCKET_EVENTS.PROJECTOR.LEAVE_PROJECTION',

    // Lobby events
    'join_lobby': 'SOCKET_EVENTS.LOBBY.JOIN_LOBBY',
    'leave_lobby': 'SOCKET_EVENTS.LOBBY.LEAVE_LOBBY',
    'get_participants': 'SOCKET_EVENTS.LOBBY.GET_PARTICIPANTS',

    // Connection events
    'connect': 'SOCKET_EVENTS.CONNECT',
    'disconnect': 'SOCKET_EVENTS.DISCONNECT',
    'connect_error': 'SOCKET_EVENTS.CONNECT_ERROR'
};

function fixHardcodedEventNames(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if SOCKET_EVENTS is already imported
    const hasSocketEventsImport = content.includes('SOCKET_EVENTS');

    // Add import if not present
    if (!hasSocketEventsImport) {
        const importLine = "import { SOCKET_EVENTS } from '@shared/types/socket/events';\n";

        // Find the best place to insert the import
        const existingImports = content.match(/import.*from.*;\n/g);
        if (existingImports && existingImports.length > 0) {
            const lastImport = existingImports[existingImports.length - 1];
            const lastImportIndex = content.lastIndexOf(lastImport);
            const insertIndex = lastImportIndex + lastImport.length;
            content = content.slice(0, insertIndex) + importLine + content.slice(insertIndex);
            modified = true;
        }
    }

    // Replace hardcoded event names
    for (const [hardcoded, constant] of Object.entries(eventMappings)) {
        // Replace in socket.on() calls
        const onPattern = new RegExp(`socket\\.on\\(\\s*['"\`]${hardcoded}['"\`]\\s*,`, 'g');
        if (onPattern.test(content)) {
            content = content.replace(onPattern, `socket.on(${constant},`);
            modified = true;
        }

        // Replace in socket.emit() calls
        const emitPattern = new RegExp(`socket\\.emit\\(\\s*['"\`]${hardcoded}['"\`]\\s*,`, 'g');
        if (emitPattern.test(content)) {
            content = content.replace(emitPattern, `socket.emit(${constant},`);
            modified = true;
        }

        // Replace in validationMiddleware.emit() calls
        const middlewarePattern = new RegExp(`validationMiddleware\\.emit\\(\\s*['"\`]${hardcoded}['"\`]\\s*,`, 'g');
        if (middlewarePattern.test(content)) {
            content = content.replace(middlewarePattern, `validationMiddleware.emit(${constant},`);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed hardcoded event names in: ${filePath}`);
    }

    return modified;
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    let totalFixed = 0;

    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            totalFixed += processDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            if (fixHardcodedEventNames(filePath)) {
                totalFixed++;
            }
        }
    }

    return totalFixed;
}

// Main execution
const frontendDir = path.join(__dirname, '../../../frontend/src');
console.log('🔧 Starting hardcoded event names fix...');
console.log(`📂 Processing directory: ${frontendDir}`);

const fixedFiles = processDirectory(frontendDir);

console.log(`\n✅ Complete! Fixed hardcoded event names in ${fixedFiles} files.`);
console.log('🔍 Run the socket payload validator again to see progress.');
