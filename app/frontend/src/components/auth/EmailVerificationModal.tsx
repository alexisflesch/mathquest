/**
 * EmailVerificationModal Component
 * 
 * A modal component that informs users about email verification requirement
 * after successful registration. Uses the existing SharedModal component
 * and provides French text for user instructions.
 * 
 * Features:
 * - Clear French instructions about email verification
 * - Resend verification email functionality  
 * - Loading states for resend action
 * - Error handling for resend failures
 * - Success feedback when email is resent
 */

import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import InfoModal from '@/components/SharedModal';

interface EmailVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    onResendEmail?: () => Promise<void>;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
    isOpen,
    onClose,
    userEmail,
    onResendEmail
}) => {
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [resendError, setResendError] = useState('');

    const handleResendEmail = async () => {
        if (!onResendEmail) return;

        setIsResending(true);
        setResendStatus('idle');
        setResendError('');

        try {
            await onResendEmail();
            setResendStatus('success');
        } catch (error) {
            setResendStatus('error');
            setResendError(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <InfoModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 justify-center">
                    <Mail className="w-6 h-6 text-[color:var(--primary)]" />
                    <span>Vérification de votre email</span>
                </div>
            }
            size="md"
            closeOnBackdrop={false}
            closeOnEscape={false}
        >
            <div className="space-y-4 text-left">
                {/* Main message */}
                <div className="space-y-3">
                    <p className="text-[color:var(--muted-foreground)] text-sm leading-relaxed">
                        Un email de vérification a été envoyé à <strong className="text-[color:var(--foreground)]">{userEmail}</strong>.
                        Veuillez cliquer sur le lien dans cet email pour activer votre compte.
                    </p>
                </div>

                {/* Status messages */}
                {resendStatus === 'success' && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <p className="text-green-700 text-sm">Email de vérification renvoyé avec succès !</p>
                    </div>
                )}

                {resendStatus === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-red-700 text-sm">{resendError}</p>
                    </div>
                )}

                {/* Instructions */}
                <div className="space-y-2 text-[color:var(--muted-foreground)] text-sm">
                    <p>📧 Vérifiez votre boîte de réception (et vos spams)</p>
                    <p>🔗 Cliquez sur le lien de vérification</p>
                    <p>✅ Revenez vous connecter une fois votre compte vérifié</p>
                </div>

                {/* Action buttons */}
                <div className="dialog-modal-actions">
                    {onResendEmail && (
                        <button
                            onClick={handleResendEmail}
                            disabled={isResending}
                            className="dialog-modal-btn flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email'}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="dialog-modal-btn"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </InfoModal>
    );
};

export default EmailVerificationModal;
