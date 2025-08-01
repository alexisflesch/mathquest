import * as jwt from 'jsonwebtoken';

export function generateStudentToken(userId: string, username: string = 'student', role: string = 'STUDENT') {
    const payload = { userId, username, role };
    const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}
export default generateStudentToken;
