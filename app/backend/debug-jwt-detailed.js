const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// The exact token from the logs
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkYjRiNjYxNy1iOWEyLTQwZDctYmQ1Zi0yMDJiMGJmZmFkY2MiLCJ1c2VybmFtZSI6IkFsZXhpcyIsInJvbGUiOiJURUFDSEVSIiwiaWF0IjoxNzQ4OTgxMDg5LCJleHAiOjE3NDkwNjc0ODl9.j1gzSugGKUqjy1Rrth50w4G8hhN5c3lk0CkhzSpYZV8";

// The secret from environment
const secret = "test-secret-key-for-tests";

console.log('=== JWT DEBUG ANALYSIS ===');
console.log('Token:', token);
console.log('Secret:', secret);
console.log('Secret length:', secret.length);
console.log('Secret bytes:', Buffer.from(secret).toString('hex'));

// Decode without verification to see payload
try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('\n=== DECODED TOKEN (no verification) ===');
    console.log('Header:', decoded.header);
    console.log('Payload:', decoded.payload);
    console.log('Signature:', decoded.signature);
} catch (error) {
    console.log('Failed to decode token:', error.message);
}

// Try verification with the secret
console.log('\n=== VERIFICATION ATTEMPTS ===');

// Attempt 1: Direct verification
try {
    const verified = jwt.verify(token, secret);
    console.log('✅ Verification successful:', verified);
} catch (error) {
    console.log('❌ Verification failed:', error.message);
    console.log('Error defaultMode:', error.name);
}

// Attempt 2: Try with Buffer
try {
    const verified = jwt.verify(token, Buffer.from(secret));
    console.log('✅ Buffer verification successful:', verified);
} catch (error) {
    console.log('❌ Buffer verification failed:', error.message);
}

// Attempt 3: Manual signature verification
console.log('\n=== MANUAL SIGNATURE VERIFICATION ===');
const [header, payload, signature] = token.split('.');
const expectedSignature = jwt.sign(
    JSON.parse(Buffer.from(payload, 'base64').toString()),
    secret,
    { 
        header: JSON.parse(Buffer.from(header, 'base64').toString()),
        noTimestamp: true
    }
).split('.')[2];

console.log('Expected signature:', expectedSignature);
console.log('Actual signature:', signature);
console.log('Signatures match:', expectedSignature === signature);

// Check if token is expired
const payloadObj = JSON.parse(Buffer.from(payload, 'base64').toString());
const now = Math.floor(Date.now() / 1000);
console.log('\n=== TOKEN EXPIRY CHECK ===');
console.log('Current timestamp:', now);
console.log('Token exp:', payloadObj.exp);
console.log('Token iat:', payloadObj.iat);
console.log('Is expired:', now > payloadObj.exp);
console.log('Time until expiry:', payloadObj.exp - now, 'seconds');

// Try creating a new token with same payload and secret
console.log('\n=== CREATE NEW TOKEN TEST ===');
try {
    const newToken = jwt.sign(
        {
            userId: payloadObj.userId,
            username: payloadObj.username,
            role: payloadObj.role
        },
        secret,
        { expiresIn: '24h' }
    );
    console.log('New token created:', newToken);
    
    // Verify the new token
    const verifiedNew = jwt.verify(newToken, secret);
    console.log('✅ New token verification successful:', verifiedNew);
} catch (error) {
    console.log('❌ New token creation/verification failed:', error.message);
}
