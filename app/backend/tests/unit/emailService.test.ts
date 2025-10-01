// Mock logger first before any imports
jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }))
}));

// Mock Brevo
jest.mock('@getbrevo/brevo', () => ({
    TransactionalEmailsApi: jest.fn().mockImplementation(() => ({
        setApiKey: jest.fn(),
        sendTransacEmail: jest.fn().mockResolvedValue({
            body: { messageId: 'test-message-id' }
        })
    })),
    SendSmtpEmail: jest.fn(),
    TransactionalEmailsApiApiKeys: {
        apiKey: 'test-api-key'
    }
}));

import { EmailService } from '@/core/services/emailService';

describe('EmailService', () => {
    let emailService: EmailService;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();

        // Set test environment variables
        process.env = {
            ...originalEnv,
            BREVO_API_KEY: 'test-api-key',
            BREVO_SENDER_EMAIL: 'test@kutsum.org',
            BREVO_SENDER_NAME: 'Kutsum Test',
            FRONTEND_URL: 'http://localhost:3008',
            APP_NAME: 'Kutsum Test'
        };

        emailService = new EmailService();
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('constructor', () => {
        test('should initialize with configuration when API key is provided', () => {
            expect(emailService).toBeDefined();
        });

        test('should handle missing API key gracefully', () => {
            delete process.env.BREVO_API_KEY;
            const serviceWithoutApiKey = new EmailService();
            expect(serviceWithoutApiKey).toBeDefined();
        });

        test('should use default values when environment variables are missing', () => {
            delete process.env.BREVO_SENDER_EMAIL;
            delete process.env.BREVO_SENDER_NAME;
            delete process.env.FRONTEND_URL;
            delete process.env.APP_NAME;

            const serviceWithDefaults = new EmailService();
            expect(serviceWithDefaults).toBeDefined();
        });
    });

    describe('sendVerificationEmail', () => {
        test('should send verification email successfully', async () => {
            await expect(emailService.sendVerificationEmail(
                'test@example.com',
                'verification-token-123',
                'testuser'
            )).resolves.not.toThrow();
        });

        test('should call sendTransacEmail with correct parameters', async () => {
            const mockSendTransacEmail = jest.fn().mockResolvedValue({
                body: { messageId: 'test-message-id' }
            });
            (emailService as any).apiInstance.sendTransacEmail = mockSendTransacEmail;

            await emailService.sendVerificationEmail(
                'test@example.com',
                'verification-token-123',
                'testuser'
            );

            expect(mockSendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [{ email: 'test@example.com' }],
                    subject: expect.stringContaining('Vérifiez'),
                    htmlContent: expect.stringContaining('testuser'),
                    textContent: expect.stringContaining('testuser')
                })
            );
        });
    });

    describe('sendPasswordResetEmail', () => {
        test('should send password reset email successfully', async () => {
            await expect(emailService.sendPasswordResetEmail(
                'test@example.com',
                'reset-token-123',
                'testuser'
            )).resolves.not.toThrow();
        });

        test('should call sendTransacEmail with correct parameters', async () => {
            const mockSendTransacEmail = jest.fn().mockResolvedValue({
                body: { messageId: 'test-message-id' }
            });
            (emailService as any).apiInstance.sendTransacEmail = mockSendTransacEmail;

            await emailService.sendPasswordResetEmail(
                'test@example.com',
                'reset-token-123',
                'testuser'
            );

            expect(mockSendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [{ email: 'test@example.com' }],
                    subject: expect.stringContaining('Réinitialisation'),
                    htmlContent: expect.stringContaining('testuser'),
                    textContent: expect.stringContaining('testuser')
                })
            );
        });
    });

    describe('sendWelcomeEmail', () => {
        test('should send welcome email successfully', async () => {
            await expect(emailService.sendWelcomeEmail(
                'test@example.com',
                'testuser'
            )).resolves.not.toThrow();
        });

        test('should call sendTransacEmail with correct parameters', async () => {
            const mockSendTransacEmail = jest.fn().mockResolvedValue({
                body: { messageId: 'test-message-id' }
            });
            (emailService as any).apiInstance.sendTransacEmail = mockSendTransacEmail;

            await emailService.sendWelcomeEmail(
                'test@example.com',
                'testuser'
            );

            expect(mockSendTransacEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: [{ email: 'test@example.com' }],
                    subject: expect.stringContaining('Bienvenue'),
                    htmlContent: expect.stringContaining('testuser'),
                    textContent: expect.stringContaining('testuser')
                })
            );
        });
    });

    describe('error handling', () => {
        test('should handle email sending failure', async () => {
            // Mock the API to throw an error
            const mockSendTransacEmail = jest.fn().mockRejectedValue(new Error('Network error'));
            (emailService as any).apiInstance.sendTransacEmail = mockSendTransacEmail;

            await expect(emailService.sendVerificationEmail(
                'test@example.com',
                'verification-token-123',
                'testuser'
            )).rejects.toThrow();
        });

        test('should handle missing API key configuration gracefully', async () => {
            // Create service without API key
            delete process.env.BREVO_API_KEY;
            const unconfiguredService = new EmailService();

            // Service should not throw but should warn about missing configuration
            await expect(unconfiguredService.sendVerificationEmail(
                'test@example.com',
                'verification-token-123',
                'testuser'
            )).resolves.not.toThrow();
        });
    });
});
