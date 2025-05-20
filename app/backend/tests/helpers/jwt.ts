import jwt from 'jsonwebtoken';

export function generateStudentToken(studentId: string, username: string = 'student') {
    const payload = { studentId, username };
    const secret = process.env.JWT_SECRET || 'mathquest_default_secret';
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}
export default generateStudentToken;
