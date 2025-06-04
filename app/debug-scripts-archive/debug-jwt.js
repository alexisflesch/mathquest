const jwt = require('jsonwebtoken');

const secret = 'eb4bYdvT7e7!fKax7DuBW#wNevy6%P9!Lqu!V5@wqV*hgKztU&';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYTlkNDNjMi1jNDRlLTQxYjItOGUzMi1lMGE0MTA2MjEwN2MiLCJ1c2VybmFtZSI6InRlc3R0ZWFjaGVyIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3NDg3OTgxMjUsImV4cCI6MTc0ODg4NDUyNX0.BXn8jw_e1I9MKZcSgdwiS0cdXh9XTcDvj2CgtC0hu6o';

console.log('Testing JWT...');
console.log('Secret:', secret);
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
