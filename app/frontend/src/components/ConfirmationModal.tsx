/**
 * ConfirmationModal Component
 * 
 * A reusable modal component for confirmation dialogs.
 * Provides a clean interface for destructive actions like deletions.
 * 
 * Features:
 * - Customizable title, message, and button text
 * - Escape key and backdrop click to cancel
 * - Smooth animations
 * - Accessible with proper focus management
 * - Support for different button styles based on action type
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import InfinitySpin from '@/components/InfinitySpin';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    onConfirm,
    onCancel,
    type = 'danger',
    isLoading = false
}) => {
    // Handle escape key press
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onCancel, isLoading]);

    const getButtonStyles = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'warning':
                return 'bg-orange-600 hover:bg-orange-700 text-white';
            case 'info':
                return 'bg-[color:var(--primary)] hover:bg-[color:var(--primary)] hover:opacity-90 text-[color:var(--primary-foreground)]';
            default:
                return 'bg-red-600 hover:bg-red-700 text-white';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'danger':
                return 'text-red-500';
            case 'warning':
                return 'text-orange-500';
            case 'info':
                return 'text-[color:var(--primary)]';
            default:
                return 'text-red-500';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => {
                    if (e.target === e.currentTarget && !isLoading) {
                        onCancel();
                    }
                }}
            >
                <motion.div
                    className="bg-[color:var(--card)] rounded-lg p-6 w-full max-w-md mx-4 relative shadow-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-opacity-20 ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-orange-500' : 'bg-[color:var(--primary)]'}`}>
                                <AlertTriangle size={20} className={getIconColor()} />
                            </div>
                            <h3 className="text-lg font-semibold text-[color:var(--foreground)]">
                                {title}
                            </h3>
                        </div>
                        {!isLoading && (
                            <button
                                onClick={onCancel}
                                className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    {/* Message */}
                    <p className="text-[color:var(--muted-foreground)] mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <InfinitySpin
                                        size={16}
                                        trailColor={type === 'info' ? 'var(--primary-foreground)' : 'white'}
                                    />
                                    <span>Suppression...</span>
                                </div>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConfirmationModal;
