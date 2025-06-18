import express, { Request, Response } from 'express';
import { optionalAuth } from '@/middleware/auth';
import { validateRequestBody } from '@/middleware/validation';
import { UserService } from '@/core/services/userService';
import { UserRole } from '@/db/generated/client';
import { validateAvatar, getRandomAvatar, AllowedAvatar, isValidAvatar } from '@/utils/avatarUtils';
import createLogger from '@/utils/logger';
import type {
    LoginResponse,
    RegisterResponse,
    UpgradeAccountResponse,
    PasswordResetResponse,
    PasswordResetConfirmResponse,
    AuthStatusResponse,
    ProfileUpdateResponse,
    ErrorResponse
} from '@shared/types/api/responses';
import type {
    LoginRequest,
    RegisterRequest,
    TeacherRegisterRequest,
    UpgradeAccountRequest,
    PasswordResetRequest,
    PasswordResetConfirmRequest,
    ProfileUpdateRequest
} from '@shared/types/api/requests';
import {
    LoginRequestSchema,
    RegisterRequestSchema,
    UpgradeAccountRequestSchema,
    PasswordResetRequestSchema,
    PasswordResetConfirmRequestSchema,
    ProfileUpdateRequestSchema
} from '@shared/types/api/schemas';

// Create a route-specific logger
const logger = createLogger('AuthAPI');

const router = express.Router();

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
router.post('/', validateRequestBody(LoginRequestSchema.or(RegisterRequestSchema)), async (req: Request, res: Response<LoginResponse | RegisterResponse | ErrorResponse>): Promise<void> => {
    try {
        const { action, email, password, username } = req.body;

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

        // Set teacher token cookie for middleware
        res.cookie('teacherToken', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return in the format expected by frontend AuthProvider
        res.status(201).json({
            success: true,
            user: {
                id: result.user.id,
                email: result.user.email || email,
                username: result.user.username,
                avatar: validatedAvatar,
                role: 'TEACHER'
            },
            token: result.token,
            message: 'Registration successful'
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
            hasCookieId: !!cookieId
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
            // TODO: Implement admin password validation
            logger.info('Teacher upgrade attempt', {
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

        // Generate reset token
        const resetToken = await getUserService().generatePasswordResetToken(email);

        logger.info('Password reset token generated', { email, tokenLength: resetToken.length });

        // In a real implementation, you would send an email with reset link
        // For development/testing, we'll return the token in the response
        // TODO: Implement email sending service
        res.status(200).json({
            message: 'Password reset email sent if account exists',
            // Remove this in production - only for development
            resetToken: resetToken
        });
    } catch (error) {
        logger.error({ error }, 'Error in password reset');

        // Return success even if user doesn't exist for security
        res.status(200).json({
            message: 'Password reset email sent if account exists'
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
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email || undefined,
                username: updatedUser.username,
                avatar: updatedUser.avatarEmoji || '�',
                role: updatedUser.role
            }
        });
    } catch (error) {
        logger.error({ error }, 'Error updating profile');
        res.status(500).json({ error: 'An error occurred while updating profile' });
    }
});

export default router;
