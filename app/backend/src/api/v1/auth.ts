import express, { Request, Response } from 'express';
import { optionalAuth, teacherAuth } from '@/middleware/auth';
import { validateRequestBody } from '@/middleware/validation';
import { UserService } from '@/core/services/userService';
import { UserRole } from '@/db/generated/client';
import { validateAvatar, getRandomAvatar, AllowedAvatar, isValidAvatar } from '@/utils/avatarUtils';
import { validateUsername } from '@/utils/usernameValidator';
import createLogger from '@/utils/logger';
import type {
    LoginResponse,
    RegisterResponse,
    UpgradeAccountResponse,
    PasswordResetResponse,
    PasswordResetConfirmResponse,
    AuthStatusResponse,
    ErrorResponse,
    ProfileUpdateResponse,
    TeacherUpgradeResponse,
    SendEmailVerificationResponse,
    VerifyEmailResponse,
    ResendEmailVerificationResponse
} from '@shared/types/api/responses';
import type {
    LoginRequest,
    RegisterRequest,
    UpgradeAccountRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    ProfileUpdateRequest,
    TeacherUpgradeRequest,
    SendEmailVerificationRequest,
    VerifyEmailRequest,
    ResendEmailVerificationRequest
} from '@shared/types/api/requests';
import {
    LoginRequestSchema,
    RegisterRequestSchema,
    UpgradeAccountRequestSchema,
    PasswordResetRequestSchema,
    PasswordResetConfirmRequestSchema,
    ProfileUpdateRequestSchema,
    TeacherUpgradeRequestSchema,
    SendEmailVerificationRequestSchema,
    VerifyEmailRequestSchema,
    ResendEmailVerificationRequestSchema
} from '@shared/types/api/schemas';

// Create a route-specific logger
const logger = createLogger('AuthAPI');
const router = express.Router();

/**
 * Logout endpoint
 * POST /api/v1/auth/logout
 * Clears all authentication cookies and returns a success message
 */
router.post('/logout', (req, res) => {
    // Clear both teacher and student auth cookies
    res.clearCookie('teacherToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
});
// ...existing code...

// ...existing code...

// Create a singleton instance or allow injection for testing
let userServiceInstance: UserService | null = null;

const getUserService = (): UserService => {
    if (!userServiceInstance) {
        userServiceInstance = new UserService();
    }
    return userServiceInstance;
};

// Function to inject mock service for testing
export const __setUserServiceForTesting = (mockService: UserService): void => {
    userServiceInstance = mockService;
};

/**
 * Generic auth endpoint that handles multiple actions
 * POST /api/v1/auth
 */
router.post('/', async (req: Request, res: Response<LoginResponse | RegisterResponse | ErrorResponse>): Promise<void> => {
    try {
        const { action } = req.body;

        switch (action) {
            case 'login':
                await handleUniversalLogin(req, res);
                break;
            case 'teacher_login':
                // Legacy support - redirect to universal login
                await handleUniversalLogin(req, res);
                break;
            case 'teacher_register':
            case 'teacher_signup':
                await handleTeacherRegister(req, res);
                break;
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        logger.error({ error }, 'Error in auth endpoint');
        res.status(500).json({ error: 'An error occurred during authentication' });
    }
});

/**
 * Universal login handler - determines user role automatically
 */
async function handleUniversalLogin(req: Request, res: Response<LoginResponse | ErrorResponse>): Promise<void> {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    try {
        const result = await getUserService().loginUser({
            email,
            password,
        });

        // Return appropriate response format based on user role
        if (!result.user || !result.token) {
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }

        if (result.user.role === UserRole.TEACHER) {
            // Set teacher token cookie for middleware
            res.cookie('teacherToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Teacher response format for frontend compatibility
            res.status(200).json({
                message: 'Login successful',
                enseignant: {
                    id: result.user.id,
                    username: result.user.username
                }, enseignantId: result.user.id,
                username: result.user.username,
                avatar: result.user.avatarEmoji, // avatarEmoji is now mandatory
                cookie_id: `teacher_${result.user.id}_${Date.now()}`,
                token: result.token,
                role: 'TEACHER'
            });
        } else if (result.user.role === UserRole.STUDENT) {
            // Set auth token cookie for middleware
            res.cookie('authToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Student response format
            res.status(200).json({
                success: true,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    username: result.user.username,
                    avatar: result.user.avatarEmoji, // avatarEmoji is now mandatory
                    role: 'STUDENT'
                },
                token: result.token,
                message: 'Login successful'
            });
        } else {
            // Generic response for other roles - default to student cookie
            res.cookie('authToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(200).json({
                success: true,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    username: result.user.username,
                    avatar: result.user.avatarEmoji, // avatarEmoji is now mandatory
                    role: result.user.role
                },
                token: result.token,
                message: 'Login successful'
            });
        }
    } catch (error) {
        logger.error({ error }, 'Error in universal login');

        // Handle specific error types
        if (error instanceof Error) {
            // Email verification required
            if (error.message.includes('Please verify your email')) {
                res.status(403).json({ error: error.message });
                return;
            }

            // Authentication errors
            if (error.message.includes('Invalid email') || error.message.includes('Invalid password')) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }
        }

        res.status(500).json({ error: 'An error occurred during login' });
    }
}

/**
 * Handle teacher login (legacy - now redirects to universal login)
 */
async function handleTeacherLogin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    try {
        const result = await getUserService().loginUser({
            email,
            password,
        });

        if (!result.user || !result.token) {
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }

        if (result.user.role !== UserRole.TEACHER) {
            res.status(403).json({ error: 'Not a teacher account' });
            return;
        }

        // Set teacher token cookie for middleware
        res.cookie('teacherToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return in the format expected by frontend
        res.status(200).json({
            message: 'Login successful',
            enseignant: {
                id: result.user.id,
                username: result.user.username
            },
            enseignantId: result.user.id,
            username: result.user.username,
            avatar: result.user.avatarEmoji, // Use user's avatar instead of random
            cookie_id: `teacher_${result.user.id}_${Date.now()}`,
            token: result.token
        });
    } catch (error) {
        logger.error({ error }, 'Error in teacher login');

        // Handle authentication errors
        if (error instanceof Error && (
            error.message.includes('Invalid email') ||
            error.message.includes('Invalid password')
        )) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        res.status(500).json({ error: 'An error occurred during login' });
    }
}

/**
 * Handle teacher registration
 */
async function handleTeacherRegister(req: Request, res: Response<RegisterResponse | ErrorResponse>): Promise<void> {
    const { username, email, password, nom, prenom, adminPassword, avatar } = req.body;

    // Basic validation
    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }

    // Validate username format (must be a valid French firstname + optional character)
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
        res.status(400).json({ error: usernameValidation.error || 'Invalid username format' });
        return;
    }

    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long' });
        return;
    }

    // Validate admin password for teacher registration
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
        res.status(403).json({ error: 'Invalid admin password' });
        return;
    }

    // Validate avatar if provided, otherwise use random animal emoji
    let validatedAvatar: string;
    if (avatar) {
        try {
            validateAvatar(avatar);
            validatedAvatar = avatar;
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid avatar' });
            return;
        }
    } else {
        validatedAvatar = getRandomAvatar();
    }

    try {
        // Register the user as a TEACHER
        const result = await getUserService().registerUser({
            username,
            email,
            password,
            role: UserRole.TEACHER,
            avatarEmoji: validatedAvatar,
        });

        if (!result.user || !result.token) {
            res.status(500).json({ error: 'Registration failed' });
            return;
        }

        // For teacher accounts with email - DO NOT set auth cookies until email is verified
        logger.info('Teacher registered - email verification required', {
            userId: result.user.id,
            email: email,
            emailVerified: result.user.emailVerified || false
        });

        // Return response without setting cookies or including token
        res.status(201).json({
            success: true,
            user: {
                id: result.user.id,
                email: result.user.email || email,
                username: result.user.username,
                avatar: validatedAvatar,
                role: 'TEACHER',
                emailVerified: false
            },
            // Do NOT include token in response for unverified users
            message: 'Teacher account created successfully. Please verify your email before logging in.',
            requiresEmailVerification: true
        });
    } catch (error) {
        logger.error({ error }, 'Error in teacher registration');

        // Handle specific errors
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({ error: error.message });
            return;
        }

        res.status(500).json({ error: 'An error occurred during registration' });
    }
}

/**
 * Universal registration endpoint
 * POST /api/v1/auth/register
 * Handles: guest registration, student registration, teacher registration
 */
router.post('/register', validateRequestBody(RegisterRequestSchema), async (req: Request, res: Response<RegisterResponse | ErrorResponse>): Promise<void> => {
    try {
        const { username, avatar, cookieId, email, password, role = 'STUDENT', adminPassword } = req.body;

        // Basic validation
        if (!username) {
            res.status(400).json({
                success: false,
                error: 'Username is required'
            });
            return;
        }

        // Validate username format (must be a valid French firstname + optional character)
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.isValid) {
            res.status(400).json({
                success: false,
                error: usernameValidation.error || 'Invalid username format'
            });
            return;
        }

        // Validate avatar
        let validatedAvatar: AllowedAvatar;
        if (avatar) {
            try {
                validateAvatar(avatar);
                validatedAvatar = avatar as AllowedAvatar;
            } catch (error) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid avatar. Must be a valid animal emoji.'
                });
                return;
            }
        } else {
            validatedAvatar = getRandomAvatar();
        }

        // For authenticated accounts (with email/password)
        if (email && password) {
            if (password.length < 6) {
                res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long'
                });
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
                return;
            }

            // Check if email already exists
            try {
                const existingUser = await getUserService().getUserByEmail(email);
                if (existingUser) {
                    res.status(400).json({
                        success: false,
                        error: 'Email already exists'
                    });
                    return;
                }
            } catch (error) {
                // User not found is expected - continue
            }

            // For teacher registration, validate admin password
            if (role === 'TEACHER') {
                const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
                if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
                    res.status(403).json({
                        success: false,
                        error: 'Invalid admin password'
                    });
                    return;
                }
                logger.info('Teacher registration attempt', { username, email, adminPassword: !!adminPassword });
            }
        } else if (email && !password) {
            // Email provided but no password - invalid for authenticated accounts
            res.status(400).json({
                success: false,
                error: 'Password is required when email is provided'
            });
            return;
        } else if (!email && !cookieId) {
            // Guest registration must have cookieId
            res.status(400).json({
                success: false,
                error: 'cookieId is required for guest user registration'
            });
            return;
        }

        // Register the user
        const result = await getUserService().registerUser({
            username,
            email,
            password,
            role: role as UserRole,
            cookieId,
            avatarEmoji: validatedAvatar
        });

        if (!result.user || !result.token) {
            res.status(500).json({ error: 'Registration failed' });
            return;
        }

        logger.info('User registered successfully', {
            userId: result.user.id,
            username,
            role,
            hasEmail: !!email,
            hasCookieId: !!cookieId,
            emailVerified: result.user.emailVerified || false
        });

        // For users with email - DO NOT set auth cookies until email is verified
        if (email) {
            logger.info('Email verification required - not setting auth cookies', {
                userId: result.user.id,
                email: email
            });

            res.status(201).json({
                success: true,
                user: {
                    id: result.user.id,
                    email: result.user.email,
                    username: result.user.username,
                    avatar: result.user.avatarEmoji,
                    role: result.user.role,
                    emailVerified: false
                },
                // Do NOT include token in response for unverified users
                message: 'Account created successfully. Please verify your email before logging in.',
                requiresEmailVerification: true
            });
            return;
        }

        // For guest users (no email) - set cookies as before
        // Set appropriate cookie based on user role
        if (result.user.role === UserRole.TEACHER) {
            res.cookie('teacherToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        } else {
            // Default to student cookie for STUDENT and other roles
            res.cookie('authToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }

        res.status(201).json({
            success: true,
            user: {
                id: result.user.id,
                email: result.user.email,
                username: result.user.username,
                avatar: validatedAvatar,
                role: result.user.role
            },
            token: result.token,
            message: 'Registration successful'
        });
    } catch (error) {
        logger.error({ error }, 'Error in user registration');

        if (error instanceof Error) {
            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    error: error.message
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            error: 'An error occurred during registration'
        });
    }
});

/**
 * Universal upgrade endpoint
 * POST /api/v1/auth/upgrade
 * Handles: guest→student, student→teacher, guest→teacher
 */
router.post('/upgrade', validateRequestBody(UpgradeAccountRequestSchema), async (req: Request, res: Response<UpgradeAccountResponse | ErrorResponse>): Promise<void> => {
    try {
        const { cookieId, email, password, targetRole = 'STUDENT', adminPassword } = req.body;

        // Validation
        if (!cookieId) {
            res.status(400).json({
                success: false,
                error: 'Cookie ID is required'
            });
            return;
        }

        if (!email || !password) {
            res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters long'
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
            return;
        }

        // Check if email already exists
        try {
            const existingUserByEmail = await getUserService().getUserByEmail(email);
            if (existingUserByEmail) {
                res.status(400).json({
                    success: false,
                    error: 'Email already exists'
                });
                return;
            }
        } catch (error) {
            // User not found is expected - continue
        }

        // Find existing user by cookieId
        const existingUser = await getUserService().getUserByCookieId(cookieId);
        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: 'User not found. Please register first.'
            });
            return;
        }

        // For teacher upgrade, validate admin password
        if (targetRole === 'TEACHER') {
            const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
            if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
                res.status(403).json({
                    success: false,
                    error: 'Invalid admin password'
                });
                return;
            }
            logger.info('Teacher upgrade attempt validated', {
                userId: existingUser.id,
                username: existingUser.username,
                adminPassword: !!adminPassword
            });
        }

        // Update existing user instead of creating new one
        const result = await getUserService().upgradeUser(existingUser.id, {
            email,
            password,
            targetRole: targetRole as UserRole
        });

        if (!result.user || !result.token) {
            res.status(500).json({ error: 'User upgrade failed' });
            return;
        }

        logger.info('User upgraded successfully', {
            userId: existingUser.id,
            username: existingUser.username,
            fromRole: existingUser.role,
            toRole: targetRole,
            email
        });

        // Set appropriate cookie based on user role
        if (result.user.role === UserRole.TEACHER) {
            res.cookie('teacherToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        } else {
            // Default to student cookie for STUDENT and other roles
            res.cookie('authToken', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: result.user.id,
                email: result.user.email,
                username: result.user.username,
                avatar: existingUser.avatarEmoji || getRandomAvatar(),
                role: result.user.role
            },
            token: result.token,
            message: 'Account upgraded successfully'
        });
    } catch (error) {
        logger.error({ error }, 'Error upgrading user account');

        if (error instanceof Error) {
            if (error.message.includes('already exists')) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
                return;
            }
        }

        res.status(500).json({
            success: false,
            error: 'An error occurred during account upgrade'
        });
    }
});

/**
 * Universal login endpoint (for backwards compatibility)
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response<LoginResponse | ErrorResponse>): Promise<void> => {
    await handleUniversalLogin(req, res);
});

/**
 * Password reset request endpoint
 * POST /api/v1/auth/reset-password
 */
router.post('/reset-password', validateRequestBody(PasswordResetRequestSchema), async (req: Request, res: Response<PasswordResetResponse | ErrorResponse>): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Request password reset with email sending
        await getUserService().requestPasswordReset(email);

        logger.info('Password reset requested', { email });

        res.status(200).json({
            message: 'Password reset email sent if account exists',
            success: true
        });
    } catch (error) {
        logger.error({ error }, 'Error in password reset');

        // Return success even if user doesn't exist for security
        res.status(200).json({
            message: 'Password reset email sent if account exists',
            success: true
        });
    }
});

/**
 * Password reset confirmation endpoint
 * POST /api/v1/auth/reset-password/confirm
 */
router.post('/reset-password/confirm', validateRequestBody(PasswordResetConfirmRequestSchema), async (req: Request, res: Response<PasswordResetConfirmResponse | ErrorResponse>): Promise<void> => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password are required' });
            return;
        }

        if (newPassword.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }

        // Reset password using token
        await getUserService().resetPasswordWithToken(token, newPassword);

        logger.info('Password reset completed successfully');

        res.status(200).json({
            message: 'Password reset successful'
        });
    } catch (error) {
        logger.error({ error }, 'Error in password reset confirmation');

        if (error instanceof Error) {
            if (error.message.includes('Invalid or expired')) {
                res.status(400).json({ error: 'Invalid or expired reset token' });
                return;
            }
            if (error.message.includes('User not found')) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
        }

        res.status(500).json({ error: 'An error occurred during password reset' });
    }
});

/**
 * Send email verification
 * POST /api/v1/auth/send-email-verification
 */
router.post('/send-email-verification', validateRequestBody(SendEmailVerificationRequestSchema), async (req: Request, res: Response<SendEmailVerificationResponse | ErrorResponse>): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Send email verification
        await getUserService().sendEmailVerification(email);

        logger.info('Email verification sent', { email });

        res.status(200).json({
            message: 'Verification email sent if account exists',
            success: true
        });
    } catch (error) {
        logger.error({ error }, 'Error sending email verification');

        // Return success even if user doesn't exist for security
        res.status(200).json({
            message: 'Verification email sent if account exists',
            success: true
        });
    }
});

/**
 * Verify email with token
 * POST /api/v1/auth/verify-email
 */
router.post('/verify-email', validateRequestBody(VerifyEmailRequestSchema), async (req: Request, res: Response<VerifyEmailResponse | ErrorResponse>): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            res.status(400).json({ error: 'Verification token is required' });
            return;
        }

        // Verify email using token
        const result = await getUserService().verifyEmail(token);

        logger.info('Email verification attempted', { token: token.substring(0, 8) + '...', success: result.success });

        if (result.success) {
            // Get the verified user to set authentication cookies
            const user = result.user;
            if (user && result.token) {
                // Set appropriate cookie based on user role
                if (user.role === 'TEACHER') {
                    res.cookie('teacherToken', result.token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                } else {
                    res.cookie('authToken', result.token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                    });
                }

                logger.info('Authentication cookies set after email verification', {
                    userId: user.id,
                    role: user.role
                });
            }

            res.status(200).json({
                message: result.message,
                success: true,
                user: result.user // Include user data in response
            });
        } else {
            res.status(400).json({
                error: result.message
            });
        }
    } catch (error) {
        logger.error({ error }, 'Error in email verification');
        res.status(500).json({ error: 'An error occurred during email verification' });
    }
});

/**
 * Resend email verification
 * POST /api/v1/auth/resend-email-verification
 */
router.post('/resend-email-verification', validateRequestBody(ResendEmailVerificationRequestSchema), async (req: Request, res: Response<ResendEmailVerificationResponse | ErrorResponse>): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Resend email verification (same as send)
        await getUserService().sendEmailVerification(email);

        logger.info('Email verification resent', { email });

        res.status(200).json({
            message: 'Verification email sent if account exists',
            success: true
        });
    } catch (error) {
        logger.error({ error }, 'Error resending email verification');

        // Return success even if user doesn't exist for security
        res.status(200).json({
            message: 'Verification email sent if account exists',
            success: true
        });
    }
});

/**
 * Check authentication status
 * GET /api/v1/auth/status
 * Returns authentication status for the current user
 */
router.get('/status', optionalAuth, async (req: Request, res: Response<AuthStatusResponse | ErrorResponse>): Promise<void> => {
    try {
        // Check if user is authenticated
        const isAuthenticated = !!(req.user?.userId);

        if (!isAuthenticated) {
            // Anonymous user
            res.status(200).json({
                authState: 'anonymous',
                cookiesFound: 0,
                cookieNames: [],
                hasAuthToken: false,
                hasTeacherToken: false,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // User is authenticated - fetch complete profile
        const userService = getUserService();
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        let user;
        try {
            user = await userService.getUserById(userId);
        } catch (dbError) {
            logger.error({ error: dbError, userId, userRole }, 'Failed to fetch user profile from database');
            // Fallback to basic user info from JWT
            user = {
                id: userId,
                username: req.user!.username || 'Utilisateur',
                avatarEmoji: '👤', // Default avatar
                email: undefined,
                role: userRole
            };
        }

        // Determine auth state - distinguish between guest users and actual students
        let authState: 'teacher' | 'student' | 'guest' = 'student';
        if (userRole === 'TEACHER') {
            authState = 'teacher';
        } else if (userRole === 'STUDENT') {
            // Check if user has email (actual student) or no email (guest)
            authState = user?.email ? 'student' : 'guest';
        }

        // Legacy fields for backward compatibility
        const isTeacher = userRole === 'TEACHER';
        const teacherId = isTeacher ? userId : undefined;

        logger.debug('Auth status check', {
            authState,
            isTeacher,
            teacherId,
            userRole,
            userId,
            hasUserProfile: !!user
        });

        res.status(200).json({
            authState,
            cookiesFound: 2, // Placeholder - actual cookie count would need req.cookies inspection
            cookieNames: isTeacher ? ['teacherToken'] : ['authToken'],
            hasAuthToken: !isTeacher,
            hasTeacherToken: isTeacher,
            timestamp: new Date().toISOString(),
            user: user ? {
                id: user.id,
                username: user.username || 'Utilisateur',
                avatar: user.avatarEmoji || '🐼',
                email: user.email || undefined,
                role: userRole as 'STUDENT' | 'TEACHER'
            } : undefined,
            // Legacy fields for backward compatibility
            isTeacher,
            teacherId
        });
    } catch (error) {
        logger.error({ error }, 'Error checking auth status');
        res.status(500).json({ error: 'An error occurred while checking authentication status' });
    }
});

/**
 * Update user profile (username and avatar)
 * PUT /api/v1/auth/profile
 * Updates the profile for authenticated students and teachers
 */
router.put('/profile', optionalAuth, validateRequestBody(ProfileUpdateRequestSchema), async (req: Request, res: Response<ProfileUpdateResponse | ErrorResponse>): Promise<void> => {
    try {
        const { username, avatar } = req.body;

        if (!username || !avatar) {
            res.status(400).json({ error: 'Username and avatar are required' });
            return;
        }

        // Validate avatar
        try {
            validateAvatar(avatar);
        } catch (error) {
            res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid avatar' });
            return;
        }

        // Check if user is authenticated (student or teacher)
        if (!req.user?.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const userService = getUserService();

        // Update user profile
        const updatedUser = await userService.updateUserProfile(req.user.userId, { username, avatar });

        logger.info('Profile updated successfully', {
            userId: req.user.userId,
            username,
            avatar
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email || undefined,
                username: updatedUser.username,
                avatar: updatedUser.avatarEmoji || '🤖',
                role: updatedUser.role
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error updating profile');
        res.status(500).json({ error: 'An error occurred while updating profile' });
    }
});

/**
 * Upgrade authenticated student to teacher
 * POST /api/v1/auth/upgrade-to-teacher
 * Requires authentication via cookie and admin password
 */
router.post('/upgrade-to-teacher', optionalAuth, validateRequestBody(TeacherUpgradeRequestSchema), async (req: Request, res: Response<TeacherUpgradeResponse | ErrorResponse>): Promise<void> => {
    try {
        const { adminPassword } = req.body;

        // Check if user is authenticated
        if (!req.user?.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // TODO: Validate admin password
        // For now, we'll implement basic validation - you should replace this with your actual admin password logic
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Set this in your environment
        if (adminPassword !== ADMIN_PASSWORD) {
            res.status(403).json({ error: 'Invalid admin password' });
            return;
        }

        // Get current user
        const currentUser = await getUserService().getUserById(req.user.userId);
        if (!currentUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if user is already a teacher
        if (currentUser.role === 'TEACHER') {
            res.status(400).json({ error: 'User is already a teacher' });
            return;
        }

        // Check if user is a student (has email)
        if (!currentUser.email) {
            res.status(400).json({ error: 'Only student accounts can be upgraded to teacher' });
            return;
        }

        // Upgrade the user to teacher using the new role upgrade method
        const result = await getUserService().upgradeUserRole(currentUser.id, 'TEACHER' as UserRole);

        // Check if the upgrade was successful
        if (!result.success || !result.token || !result.user) {
            res.status(500).json({ error: 'User upgrade failed' });
            return;
        }

        // Set teacher token cookie
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };

        res.cookie('teacherToken', result.token, cookieOptions);
        // Clear any existing auth token since they're now a teacher
        res.clearCookie('authToken');

        logger.info('Student upgraded to teacher successfully', {
            userId: currentUser.id,
            username: currentUser.username,
            email: currentUser.email
        });

        res.status(200).json({
            success: true,
            message: 'Account upgraded to teacher successfully',
            token: result.token,
            user: {
                id: result.user.id,
                username: result.user.username,
                email: result.user.email,
                avatar: result.user.avatarEmoji || '🐼',
                role: result.user.role
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error upgrading student to teacher');
        res.status(500).json({ error: 'An error occurred while upgrading account' });
    }
});

export default router;
