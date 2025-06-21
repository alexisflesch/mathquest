/**
 * InfoModal Component
 * 
 * A simple, consistent modal component for displaying information pop-ups.
 * Provides unified styling, animations, and behavior across the application.
 * 
 * Use cases:
 * - Practice session stats
 * - Access code displays
 * - Simple information dialogs
 * - Success/completion messages
 * 
 * Features:
 * - Consistent animations with framer-motion
 * - Escape key and backdrop click handling
 * - Dark theme compatibility
 * - Flexible title (text or React node)
 * - Responsive sizing
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string | React.ReactNode;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    className?: string;
    children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({
    isOpen,
    onClose,
    title,
    size = 'md',
    showCloseButton = true,
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
    children,
}) => {
    // Handle escape key press
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && closeOnEscape) {
                onClose();
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
    }, [isOpen, onClose, closeOnEscape]);

    // Size configurations
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'max-w-sm';
            case 'md':
                return 'max-w-md';
            case 'lg':
                return 'max-w-lg';
            default:
                return 'max-w-md';
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-0">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleBackdropClick}
                    />

                    {/* Modal */}
                    <motion.div
                        className={`relative bg-[color:var(--card)] rounded-lg shadow-lg w-full ${getSizeClasses()} border border-[color:var(--border)] p-6 mx-4 text-[color:var(--foreground)] ${className}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex justify-between items-center mb-4">
                                {title && (
                                    <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
                                )}
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                                        aria-label="Close modal"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                        {/* Content */}
                        <div>{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InfoModal;
