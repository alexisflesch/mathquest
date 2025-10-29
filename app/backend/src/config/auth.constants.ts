/**
 * Authentication and session configuration constants
 */

/**
 * JWT token expiration time
 * 30 days - balances security with user convenience for educational platform
 */
export const JWT_EXPIRES_IN = '30d';

/**
 * Cookie max age in milliseconds
 * 30 days - matches JWT expiration to avoid cookie outliving the token
 */
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

/**
 * Standard cookie options for auth tokens
 */
export const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE
};

/**
 * Password reset token expiration
 */
export const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000; // 1 hour in ms

/**
 * Email verification token expiration
 */
export const EMAIL_VERIFICATION_TOKEN_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours in ms
