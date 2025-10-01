/**
 * Email Service for sending verification and password reset emails
 * Uses Brevo (formerly Sendinblue) as the email service provider
 */

import * as brevo from '@getbrevo/brevo';
import createLogger from '@/utils/logger';

const logger = createLogger('EmailService');

interface EmailTemplate {
    to: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    templateData?: Record<string, any>;
}

interface EmailVerificationData {
    username: string;
    verificationUrl: string;
    expirationHours: number;
}

interface PasswordResetData {
    username: string;
    resetUrl: string;
    expirationHours: number;
}

export class EmailService {
    private apiInstance: brevo.TransactionalEmailsApi;
    private senderEmail: string;
    private senderName: string;
    private frontendUrl: string;
    private appName: string;
    private isConfigured: boolean;

    constructor() {
        // Initialize Brevo client
        this.apiInstance = new brevo.TransactionalEmailsApi();

        const apiKey = process.env.BREVO_API_KEY;
        this.isConfigured = !!apiKey;

        if (!apiKey) {
            logger.warn('BREVO_API_KEY not set - email sending will be disabled');
        } else {
            this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
        }

    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@kutsum.org';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Kutsum';
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
    this.appName = process.env.APP_NAME || 'Kutsum';

        logger.info('EmailService initialized', {
            isConfigured: this.isConfigured,
            senderEmail: this.senderEmail,
            senderName: this.senderName,
            frontendUrl: this.frontendUrl
        });
    }

    /**
     * Send email verification email to user
     */
    async sendVerificationEmail(email: string, token: string, username: string): Promise<void> {
        const verificationUrl = `${this.frontendUrl}/verify-email/${token}`;
        const expirationHours = 24;

        const template = this.createVerificationEmailTemplate({
            username,
            verificationUrl,
            expirationHours
        });

        await this.sendEmail({
            to: email,
            subject: `Vérifiez votre adresse email - ${this.appName}`,
            htmlContent: template.html,
            textContent: template.text
        });

        logger.info('Verification email sent', {
            email,
            username,
            tokenLength: token.length
        });
    }

    /**
     * Send password reset email to user
     */
    async sendPasswordResetEmail(email: string, token: string, username: string): Promise<void> {
        const resetUrl = `${this.frontendUrl}/reset-password/confirm/${token}`;
        const expirationHours = 1;

        const template = this.createPasswordResetEmailTemplate({
            username,
            resetUrl,
            expirationHours
        });

        await this.sendEmail({
            to: email,
            subject: `Réinitialisation de votre mot de passe - ${this.appName}`,
            htmlContent: template.html,
            textContent: template.text
        });

        logger.info('Password reset email sent', {
            email,
            username,
            tokenLength: token.length
        });
    }

    /**
     * Send welcome email after successful verification
     */
    async sendWelcomeEmail(email: string, username: string): Promise<void> {
        const template = this.createWelcomeEmailTemplate(username);

        await this.sendEmail({
            to: email,
            subject: `Bienvenue sur ${this.appName} !`,
            htmlContent: template.html,
            textContent: template.text
        });

        logger.info('Welcome email sent', {
            email,
            username
        });
    }

    /**
     * Generic email sending method with retry logic for reliability
     */
    private async sendEmail(emailData: EmailTemplate): Promise<void> {
        if (!process.env.BREVO_API_KEY) {
            logger.warn('Email sending skipped - BREVO_API_KEY not configured', {
                to: emailData.to,
                subject: emailData.subject
            });
            return;
        }

        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const sendSmtpEmail = new brevo.SendSmtpEmail();

                sendSmtpEmail.sender = {
                    name: this.senderName,
                    email: this.senderEmail
                };

                sendSmtpEmail.to = [{ email: emailData.to }];
                sendSmtpEmail.subject = emailData.subject;
                sendSmtpEmail.htmlContent = emailData.htmlContent;
                sendSmtpEmail.textContent = emailData.textContent;

                const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

                logger.info('Email sent successfully', {
                    to: emailData.to,
                    subject: emailData.subject,
                    messageId: result.body?.messageId || 'unknown',
                    attempt
                });

                return; // Success, exit retry loop

            } catch (error) {
                logger.warn(`Email send attempt ${attempt}/${maxRetries} failed`, {
                    error: error instanceof Error ? error.message : String(error),
                    to: emailData.to,
                    subject: emailData.subject,
                    attempt
                });

                // If this is not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Final attempt failed
                    logger.error('Email sending failed after all retry attempts', {
                        error: error instanceof Error ? error.message : String(error),
                        to: emailData.to,
                        subject: emailData.subject,
                        maxRetries
                    });
                    throw new Error('Failed to send email after retries');
                }
            }
        }
    }

    /**
     * Create email verification template
     */
    private createVerificationEmailTemplate(data: EmailVerificationData): { html: string; text: string } {
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérifiez votre adresse email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body> 
    <div class="content">
        <h2>Bonjour ${data.username} !</h2>
        
        <p>Merci de vous être inscrit(e) sur ${this.appName}. Pour activer votre compte, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center;">
            <a href="${data.verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">Vérifier mon adresse email</a>
        </div>
        
        <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">${data.verificationUrl}</p>
        
        <div class="warning">
            <strong>⏰ Important :</strong> Ce lien de vérification expire dans ${data.expirationHours} heures. Si le lien expire, vous pourrez demander un nouveau lien depuis votre tableau de bord.
        </div>
    </div>
    
    <div class="footer">
        <p>Si vous n'avez pas créé de compte sur ${this.appName}, vous pouvez ignorer cet email en toute sécurité.</p>
    </div>
</body>
</html>`;

        const text = `
Bonjour ${data.username} !

Merci de vous être inscrit(e) sur ${this.appName}. Pour activer votre compte, veuillez vérifier votre adresse email en visitant ce lien :

${data.verificationUrl}

IMPORTANT : Ce lien expire dans ${data.expirationHours} heures.

Une fois votre email vérifié, vous pourrez :
- Participer à des tournois de mathématiques
- Créer vos propres quiz (enseignants)
- Suivre vos progrès et statistiques
- Accéder à toutes les fonctionnalités de la plateforme

Si vous n'avez pas créé de compte sur ${this.appName}, vous pouvez ignorer cet email.

© 2025 ${this.appName}
`;

        return { html, text };
    }

    /**
     * Create password reset template
     */
    private createPasswordResetEmailTemplate(data: PasswordResetData): { html: string; text: string } {
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de votre mot de passe</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        .security-notice { background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 ${this.appName}</h1>
        <p>Réinitialisation de mot de passe</p>
    </div>
    
    <div class="content">
        <h2>Bonjour ${data.username},</h2>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur ${this.appName}. Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
        
        <div style="text-align: center;">
            <a href="${data.resetUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        
        <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; background-color: #f1f5f9; padding: 10px; border-radius: 4px; font-family: monospace;">${data.resetUrl}</p>
        
        <div class="security-notice">
            <strong>🔒 Sécurité :</strong>
            <ul style="margin: 10px 0;">
                <li>Ce lien expire dans ${data.expirationHours} heure(s)</li>
                <li>Il ne peut être utilisé qu'une seule fois</li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
            </ul>
        </div>
        
        <p><strong>Conseils pour un mot de passe sécurisé :</strong></p>
        <ul>
            <li>Utilisez au moins 8 caractères</li>
            <li>Mélangez lettres majuscules et minuscules</li>
            <li>Incluez des chiffres et caractères spéciaux</li>
            <li>Évitez les mots de passe trop simples</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>Si vous n'avez pas demandé cette réinitialisation, votre compte est toujours sécurisé et vous pouvez ignorer cet email.</p>
        <p>© 2025 ${this.appName}. Tous droits réservés.</p>
    </div>
</body>
</html>`;

        const text = `
Bonjour ${data.username},

Vous avez demandé la réinitialisation de votre mot de passe sur ${this.appName}.

Pour créer un nouveau mot de passe, visitez ce lien :
${data.resetUrl}

SÉCURITÉ :
- Ce lien expire dans ${data.expirationHours} heure(s)
- Il ne peut être utilisé qu'une seule fois
- Si vous n'avez pas demandé cette réinitialisation, ignorez cet email

Conseils pour un mot de passe sécurisé :
- Utilisez au moins 8 caractères
- Mélangez lettres majuscules et minuscules
- Incluez des chiffres et caractères spéciaux
- Évitez les mots de passe trop simples

© 2025 ${this.appName}
`;

        return { html, text };
    }

    /**
     * Create welcome email template
     */
    private createWelcomeEmailTemplate(username: string): { html: string; text: string } {
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue sur ${this.appName}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
        .feature-box { background-color: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 ${this.appName}</h1>
        <p>Votre compte est maintenant vérifié !</p>
    </div>
    
    <div class="content">
        <h2>Félicitations ${username} !</h2>
        
        <p>Votre adresse email a été vérifiée avec succès. Bienvenue dans la communauté ${this.appName} ! 🚀</p>
        
        <div style="text-align: center;">
            <a href="${this.frontendUrl}" class="button">Commencer à jouer</a>
        </div>
        
        <h3>Découvrez ce que vous pouvez faire :</h3>
        
        <div class="feature-box">
            <h4>🏆 Participez aux tournois</h4>
            <p>Rejoignez des tournois de mathématiques en temps réel et défiez d'autres joueurs !</p>
        </div>
        
        <div class="feature-box">
            <h4>📊 Suivez vos progrès</h4>
            <p>Consultez vos statistiques, vos meilleurs scores et votre évolution dans le temps.</p>
        </div>
        
        <div class="feature-box">
            <h4>🎯 Entraînez-vous</h4>
            <p>Pratiquez avec des quiz personnalisés selon votre niveau et vos préférences.</p>
        </div>
        
        <div class="feature-box">
            <h4>👥 Mode classe (Enseignants)</h4>
            <p>Créez des quiz pour vos élèves et suivez leurs performances en temps réel.</p>
        </div>
        
        <p><strong>Besoin d'aide ?</strong> N'hésitez pas à explorer la plateforme et à découvrir toutes ses fonctionnalités. Amusez-vous bien ! 🎮</p>
    </div>
    
    <div class="footer">
        <p>Merci de faire partie de la communauté ${this.appName} !</p>
        <p>© 2025 ${this.appName}. Tous droits réservés.</p>
    </div>
</body>
</html>`;

        const text = `
Félicitations ${username} !

Votre adresse email a été vérifiée avec succès. Bienvenue dans la communauté ${this.appName} !

Visitez la plateforme : ${this.frontendUrl}

Découvrez ce que vous pouvez faire :

🏆 PARTICIPEZ AUX TOURNOIS
Rejoignez des tournois de mathématiques en temps réel et défiez d'autres joueurs !

📊 SUIVEZ VOS PROGRÈS  
Consultez vos statistiques, vos meilleurs scores et votre évolution dans le temps.

🎯 ENTRAÎNEZ-VOUS
Pratiquez avec des quiz personnalisés selon votre niveau et vos préférences.

👥 MODE CLASSE (Enseignants)
Créez des quiz pour vos élèves et suivez leurs performances en temps réel.

Besoin d'aide ? N'hésitez pas à explorer la plateforme et à découvrir toutes ses fonctionnalités. Amusez-vous bien !

Merci de faire partie de la communauté ${this.appName} !
© 2025 ${this.appName}
`;

        return { html, text };
    }
}

// Export singleton instance
export const emailService = new EmailService();
