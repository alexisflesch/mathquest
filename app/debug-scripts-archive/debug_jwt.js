const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load environment variables like the backend does
require('dotenv').config({ path: './backend/.env' });

console.log('=== JWT Debug Test ===');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('Secret length:', process.env.JWT_SECRET?.length || 0);

// Create a test token using the same logic as userService
const testPayload = {
    userId: 'test-user-123',
    username: 'testuser',
    role: 'TEACHER'
};

const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
console.log('Secret being used:', secret);

try {
    // Sign the token
    const token = jwt.sign(testPayload, secret, { expiresIn: '24h' });
    console.log('Token created successfully');
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
    // Immediately verify the same token
    console.log('\n=== Verification Test ===');
    const decoded = jwt.verify(token, secret);
    console.log('Token verified successfully!');
    console.log('Decoded payload:', decoded);
    
    // Test with wrong secret
    console.log('\n=== Wrong Secret Test ===');
    try {
        jwt.verify(token, 'wrong-secret');
        console.log('ERROR: Should have failed with wrong secret');
    } catch (err) {
        console.log('Correctly failed with wrong secret:', err.message);
    }
    
} catch (error) {
    console.error('Error in JWT operations:', error.message);
}
