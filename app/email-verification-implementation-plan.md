# Email Verification Implementation Plan

## Overview

This plan details the implementation of email verification for the MathQuest application using Brevo (formerly Sendinblue) as the email service provider. The implementation will cover two main scenarios:

1. **User Registration Verification**: Verify email addresses during new user registration
2. **Password Reset Flow**: Secure password reset via email verification

## Current State Analysis

### Existing Infrastructure
- **Database Schema**: `User` model has `resetToken` and `resetTokenExpiresAt` fields for password reset
- **Password Reset**: Partially implemented but only generates tokens (TODO comment indicates missing email service)
- **Authentication Flow**: Supports guest → student/teacher upgrade, direct registration, and login
- **Environment Variables**: Basic setup with JWT secrets, admin passwords
- **Frontend Auth System**: Complete with React contexts and API routes

### Missing Components
- Email service integration
- Email verification tokens for registration
- Email templates for verification and password reset
- Environment variables for email configuration
- Database fields for email verification status

## Implementation Strategy

### Phase 1: Database Schema Updates

#### 1.1 Add Email Verification Fields to User Model
```prisma
model User {
  // ... existing fields
  emailVerified       Boolean?         @default(false) @map("email_verified")
  emailVerificationToken String?       @map("email_verification_token")
  emailVerificationTokenExpiresAt DateTime? @map("email_verification_token_expires_at")
  // ... rest of existing fields
}
```

#### 1.2 Migration Script
- Create Prisma migration to add new fields
- Set `emailVerified = true` for existing users with emails (grandfather existing users)
- Update database schema

### Phase 2: Email Service Infrastructure

#### 2.1 Environment Variables Setup
Add to `backend/example.env` and documentation:
```bash
# Email Configuration (Brevo)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=MathQuest

# Domain configuration
APP_DOMAIN=yourdomain.com
APP_NAME=MathQuest
FRONTEND_URL=https://yourdomain.com

# Email verification settings
EMAIL_VERIFICATION_TOKEN_EXPIRY=24h
PASSWORD_RESET_TOKEN_EXPIRY=1h
```

#### 2.2 Email Service Implementation
Create `backend/src/core/services/emailService.ts`:
```typescript
export class EmailService {
  private brevoClient: any;
  
  constructor() {
    // Initialize Brevo client with API key
  }
  
  async sendVerificationEmail(email: string, token: string, username: string): Promise<void>
  async sendPasswordResetEmail(email: string, token: string, username: string): Promise<void>
  async sendWelcomeEmail(email: string, username: string): Promise<void>
  
  private async sendEmail(templateData: EmailTemplate): Promise<void>
}
```

#### 2.3 Email Templates
Create email templates for:
- **Email Verification**: Welcome message with verification link
- **Password Reset**: Security-focused reset instructions
- **Welcome Email**: Post-verification welcome (optional)

Templates should be:
- Responsive HTML design
- Multi-language support (French/English)
- Branded with MathQuest styling
- Include security best practices

### Phase 3: Backend API Updates

#### 3.1 User Service Enhancements
Update `backend/src/core/services/userService.ts`:

```typescript
// New methods to add:
async sendEmailVerification(userId: string): Promise<void>
async verifyEmail(token: string): Promise<boolean>
async resendEmailVerification(email: string): Promise<void>
async generateEmailVerificationToken(userId: string): Promise<string>
```

#### 3.2 Auth API Route Updates

**Update Registration Flow** (`/api/v1/auth/register`):
- Generate email verification token for new users
- Send verification email automatically
- Set `emailVerified = false` for new registrations
- Return success but indicate email verification required

**New Email Verification Routes**:
```typescript
// POST /api/v1/auth/verify-email
// Body: { token: string }
// Verifies email and sets emailVerified = true

// POST /api/v1/auth/resend-verification
// Body: { email: string }
// Resends verification email if not already verified

// GET /api/v1/auth/verify-email/:token
// Query param verification (for email links)
```

**Update Password Reset Flow** (`/api/v1/auth/reset-password`):
- Use existing token generation but add email sending
- Update email templates and verification flow

#### 3.3 Middleware Updates

**Email Verification Middleware**:
```typescript
// middleware/emailVerification.ts
export const requireEmailVerification = (req, res, next) => {
  // Check if user's email is verified for protected actions
  // Allow bypassing for certain routes (like resend verification)
}
```

**Update Existing Auth Middleware**:
- Include email verification status in auth responses
- Handle unverified email scenarios appropriately

### Phase 4: Frontend Integration

#### 4.1 Auth Context Updates
Update `frontend/src/contexts/AuthContext.tsx`:
```typescript
interface User {
  // ... existing fields
  emailVerified?: boolean;
}

// New methods:
verifyEmail(token: string): Promise<void>
resendVerificationEmail(): Promise<void>
requestPasswordReset(email: string): Promise<void>
```

#### 4.2 New UI Components

**Email Verification Banner**:
```typescript
// components/EmailVerificationBanner.tsx
// Shows when user is logged in but email not verified
// Allows resending verification email
```

**Verification Pages**:
```typescript
// app/verify-email/page.tsx - Email verification success/error
// app/verify-email/[token]/page.tsx - Direct token verification
// app/resend-verification/page.tsx - Resend verification email
```

**Password Reset Updates**:
```typescript
// Update existing app/teacher/reset-password/page.tsx
// Add app/reset-password/page.tsx for students
// Add app/reset-password/confirm/[token]/page.tsx
```

#### 4.3 User Experience Flow

**Registration Flow**:
1. User registers → receives "Check your email" message
2. User clicks email link → redirected to verification success page
3. User can now access full features

**Unverified User Experience**:
1. Show verification banner on dashboard/profile
2. Limit certain features until email verified
3. Provide easy resend verification option

### Phase 5: Security & Validation

#### 5.1 Security Considerations
- **Token Security**: Cryptographically secure random tokens (32+ bytes)
- **Rate Limiting**: Limit verification email sends (max 3 per hour per email)
- **Expiration**: 24h for verification, 1h for password reset
- **HTTPS Only**: All email links must use HTTPS
- **SQL Injection Prevention**: Use parameterized queries
- **CSRF Protection**: Include CSRF tokens in forms

#### 5.2 Email Validation
- Validate email format on both frontend and backend
- Check for disposable email domains (optional)
- Normalize email addresses (lowercase, trim)
- Prevent duplicate email registrations

#### 5.3 Error Handling
- Graceful email service failures (log but don't block registration)
- Clear error messages for users
- Retry mechanisms for transient email failures
- Monitoring and alerting for email service issues

### Phase 6: Testing & Documentation

#### 6.1 Testing Strategy
**Unit Tests**:
- Email service methods
- Token generation and validation
- User service email verification methods

**Integration Tests**:
- Full registration flow with email verification
- Password reset flow end-to-end
- Email service integration (with mocking)

**E2E Tests**:
- User registration → email verification → login flow
- Password reset complete flow
- Error scenarios (expired tokens, invalid emails)

#### 6.2 Documentation Updates
- API documentation for new endpoints
- Environment variable documentation
- Email template customization guide
- Troubleshooting guide for email issues
- Migration guide for existing users

## Implementation Timeline

### Week 1: Foundation
- [ ] Database schema updates and migration
- [ ] Environment variables setup
- [ ] Email service infrastructure
- [ ] Basic email templates

### Week 2: Backend Implementation
- [ ] User service email methods
- [ ] Auth API route updates
- [ ] Email verification endpoints
- [ ] Security middleware

### Week 3: Frontend Integration
- [ ] Auth context updates
- [ ] Email verification components
- [ ] User interface updates
- [ ] Password reset flow updates

### Week 4: Testing & Polish
- [ ] Unit and integration tests
- [ ] E2E testing
- [ ] Documentation updates
- [ ] Performance optimization
- [ ] Security audit

## Configuration Details

### Brevo Integration
```typescript
// Example Brevo setup
const brevo = require('@sendinblue/client');
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
```

### Email Templates Structure
```
backend/src/templates/emails/
├── verification/
│   ├── verification.html
│   └── verification.text
├── password-reset/
│   ├── password-reset.html
│   └── password-reset.text
└── welcome/
    ├── welcome.html
    └── welcome.text
```

### Environment Variables per Environment
```bash
# Development
BREVO_API_KEY=dev_key
APP_DOMAIN=localhost:3008
FRONTEND_URL=http://localhost:3008

# Production
BREVO_API_KEY=prod_key
APP_DOMAIN=yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

## Risk Mitigation

### Email Delivery Issues
- Implement retry mechanisms with exponential backoff
- Use multiple email providers (fallback to SMTP)
- Monitor delivery rates and bounce rates
- Provide alternative verification methods if needed

### User Experience Issues
- Clear instructions in verification emails
- Obvious resend verification options
- Graceful handling of expired tokens
- Mobile-friendly email templates

### Security Risks
- Regular security audits of email verification flow
- Monitor for token brute force attempts
- Implement proper rate limiting
- Use HTTPS-only for all verification links

## Success Metrics

### Technical Metrics
- Email delivery rate > 95%
- Verification completion rate > 80%
- Password reset success rate > 90%
- Page load times remain under 2s

### User Experience Metrics
- Reduced support tickets about authentication
- Improved account security (fewer compromised accounts)
- Higher user engagement post-verification
- Lower bounce rate on authentication pages

## Post-Implementation

### Monitoring
- Set up email delivery monitoring
- Track verification rates and user flows
- Monitor error rates and response times
- Alert on email service failures

### Maintenance
- Regular review of email templates
- Update security practices as needed
- Monitor for new email provider features
- Regular backup of email configuration

This plan provides a comprehensive roadmap for implementing robust email verification in the MathQuest application while maintaining security, user experience, and system reliability.
