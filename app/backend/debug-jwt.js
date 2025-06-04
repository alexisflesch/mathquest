const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYTlkNDNjMi1jNDRlLTQxYjItOGUzMi1lMGE0MTA2MjEwN2MiLCJ1c2VybmFtZSI6InRlc3R0ZWFjaGVyIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3NDg3OTgxMjUsImV4cCI6MTc0ODg4NDUyNX0.BXn8jw_e1I9MKZcSgdwiS0cdXh9XTcDvj2CgtC0hu6o";
const secret = process.env.JWT_SECRET || 'mathquest_default_secret';

console.log('JWT Secret:', secret);
console.log('Token:', token);

try {
    const decoded = jwt.verify(token, secret);
    console.log('Decoded JWT:', decoded);
    console.log('Token is valid!');
} catch (error) {
    console.error('JWT verification failed:', error.message);
}
