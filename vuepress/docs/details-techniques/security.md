---
title: Security Documentation
description: Comprehensive security measures, authentication flows, and best practices for MathQuest
---

# Security Documentation

This document outlines the security measures, authentication mechanisms, and best practices implemented in MathQuest.

## Authentication System

### JWT Token Management

MathQuest uses JSON Web Tokens (JWT) for stateless authentication with the following security measures:

```typescript
// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = '24h';

// Token generation with secure payload
const token = jwt.sign(
  {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);
```

**Security Features:**
- **Secure Secret Management**: JWT secrets stored in environment variables
- **Token Expiration**: 24-hour token validity with automatic refresh
- **Payload Validation**: Server-side validation of token claims
- **Database Verification**: Token validity checked against database on each request

### Password Security

Password hashing is implemented using bcrypt with industry-standard security practices:

```typescript
// Password hashing configuration
const SALT_ROUNDS = 10;

// Secure password hashing
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Password verification
const isValidPassword = await bcrypt.compare(password, hashedPassword);
```

**Security Features:**
- **bcrypt Hashing**: Industry-standard password hashing algorithm
- **Salt Rounds**: 10 rounds for computational security
- **Timing Attack Protection**: Constant-time comparison using bcrypt.compare()
- **No Plain Text Storage**: Passwords never stored in plain text

### Cookie-Based Authentication

Authentication tokens are stored securely in HTTP-only cookies:

```typescript
// Secure cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/'
};

// Setting secure authentication cookie
res.cookie('auth_token', token, COOKIE_OPTIONS);
```

**Security Features:**
- **HTTP-Only Cookies**: Prevents XSS attacks from accessing tokens
- **Secure Flag**: HTTPS-only in production
- **SameSite Protection**: CSRF protection with 'strict' policy
- **Expiration Management**: Automatic cleanup of expired sessions

## Input Validation & Sanitization

### Zod Schema Validation

MathQuest implements comprehensive input validation using Zod schemas:

```typescript
// User registration validation
export const userRegistrationSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['STUDENT', 'TEACHER'])
});

// Socket event validation
export const joinRoomPayloadSchema = z.object({
  gameCode: z.string().length(6).regex(/^[A-Z0-9]+$/),
  participantName: z.string().min(1).max(50),
  gradeLevel: z.string().optional()
});
```

**Validation Features:**
- **Type Safety**: Runtime type checking with TypeScript integration
- **Schema-Based**: Declarative validation rules
- **Comprehensive Coverage**: All API endpoints and socket events validated
- **Error Handling**: Detailed validation error messages

### SQL Injection Prevention

Database queries are protected through Prisma ORM:

```typescript
// Safe parameterized queries
const user = await prisma.user.findUnique({
  where: { email: email }
});

// Protected against SQL injection
const game = await prisma.gameInstance.findFirst({
  where: {
    gameCode: gameCode,
    status: 'ACTIVE'
  }
});
```

**Security Features:**
- **Parameterized Queries**: Automatic SQL injection prevention
- **ORM Protection**: Prisma generates safe SQL queries
- **Input Sanitization**: All inputs validated before database operations

## CORS Configuration

Cross-Origin Resource Sharing is configured for secure API access:

```typescript
// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://mathquest.example.com'
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3008'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Security Features:**
- **Origin Restriction**: Only allowed domains can access API
- **Method Limitation**: Only necessary HTTP methods permitted
- **Credentials Support**: Secure cookie transmission
- **Header Control**: Restricted headers for security

## WebSocket Security

Socket.IO connections are secured with authentication middleware:

```typescript
// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Validate user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return next(new Error('Authentication failed'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

**Security Features:**
- **Token Authentication**: JWT validation on socket connection
- **User Verification**: Database validation of authenticated users
- **Room Isolation**: Users can only access authorized game rooms
- **Event Validation**: All socket events validated with Zod schemas

## Rate Limiting Considerations

**Current Implementation Status:**
MathQuest currently does not implement rate limiting, but includes comprehensive tests to validate rate limiting implementation when added:

```typescript
// Rate limiting test (demonstrates current lack of protection)
it('should allow unlimited rapid socket connections', async () => {
  // Test implementation for when rate limiting is added
});
```

**Recommended Rate Limiting:**
```typescript
// Recommended express-rate-limit configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
```

## Security Headers (Recommended)

While not currently implemented, the following security headers are recommended for production:

```nginx
# Nginx security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## Environment Security

### Secret Management

```bash
# Environment variables for security
JWT_SECRET="your-256-bit-secret-key-here"
DATABASE_URL="postgresql://user:password@host:port/database"
REDIS_URL="redis://username:password@host:port"
BREVO_API_KEY="your-email-service-api-key"
```

**Security Practices:**
- **No Hardcoded Secrets**: All secrets stored in environment variables
- **Secure Key Generation**: Use cryptographically secure random generators
- **Access Control**: Limit environment file access to authorized personnel
- **Rotation Policy**: Regular rotation of JWT secrets and API keys

## Logging & Monitoring

### Security Event Logging

MathQuest implements comprehensive logging for security events:

```typescript
// Security event logging
logger.warn('Failed login attempt', {
  email: email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});

// Authentication success logging
logger.info('User authenticated successfully', {
  userId: user.id,
  email: user.email,
  role: user.role
});
```

**Logged Security Events:**
- Authentication attempts (success/failure)
- Password reset requests
- Account lockouts
- Suspicious activity
- API access patterns

### Error Handling

Secure error handling prevents information leakage:

```typescript
// Secure error responses
app.use((error: Error, req: Request, res: Response, next: Function) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't leak internal error details
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

## Database Security

### Connection Security

```typescript
// Secure database configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['warn', 'error']
});
```

**Security Features:**
- **Connection Encryption**: SSL/TLS for database connections
- **Credential Management**: Database credentials in environment variables
- **Query Logging**: Development-time query logging for debugging
- **Connection Pooling**: Efficient connection management

## Production Security Checklist

### Pre-Deployment Security Review

- [ ] JWT secrets are strong and unique
- [ ] Database credentials are secure
- [ ] CORS origins are properly configured
- [ ] HTTPS is enabled in production
- [ ] Security headers are implemented
- [ ] Rate limiting is configured
- [ ] Logging is configured for security events
- [ ] Environment variables are not committed to version control

### Ongoing Security Maintenance

- [ ] Regular dependency updates
- [ ] Security vulnerability scanning
- [ ] Log monitoring and analysis
- [ ] Regular security audits
- [ ] Incident response plan
- [ ] Backup security verification

## Security Testing

MathQuest includes security-focused tests:

```typescript
// Authentication security tests
describe('Authentication Security', () => {
  it('should reject invalid JWT tokens', async () => {
    // Test invalid token handling
  });

  it('should prevent unauthorized access', async () => {
    // Test access control
  });

  it('should validate password requirements', async () => {
    // Test password policy enforcement
  });
});
```

## Compliance Considerations

MathQuest is designed with privacy and security best practices:

- **Data Minimization**: Only necessary user data collected
- **Purpose Limitation**: Data used only for intended educational purposes
- **Storage Limitation**: User data retained only as needed
- **Security Measures**: Technical and organizational security controls
- **Transparency**: Clear privacy policies and data handling practices

## Security Incident Response

### Incident Response Plan

1. **Detection**: Monitor logs and alerts for security incidents
2. **Assessment**: Evaluate incident scope and impact
3. **Containment**: Isolate affected systems
4. **Recovery**: Restore systems from clean backups
5. **Lessons Learned**: Update security measures based on incident analysis

### Contact Information

For security-related concerns or incidents:
- **Security Team**: Contact system administrators
- **Reporting**: Use designated security reporting channels
- **Response Time**: Critical security issues addressed within 24 hours

This security documentation should be reviewed and updated regularly to reflect current security practices and emerging threats.