require('dotenv').config({ path: './.env' });
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYTlkNDNjMi1jNDRlLTQxYjItOGUzMi1lMGE0MTA2MjEwN2MiLCJ1c2VybmFtZSI6InRlc3R0ZWFjaGVyIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3NDg3OTk5MjUsImV4cCI6MTc0ODg4NjMyNX0.333CYbB7w_B_RsKz6YXZb3ymY0U2cAxu5ZAfrg9Vuzo';

console.log('Testing NEW JWT token...');
console.log('JWT Secret:', secret);
console.log('Token:', token);

try {
    // First decode without verification
    const decodedUnverified = jwt.decode(token);
    console.log('\nDecoded (unverified):', JSON.stringify(decodedUnverified, null, 2));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    console.log('Current timestamp:', now);
    console.log('Token expires at:', decodedUnverified.exp);
    console.log('Is expired?', decodedUnverified.exp < now);

    // Try verification
    const decoded = jwt.verify(token, secret);
    console.log('\nJWT verification successful!');
    console.log('Verified payload:', JSON.stringify(decoded, null, 2));

} catch (error) {
    console.error('\nJWT verification failed:', error.message);
    console.error('Error details:', error);
}
