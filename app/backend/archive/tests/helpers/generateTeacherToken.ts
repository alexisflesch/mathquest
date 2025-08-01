import * as jwt from 'jsonwebtoken';

export function generateTeacherToken(userId: string, username: string = 'teacher', role: string = 'TEACHER') {
    const payload = { userId, username, role };
    const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}
