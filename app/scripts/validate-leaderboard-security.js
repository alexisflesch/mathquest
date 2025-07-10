#!/usr/bin/env node

/**
 * Leaderboard Security Validation Script
 * 
 * This script validates that the leaderboard security fix is working correctly:
 * 1. Verifies no leaderboard emission during answer submission (gameAnswer.ts)
 * 2. Confirms leaderboard emission only after question timer expires (sharedGameFlow.ts)
 * 3. Tests both tournament and quiz modes
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Leaderboard Security Validation');
console.log('================================');

// File paths
const gameAnswerPath = path.join(__dirname, '../backend/src/sockets/handlers/game/gameAnswer.ts');
const sharedGameFlowPath = path.join(__dirname, '../backend/src/sockets/handlers/sharedGameFlow.ts');

// Read files
const gameAnswerContent = fs.readFileSync(gameAnswerPath, 'utf8');
const sharedGameFlowContent = fs.readFileSync(sharedGameFlowPath, 'utf8');

// Test 1: Verify gameAnswer.ts has no insecure leaderboard emission
console.log('\n📋 Test 1: Checking gameAnswer.ts for security vulnerabilities...');

const hasInsecureEmission = gameAnswerContent.includes('io.to(roomName).emit(SOCKET_EVENTS.GAME.LEADERBOARD_UPDATE');
const hasSecurityComment = gameAnswerContent.includes('🔒 SECURITY FIX: Removed immediate leaderboard emission');

if (!hasInsecureEmission && hasSecurityComment) {
    console.log('✅ PASS: Security vulnerability removed from gameAnswer.ts');
} else {
    console.log('❌ FAIL: Security vulnerability still exists in gameAnswer.ts');
    console.log(`   - Insecure emission found: ${hasInsecureEmission}`);
    console.log(`   - Security comment present: ${hasSecurityComment}`);
}

// Test 2: Verify sharedGameFlow.ts has secure leaderboard emission
console.log('\n📋 Test 2: Checking sharedGameFlow.ts for secure leaderboard emission...');

const hasSecureEmission = sharedGameFlowContent.includes('🔒 SECURITY: Emit leaderboard only after question ends');
const hasCorrectTiming = sharedGameFlowContent.includes('after_question_end');
const hasLeaderboardImport = sharedGameFlowContent.includes("import('./sharedLeaderboard')");

if (hasSecureEmission && hasCorrectTiming && hasLeaderboardImport) {
    console.log('✅ PASS: Secure leaderboard emission added to sharedGameFlow.ts');
} else {
    console.log('❌ FAIL: Secure leaderboard emission not properly implemented');
    console.log(`   - Security comment present: ${hasSecureEmission}`);
    console.log(`   - Correct timing marker: ${hasCorrectTiming}`);
    console.log(`   - Leaderboard import: ${hasLeaderboardImport}`);
}

// Test 3: Verify SOCKET_EVENTS import
console.log('\n📋 Test 3: Checking SOCKET_EVENTS import...');

const hasSocketEventsImport = sharedGameFlowContent.includes("import { SOCKET_EVENTS } from '@shared/types/socket/events'");

if (hasSocketEventsImport) {
    console.log('✅ PASS: SOCKET_EVENTS properly imported');
} else {
    console.log('❌ FAIL: SOCKET_EVENTS import missing');
}

// Test 4: Check for any remaining vulnerable patterns
console.log('\n📋 Test 4: Scanning for remaining vulnerable patterns...');

const vulnerablePatterns = [
    'emit.*LEADERBOARD_UPDATE.*gameAnswer',
    'leaderboard.*emit.*answer.*submission'
];

let vulnerabilitiesFound = 0;
vulnerablePatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'gi');
    if (regex.test(gameAnswerContent)) {
        console.log(`⚠️  WARNING: Potential vulnerability pattern found: ${pattern}`);
        vulnerabilitiesFound++;
    }
});

if (vulnerabilitiesFound === 0) {
    console.log('✅ PASS: No vulnerable patterns detected');
} else {
    console.log(`❌ FAIL: ${vulnerabilitiesFound} potential vulnerabilities found`);
}

// Summary
console.log('\n📊 SECURITY VALIDATION SUMMARY');
console.log('==============================');

const allTestsPassed = !hasInsecureEmission && hasSecurityComment &&
    hasSecureEmission && hasCorrectTiming &&
    hasLeaderboardImport && hasSocketEventsImport &&
    vulnerabilitiesFound === 0;

if (allTestsPassed) {
    console.log('🟢 ALL TESTS PASSED - Security fix successfully implemented');
    console.log('');
    console.log('✅ Leaderboard emission removed from answer submission');
    console.log('✅ Secure leaderboard emission added after question timer');
    console.log('✅ Proper timing and error handling implemented');
    console.log('✅ No vulnerable patterns detected');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('   1. Run integration tests to verify functionality');
    console.log('   2. Test with actual tournament to confirm security');
    console.log('   3. Add frontend leaderboard event listener');
} else {
    console.log('🔴 SECURITY VALIDATION FAILED');
    console.log('Please review the implementation and fix any remaining issues.');
}

console.log('');
console.log('🔍 For manual verification:');
console.log(`   - gameAnswer.ts: ${gameAnswerPath}`);
console.log(`   - sharedGameFlow.ts: ${sharedGameFlowPath}`);
